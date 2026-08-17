import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import {
  Plus, Trash2, Shield, Calendar, FileText, Upload, X,
  Sparkles, ChevronDown, ChevronUp, Pencil, Phone, Globe,
  AlertCircle, Users,
} from "lucide-react";
import { enviarMensagemIA } from "../data/aiChatApi";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

// ── interfaces ────────────────────────────────────────────────────────────────
interface CamposSeguro {
  tipo: string; seguradora: string; apolice: string; nrCertificado: string;
  dataInicio: string; dataFim: string; cobertura: string; limiteCobertura: string;
  franquia: string; valor: number; beneficiarios: string; assistencia24h: string;
  siteSinistro: string; emailSinistro: string; prazoCarencia: string;
  areaCobertura: string; contatoEmergencia: string; telefoneEmergencia: string;
  observacoes: string;
}

interface DocSeguro {
  id: number; nome: string; tipo: string; arquivo: string;
  analise?: string;           // "ok" | "erro" | ""
  dadosIA?: CamposSeguro;
  expandido?: boolean;
  mostrarForm?: boolean;
  formEdicao?: CamposSeguro;
  sugestoesCobertura?: boolean;
}

interface Seguro extends CamposSeguro {
  id: number;
  voucher: string | null; voucherTipo: "pdf" | "imagem" | null; voucherNome: string;
  documentos: DocSeguro[];
}

interface SeguroFormProps {
  seguros: Seguro[];
  onSegurosChange: (seguros: Seguro[]) => void;
}

const tiposSeguro = [
  "Saúde / Médico", "Bagagem", "Cancelamento", "Extravio de Documentos",
  "Responsabilidade Civil", "Acidentes Pessoais", "Multirisco",
  "Assistência Viagem", "Automóvel (Locação)", "Outro",
];

const coberturasSugestoes = [
  "Despesas médicas e hospitalares", "Repatriação médica e funerária",
  "Extravio de bagagem", "Cancelamento / interrupção de viagem",
  "Atraso de voo", "Indenização por invalidez",
  "Assistência farmacêutica", "Cobertura para COVID-19",
];

const camposVazio: CamposSeguro = {
  tipo: "", seguradora: "", apolice: "", nrCertificado: "",
  dataInicio: "", dataFim: "", cobertura: "", limiteCobertura: "",
  franquia: "", valor: 0, beneficiarios: "", assistencia24h: "",
  siteSinistro: "", emailSinistro: "", prazoCarencia: "", areaCobertura: "",
  contatoEmergencia: "", telefoneEmergencia: "", observacoes: "",
};

const formVazio: Omit<Seguro, "id"> = {
  ...camposVazio,
  voucher: null, voucherTipo: null, voucherNome: "", documentos: [],
};

function diaParaIAParaForm(j: CamposSeguro, prev: CamposSeguro): CamposSeguro {
  return {
    tipo:               tiposSeguro.includes(j.tipo) ? j.tipo : prev.tipo || j.tipo,
    seguradora:         j.seguradora        || prev.seguradora,
    apolice:            j.apolice           || prev.apolice,
    nrCertificado:      j.nrCertificado     || prev.nrCertificado,
    dataInicio:         j.dataInicio        || prev.dataInicio,
    dataFim:            j.dataFim           || prev.dataFim,
    cobertura:          j.cobertura         || prev.cobertura,
    limiteCobertura:    j.limiteCobertura   || prev.limiteCobertura,
    franquia:           j.franquia          || prev.franquia,
    valor:              parseFloat(String(j.valor ?? "").replace(/[^0-9.,]/g,"").replace(",",".") || "0") || prev.valor,
    beneficiarios:      j.beneficiarios     || prev.beneficiarios,
    assistencia24h:     j.assistencia24h    || prev.assistencia24h,
    siteSinistro:       j.siteSinistro      || prev.siteSinistro,
    emailSinistro:      j.emailSinistro     || prev.emailSinistro,
    prazoCarencia:      j.prazoCarencia     || prev.prazoCarencia,
    areaCobertura:      j.areaCobertura     || prev.areaCobertura,
    contatoEmergencia:  j.contatoEmergencia || prev.contatoEmergencia,
    telefoneEmergencia: j.telefoneEmergencia|| prev.telefoneEmergencia,
    observacoes:        j.observacoes       || prev.observacoes,
  };
}

export default function SeguroForm({ seguros, onSegurosChange }: SeguroFormProps) {
  const [documentos, setDocumentos] = useState<DocSeguro[]>([]);
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [vouchersMinimizado, setVouchersMinimizado] = useState(true);
  const [erros, setErros] = useState<Record<number, string>>({});
  const [erroAnaliseIA, setErroAnaliseIA] = useState<string | null>(null);
  const [editandoSeguroId, setEditandoSeguroId] = useState<number | null>(null);
  const [formEdicaoSeguro, setFormEdicaoSeguro] = useState<CamposSeguro>(camposVazio);
  const [infoEditMinimizado, setInfoEditMinimizado] = useState(true);
  const [sugestoesEditCobertura, setSugestoesEditCobertura] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // ── upload docs ───────────────────────────────────────────────────────────
  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    if (!arquivos.length) return;
    const novos = await Promise.all(
      arquivos.map((arquivo) =>
        new Promise<DocSeguro>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({
            id: Date.now() + Math.floor(Math.random() * 10000),
            nome: arquivo.name, tipo: arquivo.type,
            arquivo: String(reader.result || ""), analise: "", expandido: true,
          });
          reader.onerror = () => reject(new Error("Falha ao carregar arquivo."));
          reader.readAsDataURL(arquivo);
        })
      )
    );
    setDocumentos((prev) => [...prev, ...novos]);
    e.target.value = "";
  }

  const patchDoc = (id: number, patch: Partial<DocSeguro>) =>
    setDocumentos((prev) => prev.map((d) => d.id === id ? { ...d, ...patch } : d));

  const removerDocumento = (id: number) =>
    setDocumentos((prev) => prev.filter((d) => d.id !== id));

  const patchForm = (id: number, patch: Partial<CamposSeguro>) =>
    setDocumentos((prev) => prev.map((d) =>
      d.id === id ? { ...d, formEdicao: { ...d.formEdicao!, ...patch } } : d
    ));

  // ── análise IA ────────────────────────────────────────────────────────────
  async function analisarDocumentosComIA() {
    if (!documentos.length) return;
    setAnalisandoIA(true);
    setErroAnaliseIA(null);
    const provedores: ("openai"|"groq"|"gemini"|"openrouter"|"cloudflare")[] =
      ["groq","openai","gemini","openrouter","cloudflare"];

    try {
      const novasAnalises = await Promise.all(
        documentos.map(async (doc) => {
          let contexto = `Nome do arquivo: ${doc.nome}\n\n`;
          let temConteudo = false;
          if (doc.tipo === "application/pdf" && doc.arquivo) {
            try {
              const pdf = await pdfjsLib.getDocument({ data: atob(doc.arquivo.split(",")[1]) }).promise;
              let txt = "";
              for (let i = 1; i <= pdf.numPages; i++) {
                const pg = await pdf.getPage(i);
                const ct = await pg.getTextContent();
                txt += ct.items.map((it: any) => ("str" in it ? it.str : "")).join(" ") + "\n";
              }
              contexto += `--- Conteúdo: ${doc.nome} ---\n${txt}\n--- Fim ---\n\n`;
              temConteudo = true;
            } catch { contexto += `--- Erro ao ler PDF ---\n`; }
          }

          const prompt = `Analise o documento de seguro e responda SOMENTE JSON válido sem markdown.

Contexto:
${contexto}

JSON esperado:
{"tipo":"","seguradora":"","apolice":"","nrCertificado":"","dataInicio":"","dataFim":"","cobertura":"","limiteCobertura":"","franquia":"","valor":"","beneficiarios":"","assistencia24h":"","siteSinistro":"","emailSinistro":"","prazoCarencia":"","areaCobertura":"","contatoEmergencia":"","telefoneEmergencia":"","observacoes":""}

Regras: campos não encontrados = "". dataInicio/dataFim = YYYY-MM-DD. valor/limiteCobertura/franquia = número sem R$. tipo = um de: Saúde / Médico, Bagagem, Cancelamento, Multirisco, Assistência Viagem, Automóvel (Locação), Outro. Não invente dados.${!temConteudo ? " Conteúdo ilegível, use nome do arquivo." : ""}`;

          try {
            let data: any;
            let ultimoErro: string = "";
            for (const p of provedores) {
              try {
                data = await enviarMensagemIA([{ role: "user", content: prompt }], p);
                if (data) break;
              } catch (err) {
                ultimoErro = err instanceof Error ? err.message : "Erro desconhecido";
                console.error(`Erro com provedor ${p}:`, ultimoErro);
              }
            }
            if (!data) {
              throw new Error(`Todos os provedores falharam. Último erro: ${ultimoErro}`);
            }
            const limpo = data.reply.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
            const j: CamposSeguro = JSON.parse(limpo);
            const fe = diaParaIAParaForm(j, camposVazio);
            return { ...doc, dadosIA: j, analise: "ok", expandido: true, mostrarForm: true, formEdicao: fe };
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
            console.error("Erro ao analisar documento:", errorMsg);
            return { ...doc, analise: "erro", expandido: true };
          }
        })
      );

      // Manter todos os documentos na lista com seus formulários populados
      // O usuário poderá editar e salvar cada um individualmente
      setDocumentos(novasAnalises);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("Erro geral na análise:", errorMsg);
      setErroAnaliseIA(`Falha na análise com IA: ${errorMsg}`);
    } finally {
      setAnalisandoIA(false);
    }
  }

  // ── salvar seguro a partir de um doc ────────────────────────────────────
  function salvarDoDoc(doc: DocSeguro) {
    const f = doc.formEdicao!;
    if (!f.tipo || !f.seguradora) {
      setErros((prev) => ({ ...prev, [doc.id]: "Preencha Tipo e Seguradora." }));
      return;
    }
    setErros((prev) => { const n = { ...prev }; delete n[doc.id]; return n; });
    onSegurosChange([...seguros, { ...formVazio, ...f, id: Date.now(), documentos: [doc] }]);
    removerDocumento(doc.id);
  }

  // ── editar seguro existente ──────────────────────────────────────────────
  const removerSeguro = (id: number) => onSegurosChange(seguros.filter((s) => s.id !== id));

  function iniciarEdicaoSeguro(seg: Seguro) {
    setEditandoSeguroId(seg.id);
    setFormEdicaoSeguro({ ...camposVazio, ...seg });
    setInfoEditMinimizado(false);
  }

  function salvarEdicaoSeguro() {
    if (!formEdicaoSeguro.tipo || !formEdicaoSeguro.seguradora) return;
    onSegurosChange(seguros.map((s) =>
      s.id === editandoSeguroId ? { ...s, ...formEdicaoSeguro } : s
    ));
    setEditandoSeguroId(null);
  }

  // ── helpers UI ───────────────────────────────────────────────────────────
  function toggleCoberturaDoc(id: number, c: string) {
    const fe = documentos.find((d) => d.id === id)?.formEdicao;
    if (!fe) return;
    const list = fe.cobertura ? fe.cobertura.split(", ").map((x) => x.trim()) : [];
    const nova = list.includes(c) ? list.filter((x) => x !== c) : [...list, c];
    patchForm(id, { cobertura: nova.join(", ") });
  }

  function toggleCoberturaEdit(c: string) {
    const list = formEdicaoSeguro.cobertura ? formEdicaoSeguro.cobertura.split(", ").map((x) => x.trim()) : [];
    const nova = list.includes(c) ? list.filter((x) => x !== c) : [...list, c];
    setFormEdicaoSeguro((p) => ({ ...p, cobertura: nova.join(", ") }));
  }

  const fi = (
    label: string, placeholder: string, value: string,
    onChange: (v: string) => void, required?: boolean
  ) => (
    <div>
      <Label className="text-xs">{label}{required && <span className="text-red-500"> *</span>}</Label>
      <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1" />
    </div>
  );

  // ── sub-render: formulário inline por arquivo ─────────────────────────────
  function renderFormDoc(doc: DocSeguro) {
    if (!doc.mostrarForm || !doc.formEdicao) return null;
    const f = doc.formEdicao;
    const mini = !doc.expandido;
    return (
      <div className="border-t border-indigo-100 bg-white px-3 pb-3 pt-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
            <Shield className="h-3 w-3" /> Editar Seguro
          </p>
          <Button type="button" variant="ghost" size="sm"
            onClick={() => patchDoc(doc.id, { expandido: !doc.expandido })}
            className="h-6 gap-1 px-2 text-[10px] text-gray-500">
            {mini ? <><ChevronDown className="h-3 w-3" />Expandir</> : <><ChevronUp className="h-3 w-3" />Minimizar</>}
          </Button>
        </div>

        {!mini && (
          <>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Identificação</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
              <div>
                <Label className="text-xs">Tipo <span className="text-red-500">*</span></Label>
                <select value={f.tipo} onChange={(e) => patchForm(doc.id, { tipo: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                  <option value="">Selecione</option>
                  {tiposSeguro.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {fi("Seguradora","Ex: SulAmérica", f.seguradora,(v)=>patchForm(doc.id,{seguradora:v}),true)}
              {fi("Nº da Apólice","Ex: AP-2025-001", f.apolice,(v)=>patchForm(doc.id,{apolice:v}))}
              {fi("Nº do Certificado","Ex: CERT-0001", f.nrCertificado,(v)=>patchForm(doc.id,{nrCertificado:v}))}
              {fi("Área de Cobertura","Ex: Mundial", f.areaCobertura,(v)=>patchForm(doc.id,{areaCobertura:v}))}
              {fi("Beneficiários","Ex: João, Maria", f.beneficiarios,(v)=>patchForm(doc.id,{beneficiarios:v}))}
            </div>

            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Vigência e Valores</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
              <div><Label className="text-xs">Data Início</Label>
                <Input type="date" value={f.dataInicio} onChange={(e)=>patchForm(doc.id,{dataInicio:e.target.value})} className="mt-1"/></div>
              <div><Label className="text-xs">Data Fim</Label>
                <Input type="date" value={f.dataFim} onChange={(e)=>patchForm(doc.id,{dataFim:e.target.value})} className="mt-1"/></div>
              <div><Label className="text-xs">Valor (R$)</Label>
                <Input type="number" min="0" step="0.01" placeholder="0,00" value={f.valor||""}
                  onChange={(e)=>patchForm(doc.id,{valor:parseFloat(e.target.value)||0})} className="mt-1"/></div>
              {fi("Limite Cobertura (R$)","Ex: 30000", f.limiteCobertura,(v)=>patchForm(doc.id,{limiteCobertura:v}))}
              {fi("Franquia (R$)","Ex: 500", f.franquia,(v)=>patchForm(doc.id,{franquia:v}))}
              {fi("Prazo de Carência","Ex: 30 dias", f.prazoCarencia,(v)=>patchForm(doc.id,{prazoCarencia:v}))}
            </div>

            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Cobertura</p>
            <div className="mb-3">
              <div className="flex gap-2">
                <Input placeholder="Ex: Médico, Bagagem" value={f.cobertura}
                  onChange={(e)=>patchForm(doc.id,{cobertura:e.target.value})} className="flex-1"/>
                <Button variant="outline" size="sm"
                  onClick={()=>patchDoc(doc.id,{sugestoesCobertura:!doc.sugestoesCobertura})}
                  className="text-xs whitespace-nowrap">
                  {doc.sugestoesCobertura?"Fechar":"Sugestões"}
                </Button>
              </div>
              {doc.sugestoesCobertura && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200 flex flex-wrap gap-1.5">
                  {coberturasSugestoes.map((c) => {
                    const ativo = f.cobertura.split(", ").map((x)=>x.trim()).includes(c);
                    return (
                      <button key={c} type="button" onClick={()=>toggleCoberturaDoc(doc.id,c)}
                        className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${ativo?"bg-indigo-100 text-indigo-700 border-indigo-300":"bg-white text-gray-500 border-gray-300 hover:bg-gray-100"}`}>
                        {ativo&&"✓ "}{c}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Contato e Sinistro</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
              {fi("Contato de Emergência","Nome", f.contatoEmergencia,(v)=>patchForm(doc.id,{contatoEmergencia:v}))}
              {fi("Telefone de Emergência","+55 11 99999-9999", f.telefoneEmergencia,(v)=>patchForm(doc.id,{telefoneEmergencia:v}))}
              {fi("Assistência 24h","Ex: 0800-123-456", f.assistencia24h,(v)=>patchForm(doc.id,{assistencia24h:v}))}
              {fi("Site Sinistro","Ex: seg.com/sinistro", f.siteSinistro,(v)=>patchForm(doc.id,{siteSinistro:v}))}
              {fi("E-mail Sinistro","Ex: sin@seg.com", f.emailSinistro,(v)=>patchForm(doc.id,{emailSinistro:v}))}
            </div>

            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Observações</p>
            <textarea value={f.observacoes} onChange={(e)=>patchForm(doc.id,{observacoes:e.target.value})}
              placeholder="Informações adicionais..." rows={2}
              className="w-full mb-3 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"/>
          </>
        )}

        {erros[doc.id] && <p className="text-xs text-red-500 mb-2">{erros[doc.id]}</p>}
        <Button onClick={()=>salvarDoDoc(doc)} className="w-full gap-2 bg-green-600 hover:bg-green-700 text-sm">
          <Plus className="w-4 h-4"/>Salvar Seguro
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Vouchers / Apólices ───────────────────────────────────────────── */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="flex items-center gap-2 font-semibold text-gray-900">
            <FileText className="h-4 w-4 text-indigo-500" />
            Vouchers / Apólices
          </h4>
          <Button type="button" variant="ghost" size="sm"
            onClick={() => setVouchersMinimizado((p) => !p)}
            className="gap-2 text-gray-600 hover:text-gray-900">
            {vouchersMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>

        {!vouchersMinimizado && (
          <>
            <div onClick={() => docFileInputRef.current?.click()}
              className="mb-3 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors bg-white">
              <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
              <p className="text-xs text-gray-500">Clique para anexar arquivos</p>
              <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG, etc.</p>
            </div>
            <input ref={docFileInputRef} type="file" multiple onChange={handleDocUpload} className="hidden" />

            {documentos.length === 0 ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed p-4 text-xs text-gray-400 bg-white mb-3">
                Nenhum anexo adicionado.
              </div>
            ) : (
              <div className="space-y-2 mb-3">
                {documentos.map((doc) => (
                  <div key={doc.id} className="rounded-md border border-gray-200 bg-white overflow-hidden">
                    {/* cabeçalho do arquivo */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
                      <FileText className="h-4 w-4 flex-shrink-0 text-indigo-400" />
                      <a href={doc.arquivo} download={doc.nome}
                        className="flex-1 truncate text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                        {doc.nome}
                      </a>
                      {doc.analise === "ok" && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">IA</span>
                      )}
                      {doc.analise === "erro" && (
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      )}
                      {doc.dadosIA && (
                        <button type="button"
                          onClick={() => patchDoc(doc.id, { mostrarForm: !doc.mostrarForm })}
                          className="p-1 text-indigo-400 hover:text-indigo-700 flex-shrink-0" title="Editar seguro">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button type="button" onClick={() => removerDocumento(doc.id)}
                        className="p-1 text-red-400 hover:text-red-600 flex-shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* dados resumidos da IA */}
                    {doc.analise === "ok" && doc.dadosIA && (
                      <div className="border-t border-gray-100 px-3 py-2 bg-indigo-50/40">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5 text-xs text-gray-700">
                          {doc.dadosIA.tipo        && <p><span className="text-gray-400">Tipo:</span> {doc.dadosIA.tipo}</p>}
                          {doc.dadosIA.seguradora   && <p><span className="text-gray-400">Seguradora:</span> {doc.dadosIA.seguradora}</p>}
                          {doc.dadosIA.apolice      && <p><span className="text-gray-400">Apólice:</span> {doc.dadosIA.apolice}</p>}
                          {doc.dadosIA.dataInicio   && <p><span className="text-gray-400">Início:</span> {doc.dadosIA.dataInicio}</p>}
                          {doc.dadosIA.dataFim      && <p><span className="text-gray-400">Fim:</span> {doc.dadosIA.dataFim}</p>}
                          {doc.dadosIA.valor        && <p><span className="text-gray-400">Valor:</span> R$ {doc.dadosIA.valor}</p>}
                          {doc.dadosIA.cobertura    && <p className="col-span-2 sm:col-span-3"><span className="text-gray-400">Cobertura:</span> {doc.dadosIA.cobertura}</p>}
                        </div>
                      </div>
                    )}
                    {doc.analise === "erro" && (
                      <div className="border-t border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                        Falha na análise. Tente novamente.
                      </div>
                    )}

                    {/* formulário inline por arquivo */}
                    {renderFormDoc(doc)}
                  </div>
                ))}
              </div>
            )}

            {erroAnaliseIA && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs text-red-600">{erroAnaliseIA}</p>
              </div>
            )}
            <Button type="button" variant="outline" size="sm"
              onClick={analisarDocumentosComIA}
              disabled={analisandoIA || documentos.length === 0}
              className="gap-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700">
              <Sparkles className={`w-4 h-4 ${analisandoIA ? "animate-spin" : ""}`} />
              {analisandoIA ? "Analisando..." : "Analisar com IA"}
            </Button>
          </>
        )}
      </Card>

      {/* ── Adicionar manualmente ─────────────────────────────────────────── */}
      {editandoSeguroId === null && (
        <div className="text-center">
          <Button variant="link"
            onClick={() => {
              setFormEdicaoSeguro(camposVazio);
              setEditandoSeguroId(-1);
              setInfoEditMinimizado(false);
            }}
            className="text-indigo-600 text-sm">
            Adicionar seguro manualmente
          </Button>
        </div>
      )}

      {/* ── Formulário manual / edição de seguro existente ───────────────── */}
      {editandoSeguroId !== null && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              {editandoSeguroId === -1 ? "Adicionar Seguro" : "Editar Seguro"}
            </h4>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm"
                onClick={() => setInfoEditMinimizado((p) => !p)}
                className="h-7 gap-1 text-xs text-gray-500">
                {infoEditMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                {infoEditMinimizado ? "Expandir" : "Minimizar"}
              </Button>
              <Button variant="ghost" size="icon"
                onClick={() => setEditandoSeguroId(null)}
                className="h-7 w-7 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!infoEditMinimizado && (
            <>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Identificação</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                <div>
                  <Label className="text-xs">Tipo <span className="text-red-500">*</span></Label>
                  <select value={formEdicaoSeguro.tipo}
                    onChange={(e) => setFormEdicaoSeguro((p) => ({ ...p, tipo: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                    <option value="">Selecione</option>
                    {tiposSeguro.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {fi("Seguradora","Ex: SulAmérica", formEdicaoSeguro.seguradora,(v)=>setFormEdicaoSeguro((p)=>({...p,seguradora:v})),true)}
                {fi("Nº da Apólice","Ex: AP-2025-001", formEdicaoSeguro.apolice,(v)=>setFormEdicaoSeguro((p)=>({...p,apolice:v})))}
                {fi("Nº do Certificado","Ex: CERT-0001", formEdicaoSeguro.nrCertificado,(v)=>setFormEdicaoSeguro((p)=>({...p,nrCertificado:v})))}
                {fi("Área de Cobertura","Ex: Mundial", formEdicaoSeguro.areaCobertura,(v)=>setFormEdicaoSeguro((p)=>({...p,areaCobertura:v})))}
                {fi("Beneficiários","Ex: João, Maria", formEdicaoSeguro.beneficiarios,(v)=>setFormEdicaoSeguro((p)=>({...p,beneficiarios:v})))}
              </div>

              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Vigência e Valores</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                <div><Label className="text-xs">Data Início</Label>
                  <Input type="date" value={formEdicaoSeguro.dataInicio} onChange={(e)=>setFormEdicaoSeguro((p)=>({...p,dataInicio:e.target.value}))} className="mt-1"/></div>
                <div><Label className="text-xs">Data Fim</Label>
                  <Input type="date" value={formEdicaoSeguro.dataFim} onChange={(e)=>setFormEdicaoSeguro((p)=>({...p,dataFim:e.target.value}))} className="mt-1"/></div>
                <div><Label className="text-xs">Valor (R$)</Label>
                  <Input type="number" min="0" step="0.01" placeholder="0,00" value={formEdicaoSeguro.valor||""}
                    onChange={(e)=>setFormEdicaoSeguro((p)=>({...p,valor:parseFloat(e.target.value)||0}))} className="mt-1"/></div>
                {fi("Limite Cobertura (R$)","Ex: 30000", formEdicaoSeguro.limiteCobertura,(v)=>setFormEdicaoSeguro((p)=>({...p,limiteCobertura:v})))}
                {fi("Franquia (R$)","Ex: 500", formEdicaoSeguro.franquia,(v)=>setFormEdicaoSeguro((p)=>({...p,franquia:v})))}
                {fi("Prazo de Carência","Ex: 30 dias", formEdicaoSeguro.prazoCarencia,(v)=>setFormEdicaoSeguro((p)=>({...p,prazoCarencia:v})))}
              </div>

              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Cobertura</p>
              <div className="mb-4">
                <div className="flex gap-2">
                  <Input placeholder="Ex: Médico, Bagagem" value={formEdicaoSeguro.cobertura}
                    onChange={(e)=>setFormEdicaoSeguro((p)=>({...p,cobertura:e.target.value}))} className="flex-1"/>
                  <Button variant="outline" size="sm" onClick={()=>setSugestoesEditCobertura((p)=>!p)}
                    className="text-xs whitespace-nowrap">{sugestoesEditCobertura?"Fechar":"Sugestões"}</Button>
                </div>
                {sugestoesEditCobertura && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200 flex flex-wrap gap-1.5">
                    {coberturasSugestoes.map((c) => {
                      const ativo = formEdicaoSeguro.cobertura.split(", ").map((x)=>x.trim()).includes(c);
                      return (
                        <button key={c} type="button" onClick={()=>toggleCoberturaEdit(c)}
                          className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${ativo?"bg-indigo-100 text-indigo-700 border-indigo-300":"bg-white text-gray-500 border-gray-300 hover:bg-gray-100"}`}>
                          {ativo&&"✓ "}{c}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Contato e Sinistro</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {fi("Contato de Emergência","Nome", formEdicaoSeguro.contatoEmergencia,(v)=>setFormEdicaoSeguro((p)=>({...p,contatoEmergencia:v})))}
                {fi("Telefone de Emergência","+55 11 99999-9999", formEdicaoSeguro.telefoneEmergencia,(v)=>setFormEdicaoSeguro((p)=>({...p,telefoneEmergencia:v})))}
                {fi("Assistência 24h","Ex: 0800-123-456", formEdicaoSeguro.assistencia24h,(v)=>setFormEdicaoSeguro((p)=>({...p,assistencia24h:v})))}
                {fi("Site Sinistro","Ex: seg.com/sinistro", formEdicaoSeguro.siteSinistro,(v)=>setFormEdicaoSeguro((p)=>({...p,siteSinistro:v})))}
                {fi("E-mail Sinistro","Ex: sin@seg.com", formEdicaoSeguro.emailSinistro,(v)=>setFormEdicaoSeguro((p)=>({...p,emailSinistro:v})))}
              </div>

              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Observações</p>
              <textarea value={formEdicaoSeguro.observacoes} onChange={(e)=>setFormEdicaoSeguro((p)=>({...p,observacoes:e.target.value}))}
                placeholder="Informações adicionais..." rows={2}
                className="w-full mb-4 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"/>
            </>
          )}

          <Button onClick={() => {
            if (!formEdicaoSeguro.tipo || !formEdicaoSeguro.seguradora) return;
            if (editandoSeguroId === -1) {
              onSegurosChange([...seguros, { ...formVazio, ...formEdicaoSeguro, id: Date.now() }]);
            } else {
              onSegurosChange(seguros.map((s) => s.id === editandoSeguroId ? { ...s, ...formEdicaoSeguro } : s));
            }
            setEditandoSeguroId(null);
          }} className="w-full gap-2 bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4" />
            {editandoSeguroId === -1 ? "Adicionar Seguro" : "Salvar Alterações"}
          </Button>
        </Card>
      )}

      {/* ── Lista de seguros adicionados ─────────────────────────────────── */}
      {seguros.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            Seguros Adicionados ({seguros.length})
          </h4>
          <div className="space-y-3">
            {seguros.map((seg) => (
              <div key={seg.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{seg.tipo}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{seg.seguradora}</span>
                    {seg.apolice && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{seg.apolice}</span>}
                    {seg.nrCertificado && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-mono">{seg.nrCertificado}</span>}
                  </div>
                  {(seg.dataInicio || seg.dataFim) && (
                    <p className="text-xs text-gray-600 mt-1">
                      <Calendar className="w-3 h-3 inline-block mr-0.5" />
                      {seg.dataInicio && new Date(seg.dataInicio).toLocaleDateString("pt-BR")}
                      {seg.dataInicio && seg.dataFim && " → "}
                      {seg.dataFim && new Date(seg.dataFim).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  {seg.areaCobertura && <p className="text-xs text-gray-500 mt-0.5"><Globe className="w-3 h-3 inline-block mr-0.5"/>{seg.areaCobertura}</p>}
                  {seg.cobertura && <p className="text-xs text-gray-600 mt-0.5"><Shield className="w-3 h-3 inline-block mr-0.5"/>{seg.cobertura}</p>}
                  {seg.valor > 0 && (
                    <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                      R$ {seg.valor.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}
                      {seg.limiteCobertura && <span className="font-normal text-gray-500"> · Limite: R$ {seg.limiteCobertura}</span>}
                    </p>
                  )}
                  {seg.beneficiarios && <p className="text-xs text-gray-500 mt-0.5"><Users className="w-3 h-3 inline-block mr-0.5"/>{seg.beneficiarios}</p>}
                  {(seg.assistencia24h || seg.telefoneEmergencia) && (
                    <p className="text-xs text-gray-500 mt-0.5"><Phone className="w-3 h-3 inline-block mr-0.5"/>{seg.assistencia24h || seg.telefoneEmergencia}</p>
                  )}
                  {seg.observacoes && <p className="text-xs text-gray-400 mt-0.5 italic">{seg.observacoes}</p>}
                  {seg.documentos?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {seg.documentos.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0"/>
                          <a href={doc.arquivo} download={doc.nome}
                            className="text-xs text-indigo-600 hover:text-indigo-800 truncate max-w-[220px]">{doc.nome}</a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                  <button onClick={() => iniciarEdicaoSeguro(seg)}
                    className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded transition-colors">
                    <Pencil className="w-4 h-4"/>
                  </button>
                  <button onClick={() => removerSeguro(seg.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-semibold text-gray-900">
              Total Seguros: R$ {seguros.reduce((sum,s)=>sum+(s.valor||0),0)
                .toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}
            </p>
          </div>
        </Card>
      )}

      {seguros.length === 0 && editandoSeguroId === null && (
        <div className="text-center py-8 text-gray-500 text-sm">
          Nenhum seguro adicionado.
        </div>
      )}
    </div>
  );
}

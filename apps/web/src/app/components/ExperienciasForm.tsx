import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import {
  Plus, Trash2, Search, MapPin, Star, Globe, Sparkles,
  FileText, Upload, X, Calendar, DollarSign,
  Package2, ChevronDown, ChevronUp, Link2, Phone, User,
  Info, AlertCircle,
} from "lucide-react";
import { buscarExperienciasDestino } from "../data/destinationsApi";
import { enviarMensagemIA } from "../data/aiChatApi";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

interface DocExperiencia {
  id: number;
  nome: string;
  tipo: string;
  arquivo: string;
  analise?: string;
}

interface Experiencia {
  id: number;
  nome: string;
  local: string;
  endereco: string;
  tipo: string;
  data: string;
  horario: string;
  duracao: string;
  qtdPessoas: number;
  preco: number;
  descricao: string;
  inclui: string;
  observacoes: string;
  // campos novos vindos do relatório IA
  operador: string;
  nomeGuia: string;
  nReserva: string;
  pontoEncontro: string;
  telefoneOperador: string;
  linkIngresso: string;
  politicaCancelamento: string;
  // voucher single-file (mantido)
  voucher: string | null;
  voucherTipo: "pdf" | "imagem" | null;
  voucherNome: string;
}

interface ExperienciasFormProps {
  experiencias: Experiencia[];
  onExperienciasChange: (experiencias: Experiencia[]) => void;
}

const tiposExperiencia = [
  "Passeio Turístico", "Aventura", "Cultural", "Gastronômico",
  "Relaxamento / Spa", "Ecoturismo", "Mergulho", "Trilha",
  "City Tour", "Show / Evento", "Museu", "Parque Temático",
  "Aula / Workshop", "Esportes", "Vida Noturna", "Fotografia", "Outro",
];

// ─── helpers para extrair campos do texto do relatório ──────────────────────

/** Extrai o valor de um campo do relatório IA dado um ou mais rótulos possíveis.
 *  Suporta tanto rótulos em negrito (**Label:**) como texto simples (Label:).
 *  Para campos multi-linha (política, descrição, observações) use extrairCampoMultilinha. */
function extrairCampo(texto: string, ...labels: string[]): string {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // aceita: **Label:** valor   |  Label: valor   |  **Label** valor
    const regex = new RegExp(
      `\\*{0,2}${escaped}\\*{0,2}\\s*:?\\s*([^\\n]+)`,
      "i"
    );
    const m = texto.match(regex);
    const val = m?.[1]
      ?.replace(/\*+/g, "")   // remove ** residuais
      .replace(/^[:]\s*/, "") // remove : inicial caso tenha ficado
      .trim();
    if (val && val.toLowerCase() !== "não informado" && val !== "-" && val !== "..." && val !== "") {
      return val;
    }
  }
  return "";
}

/** Extrai valor que pode ocupar múltiplas linhas (até o próximo campo em negrito). */
function extrairCampoMultilinha(texto: string, ...labels: string[]): string {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `\\*{0,2}${escaped}\\*{0,2}\\s*:?\\s*([\\s\\S]*?)(?=\\n\\*{1,2}[A-ZÀ-Ú]|$)`,
      "i"
    );
    const m = texto.match(regex);
    const val = m?.[1]
      ?.replace(/\*+/g, "")
      .trim();
    if (val && val.toLowerCase() !== "não informado" && val !== "-" && val !== "") {
      return val;
    }
  }
  return "";
}

/** Converte datas em vários formatos para ISO YYYY-MM-DD. */
function dataBrParaIso(raw: string): string {
  if (!raw) return "";
  // DD/MM/AAAA ou DD-MM-AAAA
  let m = raw.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // AAAA-MM-DD (já ISO)
  m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return "";
}

/** Normaliza horário para HH:MM a partir de strings como "14h30", "14:30", "14h". */
function normalizarHorario(raw: string): string {
  if (!raw) return "";
  // já no formato HH:MM
  let m = raw.match(/\b(\d{1,2}):(\d{2})\b/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  // 14h30 ou 14h
  m = raw.match(/\b(\d{1,2})h(\d{2})?\b/i);
  if (m) return `${m[1].padStart(2, "0")}:${m[2] ?? "00"}`;
  return "";
}

/** Extrai o primeiro valor monetário do texto (suporta "R$ 150,00", "150.00", etc). */
function extrairPreco(texto: string): number {
  // tenta o campo explícito Preço/Valor primeiro
  const campoPreco = extrairCampo(texto, "Preço", "Valor", "Custo");
  const fonte = campoPreco || texto;
  // Remove "R$" e espaços, depois parseia
  const limpo = fonte.replace(/R\$\s*/g, "").trim();
  // Formato "1.500,00" → 1500.00  |  "1500.00" → 1500
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo.replace(/[^\d.]/g, "");
  const n = parseFloat(normalizado);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function mapearRelatorioParaForm(relatorio: string) {
  const nome    = extrairCampo(relatorio,
    "Nome da Experiência", "Nome da Atração", "Nome do Passeio", "Atração", "Experiência", "Nome");
  const local   = extrairCampo(relatorio, "Local", "Cidade", "Destino");
  const end     = extrairCampo(relatorio,
    "Endereço / Ponto de Encontro", "Endereço", "Endereço completo");
  const ponto   = extrairCampo(relatorio,
    "Ponto de Encontro", "Local de Saída", "Local de Partida", "Ponto de partida");
  const dataBr  = extrairCampo(relatorio, "Data", "Data da Experiência", "Data do Passeio", "Data do Evento");
  const horario = extrairCampo(relatorio, "Horário", "Hora", "Hora de Saída", "Hora de início");
  const dur     = extrairCampo(relatorio, "Duração", "Tempo de Duração", "Tempo total");
  const qtd     = extrairCampo(relatorio, "Quantidade de Pessoas", "Nº de Pessoas", "Pessoas", "Pax", "Participantes");
  const incl    = extrairCampoMultilinha(relatorio, "Inclui", "O que está incluso", "Incluso", "Incluído", "O que inclui");
  const desc    = extrairCampoMultilinha(relatorio, "Descrição", "Sobre a Experiência", "Resumo", "Sobre o passeio");
  const obs     = extrairCampoMultilinha(relatorio, "Observações", "Informações Importantes", "Notas", "Importante");
  const oper    = extrairCampo(relatorio, "Operador", "Fornecedor", "Empresa", "Agência", "Organizado por");
  const guia    = extrairCampo(relatorio, "Nome do Guia", "Guia Responsável", "Guia", "Responsável");
  const reserva = extrairCampo(relatorio,
    "Nº de Reserva", "Número de Reserva", "Código de Reserva", "Reserva", "Localizador", "Voucher Nº", "Código", "Ref");
  const tel     = extrairCampo(relatorio, "Telefone", "WhatsApp", "Contato", "Tel", "Celular");
  const link    = extrairCampo(relatorio, "Link", "URL", "Site", "Link do Ingresso");
  const pol     = extrairCampoMultilinha(relatorio,
    "Política de Cancelamento", "Cancelamento", "Política de Alterações", "Reembolso");
  const tipo    = extrairCampo(relatorio, "Tipo de Experiência", "Categoria", "Tipo");

  return {
    nome,
    local,
    endereco: end || ponto,
    pontoEncontro: ponto || end,
    data: dataBrParaIso(dataBr),
    horario: normalizarHorario(horario),
    duracao: dur,
    qtdPessoas: parseInt(qtd) || 1,
    preco: extrairPreco(relatorio),
    inclui: incl,
    descricao: desc,
    observacoes: obs,
    operador: oper,
    nomeGuia: guia,
    nReserva: reserva,
    telefoneOperador: tel,
    linkIngresso: link,
    politicaCancelamento: pol,
    tipo,
  };
}

// ─── estado inicial ──────────────────────────────────────────────────────────
const formManualVazio = {
  nome: "", local: "", endereco: "", descricao: "", observacoes: "",
  operador: "", nomeGuia: "", nReserva: "", pontoEncontro: "",
  telefoneOperador: "", linkIngresso: "", politicaCancelamento: "",
};

const formDetalhesVazio = {
  data: "", horario: "", duracao: "", qtdPessoas: 1,
  preco: 0, tipo: "", inclui: "",
};

export default function ExperienciasForm({
  experiencias,
  onExperienciasChange,
}: ExperienciasFormProps) {
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [avisoTemporario, setAvisoTemporario] = useState("");
  const [buscou, setBuscou] = useState(false);
  const [selecionado, setSelecionado] = useState<any | null>(null);
  const [mostrarManual, setMostrarManual] = useState(false);
  const [formDetalhes, setFormDetalhes] = useState(formDetalhesVazio);
  const [formManual, setFormManual] = useState(formManualVazio);

  const [voucher, setVoucher] = useState<{
    base64: string; tipo: "pdf" | "imagem"; nome: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formManualRef = useRef<HTMLDivElement>(null);

  // documentos para análise IA
  const [documentos, setDocumentos] = useState<DocExperiencia[]>([]);
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [provedorIA, setProvedorIA] = useState<
    "automático" | "openai" | "groq" | "gemini" | "openrouter" | "cloudflare"
  >("automático");
  const [logAnalise, setLogAnalise] = useState<string[]>([]);
  const [vouchersMinimizado, setVouchersMinimizado] = useState(false);
  const [relatoriosExpandidos, setRelatoriosExpandidos] = useState<Set<number>>(new Set());
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [preenchidoComIA, setPreenchidoComIA] = useState(false);

  // ─── upload documentos ────────────────────────────────────────────────────
  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    if (!arquivos.length) return;
    const novos = await Promise.all(
      arquivos.map((arquivo) =>
        new Promise<DocExperiencia>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({
            id: Date.now() + Math.floor(Math.random() * 10000),
            nome: arquivo.name, tipo: arquivo.type,
            arquivo: String(reader.result || ""), analise: "",
          });
          reader.onerror = () => reject(new Error("Falha ao carregar arquivo."));
          reader.readAsDataURL(arquivo);
        })
      )
    );
    setDocumentos((prev) => [...prev, ...novos]);
    e.target.value = "";
  }

  function removerDocumento(id: number) {
    setDocumentos((prev) => prev.filter((d) => d.id !== id));
  }

  // ─── análise IA ──────────────────────────────────────────────────────────
  async function analisarDocumentosComIA() {
    if (!documentos.length) return;
    setAnalisandoIA(true);
    const logEntries: string[] = ["Iniciando análise com IA..."];
    setLogAnalise([...logEntries]);
    const addLog = (msg: string) => { logEntries.push(msg); setLogAnalise([...logEntries]); };

    const provedores: ("openai" | "groq" | "gemini" | "openrouter" | "cloudflare")[] =
      ["groq", "openai", "gemini", "openrouter", "cloudflare"];
    const cap: Record<string, string> = {
      openai: "OpenAI", groq: "Groq", gemini: "Gemini",
      openrouter: "OpenRouter", cloudflare: "Cloudflare",
    };

    const novasAnalises = await Promise.all(
      documentos.map(async (doc) => {
        let contexto = `Nome do arquivo: ${doc.nome}\n\n`;
        let temConteudo = false;

        if (doc.tipo === "application/pdf" && doc.arquivo) {
          try {
            const pdf = await pdfjsLib.getDocument({ data: atob(doc.arquivo.split(",")[1]) }).promise;
            let texto = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              const pg = await pdf.getPage(i);
              const ct = await pg.getTextContent();
              texto += ct.items.map((it: any) => ("str" in it ? it.str : "")).join(" ") + "\n";
            }
            contexto += `--- Conteúdo: ${doc.nome} ---\n${texto}\n--- Fim ---\n\n`;
            temConteudo = true;
          } catch { contexto += `--- Erro ao ler PDF: ${doc.nome} ---\n`; }
        }

        const prompt = `Você é um assistente especialista em turismo. Analise o documento de experiência/atração turística abaixo e responda SOMENTE com um objeto JSON válido, sem texto extra, sem markdown, sem \`\`\`.

Contexto:
${contexto}

Formato esperado (retorne exatamente este JSON com os campos preenchidos):
{
  "nome": "",
  "local": "",
  "endereco": "",
  "pontoEncontro": "",
  "tipo": "",
  "data": "",
  "horario": "",
  "duracao": "",
  "qtdPessoas": "",
  "preco": "",
  "inclui": "",
  "descricao": "",
  "operador": "",
  "nomeGuia": "",
  "nReserva": "",
  "telefone": "",
  "link": "",
  "politicaCancelamento": "",
  "observacoes": ""
}

Regras:
- Para campos não encontrados use string vazia "".
- data: formato DD/MM/AAAA.
- horario: formato HH:MM (ex: "14:30").
- preco: somente o número, sem R$ (ex: "150.00").
- qtdPessoas: somente o número (ex: "2").
- Não invente dados que não estão no documento.
${!temConteudo ? "- O conteúdo do arquivo não pôde ser lido; baseie a análise no nome do arquivo." : ""}`;

        const tentar = (p?: "openai" | "groq" | "gemini" | "openrouter" | "cloudflare") =>
          enviarMensagemIA([{ role: "user", content: prompt }], p);

        try {
          let data: any; let provedorUsado = "";
          if (provedorIA === "automático") {
            for (const p of provedores) {
              try { addLog(`Analisando "${doc.nome}" com ${cap[p]}...`); data = await tentar(p); provedorUsado = cap[p]; if (data) break; }
              catch { addLog(`Falha no ${cap[p]}, tentando próximo...`); }
            }
            if (!data) throw new Error("Todos os provedores falharam.");
          } else {
            provedorUsado = cap[provedorIA] || provedorIA;
            addLog(`Analisando "${doc.nome}" com ${provedorUsado}...`);
            data = await tentar(provedorIA);
          }
          // Tenta parsear JSON (novo formato); se falhar cai no texto puro
          let relatorio: string;
          try {
            const limpo = data.reply
              .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
            const j = JSON.parse(limpo);
            // Guarda o JSON serializado no campo analise — mapearRelatorioParaForm lida com ambos
            relatorio =
              `**Relatório da Experiência (Analisado com ${provedorUsado})**\n--------------------\n` +
              `**Nome da Experiência:** ${j.nome || ""}\n` +
              `**Local:** ${j.local || ""}\n` +
              `**Endereço / Ponto de Encontro:** ${j.endereco || ""}\n` +
              `**Ponto de Encontro:** ${j.pontoEncontro || ""}\n` +
              `**Tipo de Experiência:** ${j.tipo || ""}\n` +
              `**Data:** ${j.data || ""}\n` +
              `**Horário:** ${j.horario || ""}\n` +
              `**Duração:** ${j.duracao || ""}\n` +
              `**Quantidade de Pessoas:** ${j.qtdPessoas || ""}\n` +
              `**Preço:** ${j.preco ? `R$ ${j.preco}` : ""}\n` +
              `**Inclui:** ${j.inclui || ""}\n` +
              `**Descrição:** ${j.descricao || ""}\n` +
              `**Operador:** ${j.operador || ""}\n` +
              `**Nome do Guia:** ${j.nomeGuia || ""}\n` +
              `**Nº de Reserva:** ${j.nReserva || ""}\n` +
              `**Telefone:** ${j.telefone || ""}\n` +
              `**Link:** ${j.link || ""}\n` +
              `**Política de Cancelamento:** ${j.politicaCancelamento || ""}\n` +
              `**Observações:** ${j.observacoes || ""}`;
          } catch {
            // IA retornou texto livre — usa como está
            relatorio = `**Relatório da Experiência (Analisado com ${provedorUsado})**\n--------------------\n${data.reply}`;
          }
          addLog(`"${doc.nome}" analisado com sucesso.`);
          return { ...doc, analise: relatorio };
        } catch {
          addLog(`Falha ao analisar "${doc.nome}".`);
          return { ...doc, analise: "Falha na análise com IA. Tente novamente." };
        }
      })
    );

    setDocumentos(novasAnalises);
    setAnalisandoIA(false);
  }

  // ─── preencher form manual com dados do relatório ─────────────────────────
  function preencherFormComRelatorio() {
    const docComAnalise = documentos.find((d) => d.analise && d.analise.trim());
    if (!docComAnalise?.analise) return;
    const m = mapearRelatorioParaForm(docComAnalise.analise);

    // Sobrescreve sempre — o usuário clicou explicitamente em "Preencher com IA"
    setFormManual({
      nome:                 m.nome,
      local:                m.local,
      endereco:             m.endereco,
      descricao:            m.descricao,
      observacoes:          m.observacoes,
      operador:             m.operador,
      nomeGuia:             m.nomeGuia,
      nReserva:             m.nReserva,
      pontoEncontro:        m.pontoEncontro,
      telefoneOperador:     m.telefoneOperador,
      linkIngresso:         m.linkIngresso,
      politicaCancelamento: m.politicaCancelamento,
    });

    setFormDetalhes({
      data:       m.data,
      horario:    m.horario,
      duracao:    m.duracao,
      qtdPessoas: m.qtdPessoas || 1,
      preco:      m.preco,
      tipo:       m.tipo,
      inclui:     m.inclui,
    });

    setPreenchidoComIA(true);
    setMostrarManual(true);
    setTimeout(() => formManualRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  // ─── busca com IA fallback ────────────────────────────────────────────────
  const buscarExperienciaComIA = async (local: string): Promise<any[]> => {
    const provedores: ("openai" | "groq" | "gemini" | "openrouter" | "cloudflare")[] =
      ["groq", "openai", "gemini", "openrouter", "cloudflare"];
    const prompt = `Liste 5 experiências turísticas ou atrações em "${local}". Responda SOMENTE com array JSON, sem texto extra. Formato: {"nome":"","local":"","endereco":"","classificacao":0,"totalAvaliacoes":0,"descricao":"","priceLevel":"$$"}`;
    for (const p of provedores) {
      try {
        const data = await enviarMensagemIA([{ role: "user", content: prompt }], p);
        if (!data?.reply) continue;
        const clean = data.reply.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed) && parsed.length > 0)
          return parsed.map((it: any, idx: number) => ({
            placeId: idx + 1,
            nome: String(it?.nome || local), local: String(it?.local || local),
            endereco: String(it?.endereco || local),
            classificacao: Number(it?.classificacao || 4.5),
            totalAvaliacoes: Number(it?.totalAvaliacoes || 0),
            descricao: String(it?.descricao || ""), priceLevel: String(it?.priceLevel || "$$"),
          }));
      } catch { /* tenta próximo */ }
    }
    return [];
  };

  const buscarExperiencia = async () => {
    if (!busca.trim()) { setErro("Digite um local para buscar"); return; }
    setCarregando(true); setErro(""); setResultados([]); setBuscou(false);
    setMostrarManual(false); setAvisoTemporario("");
    try {
      const resposta = await buscarExperienciasDestino(busca);
      let itens = Array.isArray(resposta?.itens) ? resposta.itens : [];
      if (itens.length === 0) {
        const iaItens = await buscarExperienciaComIA(busca);
        if (iaItens.length > 0) {
          setResultados(iaItens); setAvisoTemporario("Sugestões geradas por IA (GROQ).");
          setCarregando(false); setBuscou(true); return;
        }
      } else {
        setResultados(itens);
        if (resposta?.fallback) setAvisoTemporario("Sugestões geradas por IA (GROQ).");
      }
      if (itens.length === 0) { setErro("Nenhuma experiência encontrada. Adicione manualmente ou tente outra busca."); setMostrarManual(true); }
    } catch {
      try {
        const iaItens = await buscarExperienciaComIA(busca);
        if (iaItens.length > 0) {
          setResultados(iaItens); setAvisoTemporario("Sugestões geradas por IA (GROQ).");
          setCarregando(false); setBuscou(true); return;
        }
      } catch { /* silencioso */ }
      setErro("Nenhuma experiência encontrada. Adicione manualmente ou tente outra busca.");
      setMostrarManual(true);
    } finally { setCarregando(false); setBuscou(true); }
  };

  // ─── voucher single-file ─────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const isPDF = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    if (!isPDF && !isImage) { setErro("Apenas PDF ou imagem."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setVoucher({ base64: ev.target?.result as string, tipo: isPDF ? "pdf" : "imagem", nome: file.name });
      setErro("");
    };
    reader.readAsDataURL(file);
  };
  const removerVoucher = () => { setVoucher(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

  // ─── adicionar via busca ──────────────────────────────────────────────────
  const abrirDetalhes = (exp: any) => { setSelecionado(exp); setErro(""); };

  const adicionarExperiencia = () => {
    if (!selecionado || !formDetalhes.data) { setErro("Preencha todos os campos obrigatórios."); return; }
    onExperienciasChange([...experiencias, {
      id: Date.now(),
      nome: selecionado.nome, local: selecionado.local, endereco: selecionado.endereco,
      tipo: formDetalhes.tipo, data: formDetalhes.data, horario: formDetalhes.horario,
      duracao: formDetalhes.duracao, qtdPessoas: formDetalhes.qtdPessoas,
      preco: formDetalhes.preco, descricao: selecionado.descricao || "",
      inclui: formDetalhes.inclui, observacoes: "",
      operador: "", nomeGuia: "", nReserva: "", pontoEncontro: "",
      telefoneOperador: "", linkIngresso: "", politicaCancelamento: "",
      voucher: voucher?.base64 || null, voucherTipo: voucher?.tipo || null, voucherNome: voucher?.nome || "",
    }]);
    setSelecionado(null); setFormDetalhes(formDetalhesVazio); setResultados([]);
    setBusca(""); setVoucher(null); setBuscou(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── adicionar manual ────────────────────────────────────────────────────
  const adicionarExperienciaManual = () => {
    if (!formManual.nome.trim() || !formManual.local.trim()) {
      setErro("Preencha os campos obrigatórios: Nome e Local."); return;
    }
    if (!formDetalhes.data) { setErro("Preencha a data da experiência."); return; }
    onExperienciasChange([...experiencias, {
      id: Date.now(),
      nome: formManual.nome, local: formManual.local, endereco: formManual.endereco,
      tipo: formDetalhes.tipo, data: formDetalhes.data, horario: formDetalhes.horario,
      duracao: formDetalhes.duracao, qtdPessoas: formDetalhes.qtdPessoas,
      preco: formDetalhes.preco, descricao: formManual.descricao,
      inclui: formDetalhes.inclui, observacoes: formManual.observacoes,
      operador: formManual.operador, nomeGuia: formManual.nomeGuia,
      nReserva: formManual.nReserva, pontoEncontro: formManual.pontoEncontro,
      telefoneOperador: formManual.telefoneOperador, linkIngresso: formManual.linkIngresso,
      politicaCancelamento: formManual.politicaCancelamento,
      voucher: voucher?.base64 || null, voucherTipo: voucher?.tipo || null, voucherNome: voucher?.nome || "",
    }]);
    setFormManual(formManualVazio); setFormDetalhes(formDetalhesVazio);
    setVoucher(null); setMostrarManual(false); setErro(""); setPreenchidoComIA(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removerExperiencia = (id: number) =>
    onExperienciasChange(experiencias.filter((e) => e.id !== id));

  const abrirFormManual = () => {
    setMostrarManual(true); setResultados([]); setSelecionado(null); setErro(""); setBuscou(false);
    setTimeout(() => formManualRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // ─── helpers de renderização ─────────────────────────────────────────────
  const campoTexto = (
    label: string, placeholder: string,
    value: string, onChange: (v: string) => void,
    span2 = false, required = false
  ) => (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <Label className="text-xs">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      <Input placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)} className="mt-1" />
    </div>
  );

  const campoTextArea = (
    label: string, placeholder: string,
    value: string, onChange: (v: string) => void,
    rows = 2
  ) => (
    <div className="sm:col-span-2">
      <Label className="text-xs">{label}</Label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring resize-none" />
    </div>
  );

  const hasRelatorio = documentos.some((d) => d.analise && d.analise.trim());

  return (
    <div className="space-y-4">
      {/* ── Busca ─────────────────────────────────────────────────────────── */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-4">
          <Sparkles className="w-4 h-4 inline-block mr-2 text-indigo-500" />
          Buscar Experiências / Atrações
        </h4>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Local / Cidade / Atração</Label>
            <div className="flex gap-2 mt-1">
              <Input placeholder="Ex: Paris, Nova York, Disney..."
                value={busca} onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscarExperiencia()}
                className="flex-1" />
              <button
                onClick={buscarExperiencia} disabled={carregando}
                className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
          {erro && <p className="text-xs text-red-500">{erro}</p>}
          {avisoTemporario && <p className="text-xs text-amber-600">{avisoTemporario}</p>}
        </div>
      </Card>

      {/* ── Vouchers / IA ─────────────────────────────────────────────────── */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="flex items-center gap-2 font-semibold text-gray-900">
            <Package2 className="h-4 w-4 text-indigo-500" />
            Vouchers / Ingressos
          </h4>
          <Button type="button" variant="ghost" size="sm"
            onClick={() => setVouchersMinimizado((p) => !p)}
            className="gap-2 text-gray-600 hover:text-gray-900">
            {vouchersMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>

        {!vouchersMinimizado && (
          <>
            <div className="space-y-3 mb-4">
              <div onClick={() => docFileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors bg-white">
                <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                <p className="text-xs text-gray-500">Clique para anexar arquivos</p>
                <p className="text-xs text-gray-400 mt-0.5">PDF, ZIP, JPG, PNG, etc.</p>
              </div>
              <input ref={docFileInputRef} type="file" multiple
                accept=".pdf,.zip,image/*" onChange={handleDocUpload} className="hidden" />

              {documentos.length > 0 ? (
                <div className="space-y-1.5">
                  {documentos.map((doc) => (
                    <div key={doc.id}
                      className="rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <a href={doc.arquivo} download={doc.nome}
                          className="flex items-center gap-2 truncate text-indigo-600 hover:text-indigo-700">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{doc.nome}</span>
                        </a>
                        <button type="button" onClick={() => removerDocumento(doc.id)}
                          className="ml-2 rounded p-1 text-red-500 hover:bg-red-50">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {doc.analise && (
                        <div className="mt-2 rounded-md border border-indigo-200 bg-indigo-50 text-xs text-indigo-800">
                          <div className="flex items-center justify-between gap-2 p-2">
                            <span className="font-medium">Relatório do arquivo</span>
                            <Button type="button" variant="ghost" size="sm"
                              onClick={() => setRelatoriosExpandidos((prev) => {
                                const next = new Set(prev);
                                next.has(doc.id) ? next.delete(doc.id) : next.add(doc.id);
                                return next;
                              })}
                              className="h-6 gap-1 px-2 text-indigo-700 hover:bg-indigo-100">
                              {relatoriosExpandidos.has(doc.id)
                                ? <ChevronUp className="h-3.5 w-3.5" />
                                : <ChevronDown className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                          {relatoriosExpandidos.has(doc.id) && (
                            <div className="whitespace-pre-wrap border-t border-indigo-200 px-2 pb-2 pt-2">
                              {doc.analise}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-dashed p-4 text-center text-xs text-gray-400 bg-white">
                  Nenhum anexo adicionado.
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm"
                onClick={analisarDocumentosComIA}
                disabled={analisandoIA || documentos.length === 0}
                className="gap-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700">
                <Sparkles className={`w-4 h-4 ${analisandoIA ? "animate-spin" : ""}`} />
                {analisandoIA ? "Analisando..." : "Analisar com IA"}
              </Button>
              <select value={provedorIA}
                onChange={(e) => {
                  const v = e.target.value;
                  if (["automático","openai","groq","gemini","openrouter","cloudflare"].includes(v))
                    setProvedorIA(v as typeof provedorIA);
                }}
                disabled={analisandoIA}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring">
                <option value="automático">Automático</option>
                <option value="groq">Groq</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="openrouter">OpenRouter</option>
                <option value="cloudflare">Cloudflare</option>
              </select>

              {hasRelatorio && (
                <Button type="button" variant="outline" size="sm"
                  onClick={preencherFormComRelatorio}
                  className="gap-2 border-green-300 text-green-700 hover:bg-green-50">
                  <Sparkles className="w-4 h-4" />
                  Preencher formulário com IA
                </Button>
              )}
            </div>

            {logAnalise.length > 0 && (
              <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600 max-h-28 overflow-y-auto space-y-0.5">
                {logAnalise.map((l, i) => <p key={i}>{l}</p>)}
              </div>
            )}
          </>
        )}
      </Card>

      <div className="text-center">
        <Button variant="link" onClick={abrirFormManual} className="text-indigo-600 text-sm">
          Não encontrou a experiência? Adicionar manualmente
        </Button>
      </div>

      {/* ── Resultados da busca ──────────────────────────────────────────── */}
      {resultados.length > 0 && !selecionado && (
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">
              <Globe className="w-4 h-4 inline-block mr-1 text-blue-500" />
              Experiências Encontradas ({resultados.length})
              {avisoTemporario && (
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  IA
                </span>
              )}
            </h4>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {resultados.map((exp, idx) => (
              <button key={exp.placeId || idx} onClick={() => abrirDetalhes(exp)}
                className="w-full text-left p-3 border rounded-lg hover:bg-white hover:border-blue-500 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="font-medium text-gray-900 truncate">{exp.nome}</p>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{exp.endereco}</span>
                    </p>
                    {exp.descricao && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{exp.descricao}</p>}
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    {exp.classificacao > 0 && (
                      <p className="font-semibold text-indigo-600 text-sm">
                        <Star className="w-3 h-3 inline-block text-yellow-500" /> {exp.classificacao.toFixed(1)}
                        {exp.totalAvaliacoes > 0 && <span className="text-xs text-gray-400 font-normal"> ({exp.totalAvaliacoes})</span>}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <Button variant="ghost" size="sm"
              onClick={() => { setMostrarManual(true); setResultados([]); }}
              className="text-xs text-indigo-600 w-full">
              Não encontrou o ideal? <strong className="ml-1">Adicionar manualmente</strong>
            </Button>
          </div>
        </Card>
      )}

      {/* ── Sem resultados ───────────────────────────────────────────────── */}
      {buscou && resultados.length === 0 && !selecionado && !mostrarManual && (
        <Card className="p-6 text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500 mb-3">Nenhuma experiência encontrada para "{busca}".</p>
          <Button onClick={() => setMostrarManual(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Adicionar Manualmente
          </Button>
        </Card>
      )}

      {/* ── Detalhes do selecionado (busca) ──────────────────────────────── */}
      {selecionado && (
        <Card className="p-4 bg-green-50 border border-green-200">
          <h4 className="font-semibold text-gray-900 mb-3">
            <Sparkles className="w-4 h-4 inline-block mr-1" /> {selecionado.nome}
          </h4>
          <div className="bg-white p-3 rounded mb-3 text-sm">
            <p className="font-medium text-gray-900">{selecionado.local}</p>
            <p className="text-xs text-gray-500">{selecionado.endereco}</p>
            {selecionado.classificacao > 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-2 inline-block">
                <Star className="w-3 h-3 inline-block mr-0.5" />{selecionado.classificacao.toFixed(1)}
              </span>
            )}
            {selecionado.descricao && <p className="text-xs text-gray-500 mt-2">{selecionado.descricao}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-xs">Tipo de Experiência</Label>
              <select value={formDetalhes.tipo}
                onChange={(e) => setFormDetalhes({ ...formDetalhes, tipo: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                <option value="">Selecione o tipo</option>
                {tiposExperiencia.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Data <span className="text-red-500">*</span></Label>
              <Input type="date" value={formDetalhes.data}
                onChange={(e) => setFormDetalhes({ ...formDetalhes, data: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Horário</Label>
              <Input type="time" value={formDetalhes.horario}
                onChange={(e) => setFormDetalhes({ ...formDetalhes, horario: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Duração</Label>
              <Input placeholder="Ex: 2h, 4h, Dia inteiro" value={formDetalhes.duracao}
                onChange={(e) => setFormDetalhes({ ...formDetalhes, duracao: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Nº de Pessoas</Label>
              <Input type="number" min="1" value={formDetalhes.qtdPessoas}
                onChange={(e) => setFormDetalhes({ ...formDetalhes, qtdPessoas: parseInt(e.target.value) || 1 })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Preço (R$)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0,00"
                value={formDetalhes.preco || ""}
                onChange={(e) => setFormDetalhes({ ...formDetalhes, preco: parseFloat(e.target.value) || 0 })} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Inclui</Label>
              <Input placeholder="Ex: Ingresso, transporte, guia..."
                value={formDetalhes.inclui}
                onChange={(e) => setFormDetalhes({ ...formDetalhes, inclui: e.target.value })} className="mt-1" />
            </div>
          </div>
          {/* Voucher */}
          <div className="mb-3">
            <Label className="text-xs">Voucher / Ingresso (PDF ou Imagem)</Label>
            <div className="mt-1">
              {voucher ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{voucher.nome}</p>
                    <p className="text-xs text-gray-500">{voucher.tipo === "pdf" ? "Documento PDF" : "Imagem"}</p>
                  </div>
                  <button onClick={removerVoucher} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                  <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                  <p className="text-xs text-gray-500">Clique para fazer upload do voucher</p>
                  <p className="text-xs text-gray-400 mt-0.5">PDF ou imagem</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
            </div>
          </div>
          {erro && selecionado && <p className="text-xs text-red-500 mb-3">{erro}</p>}
          <div className="flex gap-2">
            <Button onClick={adicionarExperiencia} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4" /> Adicionar Experiência
            </Button>
            <Button onClick={() => setSelecionado(null)} variant="outline" className="flex-1">Cancelar</Button>
          </div>
        </Card>
      )}

      {/* ── Formulário Manual ─────────────────────────────────────────────── */}
      {mostrarManual && !selecionado && (
        <Card ref={formManualRef} className="p-4 border-2 border-dashed border-indigo-300 bg-indigo-50/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              <Sparkles className="w-4 h-4 inline-block mr-1 text-indigo-500" />
              Adicionar Experiência Manualmente
            </h4>
            <button onClick={() => { setMostrarManual(false); setBuscou(false); setPreenchidoComIA(false); }}
              className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {preenchidoComIA && (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              Campos preenchidos automaticamente com o relatório da IA. Revise antes de adicionar.
            </div>
          )}

          {/* ── Identificação ── */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-1">Identificação</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {campoTexto("Nome da Experiência", "Ex: Tour pelo Louvre",
              formManual.nome, (v) => setFormManual({ ...formManual, nome: v }), false, true)}
            {campoTexto("Local / Cidade", "Ex: Paris, França",
              formManual.local, (v) => setFormManual({ ...formManual, local: v }), false, true)}
            {campoTexto("Endereço / Ponto de Encontro", "Ex: Museu do Louvre, Paris",
              formManual.endereco, (v) => setFormManual({ ...formManual, endereco: v }), true)}
            {campoTexto("Ponto de Encontro (detalhe)", "Ex: Entrada principal, portão A",
              formManual.pontoEncontro, (v) => setFormManual({ ...formManual, pontoEncontro: v }), true)}
          </div>

          {/* ── Tipo e datas ── */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Data e Horário</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <Label className="text-xs">Tipo de Experiência</Label>
              <select value={formDetalhes.tipo}
                onChange={(e) => setFormDetalhes({ ...formDetalhes, tipo: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                <option value="">Selecione o tipo</option>
                {tiposExperiencia.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Data <span className="text-red-500">*</span></Label>
              <Input type="date" value={formDetalhes.data}
                onChange={(e) => setFormDetalhes({ ...formDetalhes, data: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Horário</Label>
              <Input type="time" value={formDetalhes.horario}
                onChange={(e) => setFormDetalhes({ ...formDetalhes, horario: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Duração</Label>
              <Input placeholder="Ex: 2h, 4h, Dia inteiro" value={formDetalhes.duracao}
                onChange={(e) => setFormDetalhes({ ...formDetalhes, duracao: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Nº de Pessoas</Label>
              <Input type="number" min="1" value={formDetalhes.qtdPessoas}
                onChange={(e) => setFormDetalhes({ ...formDetalhes, qtdPessoas: parseInt(e.target.value) || 1 })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Preço (R$)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0,00"
                value={formDetalhes.preco || ""}
                onChange={(e) => setFormDetalhes({ ...formDetalhes, preco: parseFloat(e.target.value) || 0 })} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Inclui</Label>
              <Input placeholder="Ex: Ingresso, transporte, guia, alimentação..."
                value={formDetalhes.inclui}
                onChange={(e) => setFormDetalhes({ ...formDetalhes, inclui: e.target.value })} className="mt-1" />
            </div>
          </div>

          {/* ── Operador / Reserva ── */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Operador / Reserva</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <Label className="text-xs"><User className="w-3 h-3 inline-block mr-0.5" />Operador / Fornecedor</Label>
              <Input placeholder="Ex: GetYourGuide, Civitatis, agência local..."
                value={formManual.operador}
                onChange={(e) => setFormManual({ ...formManual, operador: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Nº de Reserva / Código</Label>
              <Input placeholder="Ex: REF-123456"
                value={formManual.nReserva}
                onChange={(e) => setFormManual({ ...formManual, nReserva: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs"><User className="w-3 h-3 inline-block mr-0.5" />Nome do Guia</Label>
              <Input placeholder="Ex: João Silva"
                value={formManual.nomeGuia}
                onChange={(e) => setFormManual({ ...formManual, nomeGuia: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs"><Phone className="w-3 h-3 inline-block mr-0.5" />Telefone / WhatsApp</Label>
              <Input placeholder="Ex: +55 11 99999-9999"
                value={formManual.telefoneOperador}
                onChange={(e) => setFormManual({ ...formManual, telefoneOperador: e.target.value })} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs"><Link2 className="w-3 h-3 inline-block mr-0.5" />Link do Ingresso / Voucher</Label>
              <Input placeholder="https://..."
                value={formManual.linkIngresso}
                onChange={(e) => setFormManual({ ...formManual, linkIngresso: e.target.value })} className="mt-1" />
            </div>
          </div>

          {/* ── Descrição e Observações ── */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Informações Adicionais</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {campoTextArea("Descrição", "Descreva a experiência, o que esperar, etc.",
              formManual.descricao, (v) => setFormManual({ ...formManual, descricao: v }))}
            {campoTextArea("Observações", "O que levar, restrições, idioma do guia, etc.",
              formManual.observacoes, (v) => setFormManual({ ...formManual, observacoes: v }))}
            <div className="sm:col-span-2">
              <Label className="text-xs"><AlertCircle className="w-3 h-3 inline-block mr-0.5" />Política de Cancelamento</Label>
              <textarea value={formManual.politicaCancelamento}
                onChange={(e) => setFormManual({ ...formManual, politicaCancelamento: e.target.value })}
                placeholder="Ex: Cancelamento gratuito até 24h antes. Após esse prazo, não há reembolso."
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring resize-none" />
            </div>
          </div>

          {/* ── Voucher single-file ── */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Voucher / Comprovante</p>
          <div className="mb-4">
            {voucher ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{voucher.nome}</p>
                  <p className="text-xs text-gray-500">{voucher.tipo === "pdf" ? "Documento PDF" : "Imagem"}</p>
                </div>
                <button onClick={removerVoucher} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                <p className="text-xs text-gray-500">Clique para fazer upload do voucher</p>
                <p className="text-xs text-gray-400 mt-0.5">PDF ou imagem (JPG, PNG)</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
          </div>

          {erro && mostrarManual && <p className="text-xs text-red-500 mb-3">{erro}</p>}
          <div className="flex gap-2">
            <Button onClick={adicionarExperienciaManual}
              className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Adicionar Experiência
            </Button>
            <Button onClick={() => { setMostrarManual(false); setBuscou(false); setPreenchidoComIA(false); }}
              variant="outline" className="flex-1">
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* ── Lista de Experiências ────────────────────────────────────────── */}
      {experiencias.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            <Sparkles className="w-4 h-4 inline-block mr-1 text-green-500" />
            Experiências Adicionadas ({experiencias.length})
          </h4>
          <div className="space-y-2">
            {experiencias.map((exp) => (
              <div key={exp.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{exp.nome}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{exp.local}</span>
                    {exp.tipo && <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded">{exp.tipo}</span>}
                    {exp.operador && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{exp.operador}</span>}
                  </div>

                  <p className="text-xs text-gray-600 mt-1">
                    <Calendar className="w-3 h-3 inline-block mr-0.5" />
                    {exp.data}{exp.horario && <> às {exp.horario}</>}
                    {exp.duracao && <> • {exp.duracao}</>}
                    {" • "}{exp.qtdPessoas} pessoa{exp.qtdPessoas !== 1 ? "s" : ""}
                  </p>

                  {exp.pontoEncontro && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      <MapPin className="w-3 h-3 inline-block mr-0.5" />
                      {exp.pontoEncontro}
                    </p>
                  )}

                  {exp.preco > 0 && (
                    <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                      <DollarSign className="w-3 h-3 inline-block" />
                      R$ {exp.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}

                  {exp.nReserva && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      <Info className="w-3 h-3 inline-block mr-0.5" />Reserva: {exp.nReserva}
                    </p>
                  )}
                  {exp.nomeGuia && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      <User className="w-3 h-3 inline-block mr-0.5" />Guia: {exp.nomeGuia}
                    </p>
                  )}
                  {exp.telefoneOperador && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      <Phone className="w-3 h-3 inline-block mr-0.5" />{exp.telefoneOperador}
                    </p>
                  )}
                  {exp.inclui && <p className="text-xs text-gray-500 mt-0.5">Inclui: {exp.inclui}</p>}
                  {exp.descricao && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{exp.descricao}</p>}
                  {exp.linkIngresso && (
                    <a href={exp.linkIngresso} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline mt-0.5 block truncate">
                      <Link2 className="w-3 h-3 inline-block mr-0.5" />{exp.linkIngresso}
                    </a>
                  )}
                  {exp.politicaCancelamento && (
                    <p className="text-xs text-orange-600 mt-0.5 line-clamp-2">
                      <AlertCircle className="w-3 h-3 inline-block mr-0.5" />{exp.politicaCancelamento}
                    </p>
                  )}
                  {exp.voucher && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <FileText className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">{exp.voucherNome}</span>
                      <button onClick={() => {
                        if (exp.voucher) {
                          const win = window.open("");
                          win?.document.write(
                            exp.voucherTipo === "pdf"
                              ? `<iframe src="${exp.voucher}" style="width:100%;height:100%;border:none;"></iframe>`
                              : `<img src="${exp.voucher}" style="max-width:100%;max-height:100vh;display:block;margin:auto;" />`
                          );
                        }
                      }} className="text-xs text-indigo-600 hover:text-indigo-800 underline">
                        Visualizar
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => removerExperiencia(exp.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors ml-3 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-semibold text-gray-900">
              Total Experiências: R${" "}
              {experiencias.reduce((s, e) => s + (e.preco || 0), 0)
                .toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </Card>
      )}

      {experiencias.length === 0 && !mostrarManual && !selecionado && !carregando && (
        <div className="text-center py-8 text-gray-500 text-sm">
          Nenhuma experiência adicionada. Busque acima ou adicione manualmente.
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { ChevronDown, ChevronUp, Plus, Trash2, Upload, FileText, Image, X, Link2, Sparkles, Package2 } from "lucide-react";
import { enviarMensagemIA } from "../data/aiChatApi";
import { API_CONFIG } from "../data/apiConfig";

interface Documento {
  id: number;
  nome: string;
  tipo: string;
  arquivo: string;
  analise?: string;
  dadosIA?: any;
}

interface Transporte {
  id: number;
  tipo: string;
  empresa: string;
  diaRoteiro: string;
  origem: string;
  destino: string;
  dataHoraSaida: string;
  dataHoraChegada: string;
  valor: number;
  codigoReserva: string;
  descricao: string;
  voucher: string | null;
  voucherTipo: "pdf" | "imagem" | null;
  voucherNome: string;
  urlOperador?: string[];
  documentos?: Documento[];
  logAnalise?: string;
}

interface TransporteFormProps {
  transportes: Transporte[];
  onTransportesChange: (transportes: Transporte[]) => void;
}

const tiposTransporte = [
  "Transfer",
  "Locação de Veículo",
  "Táxi / Uber",
  "Van / Micro-ônibus",
  "Ônibus",
  "Trem",
  "Metrô",
  "Barco / Ferry",
  "Bicicleta",
  "Outro",
];

export default function TransporteForm({ transportes, onTransportesChange }: TransporteFormProps) {
  const [form, setForm] = useState<Transporte>({
    id: 0,
    tipo: "",
    empresa: "",
    diaRoteiro: "",
    origem: "",
    destino: "",
    dataHoraSaida: "",
    dataHoraChegada: "",
    valor: 0,
    codigoReserva: "",
    descricao: "",
    voucher: null,
    voucherTipo: null,
    voucherNome: "",
    urlOperador: [],
    documentos: [],
    logAnalise: "",
  });
  const [erro, setErro] = useState("");
  const [formMinimizado, setFormMinimizado] = useState(true);
  const [vouchersMinimizado, setVouchersMinimizado] = useState(true);
  const [urlOperadorMinimizado, setUrlOperadorMinimizado] = useState(true);
  const [logAnaliseMinimizado, setLogAnaliseMinimizado] = useState(true);
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [logAnaliseIA, setLogAnaliseIA] = useState<string[]>([]);
  const [novaUrlOperador, setNovaUrlOperador] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentosInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPDF = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");

    if (!isPDF && !isImage) {
      setErro("Apenas arquivos PDF ou imagem (JPG, PNG, etc.) são permitidos.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setForm({
        ...form,
        voucher: base64,
        voucherTipo: isPDF ? "pdf" : "imagem",
        voucherNome: file.name,
      });
      setErro("");
    };
    reader.readAsDataURL(file);
  };

  const removerVoucher = () => {
    setForm({ ...form, voucher: null, voucherTipo: null, voucherNome: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  function adicionarUrlOperador() {
    const url = novaUrlOperador.trim();
    if (!url) return;

    const urlsAtuais = form.urlOperador || [];
    if (urlsAtuais.includes(url)) {
      setErro("Esta URL já foi adicionada.");
      return;
    }

    setForm({ ...form, urlOperador: [...urlsAtuais, url] });
    setNovaUrlOperador("");
    setErro("");
  }

  function removerUrlOperador(index: number) {
    const urlsAtuais = form.urlOperador || [];
    const novasUrls = urlsAtuais.filter((_, i) => i !== index);
    setForm({ ...form, urlOperador: novasUrls });
  }

  async function handleDocumentosUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    if (arquivos.length === 0) return;

    const docs = await Promise.all(
      arquivos.map(
        (arquivo) =>
          new Promise<Documento>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                id: Date.now() + Math.floor(Math.random() * 10000),
                nome: arquivo.name,
                tipo: arquivo.type,
                arquivo: String(reader.result || ""),
                analise: "",
              });
            };
            reader.onerror = () => reject(new Error("Falha ao carregar documento."));
            reader.readAsDataURL(arquivo);
          })
      )
    );

    setForm((f) => ({ ...f, documentos: [...(f.documentos || []), ...docs] }));
    e.target.value = "";
  }

  function removerDocumento(idDocumento: number) {
    setForm((f) => ({
      ...f,
      documentos: (f.documentos || []).filter((doc) => doc.id !== idDocumento),
    }));
  }

  function criarPromptAnaliseUrl(htmlContent: string): string {
    return `Analise o seguinte conteúdo HTML de uma página de operador de turismo e extraia informações relevantes sobre transporte, transfer, aluguel de carros ou serviços similares.

Conteúdo HTML:
${htmlContent}

Por favor, extraia e retorne apenas um JSON válido com as seguintes informações (se disponíveis):
{
  "empresa": "nome da empresa de transporte",
  "tipo": "tipo de transporte (transfer, aluguel de carro, táxi, etc)",
  "origem": "local de origem",
  "destino": "local de destino",
  "valor": "valor do serviço",
  "reserva": "código de reserva se houver",
  "descricao": "descrição detalhada do serviço",
  "observacoes": "quaisquer observações importantes"
}

Se não encontrar alguma informação, retorne null para o campo correspondente.`;
  }

  async function analisarDocumentosComIA() {
    if (!form.documentos || form.documentos.length === 0) {
      if (!form.urlOperador || form.urlOperador.length === 0) {
        setErro("Nenhum documento ou URL para analisar.");
        return;
      }
    }

    setAnalisandoIA(true);
    setErro("");
    setForm((f) => ({ ...f, logAnalise: "" }));

    const logEntries: string[] = ["Iniciando análise com IA..."];
    setLogAnaliseIA([...logEntries]);

    const adicionarLog = (mensagem: string) => {
      logEntries.push(mensagem);
      setLogAnaliseIA([...logEntries]);
    };

    // Analisar URLs do operador se estiverem preenchidas
    for (const url of form.urlOperador || []) {
      if (!url?.trim()) continue;

      try {
        adicionarLog(`Baixando conteúdo da URL: ${url}`);

        const response = await fetch(`${API_CONFIG.apiBase}/scrape-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Falha ao baixar página: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const htmlContent = data.html;

        if (!htmlContent || typeof htmlContent !== 'string') {
          throw new Error('Conteúdo HTML inválido ou vazio retornado pelo backend.');
        }

        adicionarLog(`Conteúdo baixado com sucesso (${data.contentLength ?? htmlContent?.length ?? 0} caracteres).`);

        const prompt = criarPromptAnaliseUrl(htmlContent);

        try {
          adicionarLog(`Analisando URL com IA...`);
          const dataUrl = await enviarMensagemIA([{ role: "user", content: prompt }]);

          if (dataUrl) {
            adicionarLog(`Análise da URL concluída com sucesso.`);

            // Criar documento com o resultado da análise
            const urlDocumento: Documento = {
              id: Date.now() + Math.floor(Math.random() * 10000),
              nome: `URL: ${url}`,
              tipo: "text/url",
              arquivo: url,
              analise: dataUrl,
            };

            setForm((f) => ({ ...f, documentos: [...(f.documentos || []), urlDocumento] }));
          }
        } catch (error) {
          adicionarLog(`Falha na análise da URL: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      } catch (error) {
        adicionarLog(`Erro ao processar URL ${url}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    // Analisar documentos anexados
    if (form.documentos && form.documentos.length > 0) {
      for (const doc of form.documentos) {
        if (doc.analise) continue; // Já analisado

        try {
          adicionarLog(`Analisando documento: ${doc.nome}`);

          const prompt = `Analise este documento de transporte e extraia informações relevantes.
Documento: ${doc.nome}
Tipo: ${doc.tipo}

Por favor, extraia e retorne apenas um JSON válido com as seguintes informações:
{
  "empresa": "nome da empresa de transporte",
  "tipo": "tipo de transporte",
  "origem": "local de origem",
  "destino": "local de destino",
  "valor": "valor do serviço",
  "reserva": "código de reserva",
  "descricao": "descrição detalhada",
  "observacoes": "observações importantes"
}`;

          const resultado = await enviarMensagemIA([{ role: "user", content: prompt }]);

          if (resultado) {
            adicionarLog(`Análise do documento ${doc.nome} concluída.`);

            // Atualizar documento com análise
            setForm((f) => ({
              ...f,
              documentos: (f.documentos || []).map((d) =>
                d.id === doc.id ? { ...d, analise: resultado } : d
              ),
            }));
          }
        } catch (error) {
          adicionarLog(`Falha na análise do documento ${doc.nome}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }
    }

    adicionarLog("Análise concluída.");
    setAnalisandoIA(false);
    setForm((f) => ({ ...f, logAnalise: logEntries.join("\n") }));
  }

  const adicionarTransporte = () => {
    if (!form.tipo || !form.empresa || !form.origem || !form.destino) {
      setErro("Preencha os campos obrigatórios: Tipo, Empresa, Origem e Destino.");
      return;
    }

    const novoTransporte: Transporte = {
      ...form,
      id: Date.now(),
    };

    onTransportesChange([...transportes, novoTransporte]);

    // Limpar formulário
    setForm({
      id: 0,
      tipo: "",
      empresa: "",
      diaRoteiro: "",
      origem: "",
      destino: "",
      dataHoraSaida: "",
      dataHoraChegada: "",
      valor: 0,
      codigoReserva: "",
      descricao: "",
      voucher: null,
      voucherTipo: null,
      voucherNome: "",
      urlOperador: [],
      documentos: [],
      logAnalise: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (documentosInputRef.current) {
      documentosInputRef.current.value = "";
    }
    setNovaUrlOperador("");
    setLogAnaliseIA([]);
    setErro("");
  };

  const removerTransporte = (id: number) => {
    onTransportesChange(transportes.filter((t) => t.id !== id));
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="space-y-4">
      {/* Formulário de cadastro */}
      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h4 className="font-semibold text-gray-900">Adicionar Transporte</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFormMinimizado((prev) => !prev)}
            className="gap-2 text-gray-600 hover:text-gray-900"
          >
            {formMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            {formMinimizado ? "Maximizar" : "Minimizar"}
          </Button>
        </div>

        {!formMinimizado && (
          <>
            <div className="grid grid-cols-1 gap-3 mb-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="text-xs">
                  Tipo <span className="text-red-500">*</span>
                </Label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">Selecione o tipo</option>
                  {tiposTransporte.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">
                  Empresa <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Ex: Localiza, Uber, etc."
                  value={form.empresa}
                  onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Dia do Roteiro</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ex: 1, 2, 3..."
                  value={form.diaRoteiro}
                  onChange={(e) => setForm({ ...form, diaRoteiro: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">
                  Origem <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Ex: Aeroporto de Guarulhos"
                  value={form.origem}
                  onChange={(e) => setForm({ ...form, origem: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">
                  Destino <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Ex: Hotel Copacabana Palace"
                  value={form.destino}
                  onChange={(e) => setForm({ ...form, destino: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Data / Hora Saída</Label>
                <Input
                  type="datetime-local"
                  value={form.dataHoraSaida}
                  onChange={(e) => setForm({ ...form, dataHoraSaida: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Data / Hora Chegada / Devolução</Label>
                <Input
                  type="datetime-local"
                  value={form.dataHoraChegada}
                  onChange={(e) => setForm({ ...form, dataHoraChegada: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Valor R$</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.valor || ""}
                  onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Código de Reserva</Label>
                <Input
                  placeholder="Ex: ABC123"
                  value={form.codigoReserva}
                  onChange={(e) => setForm({ ...form, codigoReserva: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="mb-3">
              <Label className="text-xs">Descrição</Label>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Informações adicionais sobre o transporte..."
                rows={2}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring resize-none"
              />
            </div>

            {/* Voucher */}
            <div className="mb-3">
              <Label className="text-xs">Voucher (PDF ou Imagem)</Label>
              <div className="mt-1">
                {form.voucher ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    {form.voucherTipo === "pdf" ? (
                      <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={form.voucher}
                          alt="Voucher"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {form.voucherNome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {form.voucherTipo === "pdf" ? "Documento PDF" : "Imagem"}
                      </p>
                    </div>
                    <button
                      onClick={removerVoucher}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                  >
                    <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      Clique para fazer upload do voucher
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      PDF ou imagem (JPG, PNG)
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Seção de Vouchers e Documentos */}
            <div className="mb-3">
              <Card className="p-3 bg-gray-50">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h5 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    <Package2 className="h-4 w-4 text-indigo-500" />
                    Vouchers e Documentos
                  </h5>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setVouchersMinimizado((prev) => !prev)}
                    className="gap-2 text-gray-600 hover:text-gray-900 h-6"
                  >
                    {vouchersMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </div>

                {!vouchersMinimizado && (
                  <>
                    {/* Upload de Documentos */}
                    <div className="space-y-3 mb-3">
                      <div
                        onClick={() => documentosInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors bg-white"
                      >
                        <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                        <p className="text-xs text-gray-500">Clique para anexar documentos</p>
                        <p className="text-xs text-gray-400 mt-0.5">PDF, ZIP, JPG, etc.</p>
                      </div>
                      <input
                        ref={documentosInputRef}
                        type="file"
                        multiple
                        onChange={handleDocumentosUpload}
                        className="hidden"
                      />
                      {(form.documentos || []).length > 0 && (
                        <div className="space-y-1.5">
                          {(form.documentos || []).map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <a href={doc.arquivo} download={doc.nome} className="truncate text-indigo-600 hover:text-indigo-700 flex items-center gap-2">
                                    <FileText className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{doc.nome}</span>
                                  </a>
                                  <button type="button" onClick={() => removerDocumento(doc.id)} className="ml-2 rounded p-1 text-red-500 hover:bg-red-50" title="Remover documento">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* URL do Operador */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Label htmlFor="url-operador" className="text-xs text-gray-500">URL do Operador</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setUrlOperadorMinimizado((prev) => !prev)}
                          className="h-6 gap-1 px-2 text-gray-500 hover:text-gray-700"
                        >
                          {urlOperadorMinimizado ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      {!urlOperadorMinimizado && (
                        <>
                          <div className="relative mt-1 flex gap-2">
                            <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              id="url-operador"
                              value={novaUrlOperador}
                              onChange={(e) => setNovaUrlOperador(e.target.value)}
                              placeholder="Cole a URL do operador aqui..."
                              className="pl-8"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  adicionarUrlOperador();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={adicionarUrlOperador}
                              className="shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {(form.urlOperador || []).length > 0 && (
                            <div className="space-y-1.5 mt-2">
                              {(form.urlOperador || []).map((url, index) => (
                                <div key={index} className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs">
                                  <div className="flex-1 min-w-0">
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="truncate text-indigo-600 hover:text-indigo-700 flex items-center gap-2">
                                      <Link2 className="h-4 w-4 flex-shrink-0" />
                                      <span className="truncate">{url}</span>
                                    </a>
                                  </div>
                                  <button type="button" onClick={() => removerUrlOperador(index)} className="ml-2 rounded p-1 text-red-500 hover:bg-red-50" title="Remover URL">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Botão Analisar IA */}
                    <div className="flex justify-end mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={analisarDocumentosComIA}
                        disabled={analisandoIA || ((form.documentos || []).length === 0 && (!form.urlOperador || form.urlOperador.length === 0))}
                        className="gap-2 text-indigo-600 border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <Sparkles className={`w-4 h-4 ${analisandoIA ? "animate-spin" : ""}`} />
                        {analisandoIA ? "Analisando..." : "Analisar IA"}
                      </Button>
                    </div>

                    {/* Log de Análise IA */}
                    {logAnaliseIA.length > 0 && (
                      <div className="mt-3 rounded-md border border-indigo-200 bg-indigo-50 text-xs text-indigo-800">
                        <div className="flex items-center justify-between gap-2 p-2">
                          <span className="font-medium">Log de Análise IA</span>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setLogAnaliseMinimizado((prev) => !prev)}
                              className="h-6 gap-1 px-2 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900"
                            >
                              {logAnaliseMinimizado ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setLogAnaliseIA([])}
                              className="h-6 gap-1 px-2 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {!logAnaliseMinimizado && (
                          <div className="p-2 pt-0 max-h-40 overflow-y-auto">
                            {logAnaliseIA.map((log, index) => (
                              <div key={index} className="py-0.5 border-t border-indigo-200 first:border-0">
                                {log}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>

            {erro && <p className="text-xs text-red-500 mb-3">{erro}</p>}

            <Button
              onClick={adicionarTransporte}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Adicionar Transporte
            </Button>
          </>
        )}
      </Card>

      {/* Lista de transportes adicionados */}
      {transportes.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            Transportes Adicionados ({transportes.length})
          </h4>
          <div className="space-y-3">
            {transportes.map((transp, idx) => (
              <div
                key={transp.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">
                      {transp.tipo}
                    </span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                      {transp.empresa}
                    </span>
                    {transp.diaRoteiro && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        Dia {transp.diaRoteiro}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    {transp.origem} → {transp.destino}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                    {transp.dataHoraSaida && (
                      <span>
                        Saída:{" "}
                        {new Date(transp.dataHoraSaida).toLocaleString("pt-BR")}
                      </span>
                    )}
                    {transp.dataHoraChegada && (
                      <span>
                        Chegada:{" "}
                        {new Date(transp.dataHoraChegada).toLocaleString("pt-BR")}
                      </span>
                    )}
                    {transp.valor > 0 && (
                      <span className="font-semibold text-indigo-600">
                        {formatarMoeda(transp.valor)}
                      </span>
                    )}
                  </div>
                  {transp.codigoReserva && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Reserva: <span className="font-mono font-semibold">{transp.codigoReserva}</span>
                    </p>
                  )}
                  {transp.descricao && (
                    <p className="text-xs text-gray-500 mt-0.5 italic">
                      {transp.descricao}
                    </p>
                  )}
                  {transp.voucher && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {transp.voucherTipo === "pdf" ? (
                        <FileText className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Image className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        {transp.voucherNome}
                      </span>
                      <button
                        onClick={() => {
                          if (transp.voucher) {
                            const win = window.open("");
                            win?.document.write(
                              transp.voucherTipo === "pdf"
                                ? `<iframe src="${transp.voucher}" style="width:100%;height:100%;border:none;"></iframe>`
                                : `<img src="${transp.voucher}" style="max-width:100%;max-height:100vh;display:block;margin:auto;" />`
                            );
                          }
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                      >
                        Visualizar
                      </button>
                    </div>
                  )}
                  {(transp.urlOperador && transp.urlOperador.length > 0) && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs text-gray-500">
                        {transp.urlOperador.length} URL(s)
                      </span>
                    </div>
                  )}
                  {(transp.documentos && transp.documentos.length > 0) && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-500">
                        {transp.documentos.length} documento(s)
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removerTransporte(transp.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors ml-3 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-semibold text-gray-900">
              Total Transporte:{" "}
              {formatarMoeda(
                transportes.reduce((sum, t) => sum + t.valor, 0)
              )}
            </p>
          </div>
        </Card>
      )}

      {transportes.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          Nenhum transporte adicionado. Preencha o formulário acima para adicionar.
        </div>
      )}
    </div>
  );
}
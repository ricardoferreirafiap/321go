import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { ChevronDown, ChevronUp, Plus, Trash2, Upload, FileText, Image, X, Link2, Sparkles, Package2, Pencil } from "lucide-react";
import { enviarMensagemIA } from "../data/aiChatApi";
import { API_CONFIG } from "../data/apiConfig";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import * as Tesseract from "tesseract.js";

// Configura o worker para o pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

interface Documento {
  id: number;
  nome: string;
  tipo: string;
  arquivo: string;
  analise?: string;
  dadosIA?: DadosIAExtraidos;
}

interface DadosIAExtraidos {
  empresa?: string;
  tipo?: string;
  origem?: string;
  destino?: string;
  valor?: string;
  reserva?: string;
  descricao?: string;
  observacoes?: string;
  operador?: string;
  conteudoCompleto?: string;
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
  const [relatorioMinimizado, setRelatorioMinimizado] = useState(true);
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [logAnaliseIA, setLogAnaliseIA] = useState<string[]>([]);
  const [novaUrlOperador, setNovaUrlOperador] = useState("");
  const [provedorIA, setProvedorIA] = useState<"automático" | "openai" | "groq" | "gemini" | "openrouter" | "cloudflare">("automático");
  const [editandoId, setEditandoId] = useState<number | null>(null);
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

  function criarPromptAnaliseCompleta(contextoArquivo: string, temConteudoPdf: boolean): string {
    return `Você é um assistente especialista em turismo e transporte. Analise o contexto de um arquivo de transporte e extraia TODAS as informações disponíveis no documento para o formato JSON.

Contexto do arquivo para análise:
${contextoArquivo}

Instruções:
1. Extraia todas as informações do conteúdo do arquivo (PDF, OCR ou imagem). Seja exaustivo e procure em todas as seções do documento.
2. Se uma informação não for encontrada, retorne uma string vazia "" para o campo correspondente.
3. O campo "empresa" deve conter o nome da empresa de transporte (ex: Localiza, Uber, Movida, etc).
4. O campo "tipo" deve conter o tipo de transporte (ex: Transfer, Locação de Veículo, Táxi/Uber, Van/Micro-ônibus, Ônibus, Trem, Metrô, Barco/Ferry, Bicicleta, Outro).
5. O campo "origem" deve conter o local de origem (ex: Aeroporto de Guarulhos, Hotel Copacabana Palace).
6. O campo "destino" deve conter o local de destino.
7. O campo "valor" deve conter o valor do serviço como aparece no documento (ex: "R$ 250,00").
8. O campo "reserva" deve conter o código de reserva quando disponível.
9. O campo "descricao" deve conter uma descrição detalhada do serviço.
10. O campo "observacoes" deve conter quaisquer observações importantes.
11. O campo "operador" deve conter o nome da operadora de turismo quando identificado.
12. Retorne APENAS o objeto JSON, sem nenhum texto ou formatação adicional.
${!temConteudoPdf ? "\n13. Como o conteúdo do arquivo não pôde ser lido, baseie sua análise no nome do arquivo e na imagem anexada (se houver)." : ""}
Formato JSON esperado:
{
  "empresa": "string",
  "tipo": "string",
  "origem": "string",
  "destino": "string",
  "valor": "string",
  "reserva": "string",
  "descricao": "string",
  "observacoes": "string",
  "operador": "string"
}`;
  }

  function montarRelatorioUrl(provedor: string, dados: DadosIAExtraidos): string {
    let relatorio = `**Relatório da Análise da URL**\n\n`;
    relatorio += `Provedor de IA: ${provedor}\n\n`;
    
    if (dados.empresa) relatorio += `**Empresa:** ${dados.empresa}\n`;
    if (dados.tipo) relatorio += `**Tipo:** ${dados.tipo}\n`;
    if (dados.origem) relatorio += `**Origem:** ${dados.origem}\n`;
    if (dados.destino) relatorio += `**Destino:** ${dados.destino}\n`;
    if (dados.valor) relatorio += `**Valor:** ${dados.valor}\n`;
    if (dados.reserva) relatorio += `**Reserva:** ${dados.reserva}\n`;
    if (dados.descricao) relatorio += `**Descrição:** ${dados.descricao}\n`;
    if (dados.observacoes) relatorio += `**Observações:** ${dados.observacoes}\n`;
    
    return relatorio;
  }

  function montarRelatorioCompleto(provedor: string, operadorDetectado: string, dados: DadosIAExtraidos): string {
    let relatorio = `**Relatório da Análise do Documento**\n\n`;
    relatorio += `Provedor de IA: ${provedor}\n`;
    if (operadorDetectado) relatorio += `Operador identificado: ${operadorDetectado}\n`;
    relatorio += `\n`;
    
    if (dados.empresa) relatorio += `**Empresa:** ${dados.empresa}\n`;
    if (dados.tipo) relatorio += `**Tipo:** ${dados.tipo}\n`;
    if (dados.origem) relatorio += `**Origem:** ${dados.origem}\n`;
    if (dados.destino) relatorio += `**Destino:** ${dados.destino}\n`;
    if (dados.valor) relatorio += `**Valor:** ${dados.valor}\n`;
    if (dados.reserva) relatorio += `**Reserva:** ${dados.reserva}\n`;
    if (dados.descricao) relatorio += `**Descrição:** ${dados.descricao}\n`;
    if (dados.observacoes) relatorio += `**Observações:** ${dados.observacoes}\n`;
    
    return relatorio;
  }

  function montarDadosIAFromJson(respostaJson: Record<string, string>, operadorDetectado: string): DadosIAExtraidos {
    return {
      operador: operadorDetectado || respostaJson.operador || "",
      empresa: respostaJson.empresa || "",
      tipo: respostaJson.tipo || "",
      origem: respostaJson.origem || "",
      destino: respostaJson.destino || "",
      valor: respostaJson.valor || "",
      reserva: respostaJson.reserva || "",
      descricao: respostaJson.descricao || "",
      observacoes: respostaJson.observacoes || "",
      conteudoCompleto: respostaJson.conteudoCompleto || "",
    };
  }

  function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function imagemPdfParaDataUrl(img: unknown): string {
    if (!img || typeof img !== "object") return "";

    const obj = img as {
      bitmap?: ImageBitmap;
      data?: Uint8ClampedArray | Uint8Array;
      width?: number;
      height?: number;
    };

    if (obj.data instanceof Uint8Array && obj.data.length > 2) {
      const isJpeg = obj.data[0] === 0xff && obj.data[1] === 0xd8;
      const isPng =
          obj.data[0] === 0x89 &&
          obj.data[1] === 0x50 &&
          obj.data[2] === 0x4e &&
          obj.data[3] === 0x47;

      if (isJpeg) {
        return `data:image/jpeg;base64,${uint8ArrayToBase64(obj.data)}`;
      }

      if (isPng) {
        return `data:image/png;base64,${uint8ArrayToBase64(obj.data)}`;
      }
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    if (obj.bitmap) {
      canvas.width = obj.bitmap.width;
      canvas.height = obj.bitmap.height;
      ctx.drawImage(obj.bitmap, 0, 0);
      return canvas.toDataURL("image/png");
    }

    if (obj.data && obj.width && obj.height) {
      canvas.width = obj.width;
      canvas.height = obj.height;
      const imageData = ctx.createImageData(obj.width, obj.height);
      imageData.data.set(obj.data);
      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL("image/png");
    }

    return "";
  }

  async function resolvePdfObject(
    objs: { get: (name: string, callback?: (data: unknown) => void) => unknown },
    name: string,
  ): Promise<unknown> {
    const result = objs.get(name);
    if (result && typeof (result as Promise<unknown>).then === "function") {
      return result as Promise<unknown>;
    }

    return new Promise((resolve, reject) => {
      try {
        objs.get(name, (data: unknown) => {
          if (data) resolve(data);
          else reject(new Error("Objeto de imagem vazio"));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async function extrairPrimeiraImagemEmbutidaDoPdf(pdf: pdfjsLib.PDFDocumentProxy): Promise<string> {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const ops = await page.getOperatorList();

      for (let i = 0; i < ops.fnArray.length; i++) {
        const fn = ops.fnArray[i];
        if (fn !== pdfjsLib.OPS.paintImageXObject && fn !== pdfjsLib.OPS.paintInlineImageXObject) {
          continue;
        }

        const imgName = ops.argsArray[i][0];
        if (typeof imgName !== "string") continue;

        try {
          let img: unknown;
          try {
            img = await resolvePdfObject(page.objs, imgName);
          } catch {
            img = await resolvePdfObject(pdf.commonObjs, imgName);
          }

          const dataUrl = imagemPdfParaDataUrl(img);
          if (dataUrl) return dataUrl;
        } catch {
          // tenta a próxima imagem
        }
      }
    }

    return "";
  }

  async function extrairLogoDoTopoDoPdf(pdf: pdfjsLib.PDFDocumentProxy): Promise<string> {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const alturaLogo = Math.min(220, viewport.height * 0.18);

    const fullCanvas = document.createElement("canvas");
    fullCanvas.width = viewport.width;
    fullCanvas.height = viewport.height;
    const fullCtx = fullCanvas.getContext("2d");
    if (!fullCtx) return "";

    await page.render({
      canvasContext: fullCtx,
      viewport,
    }).promise;

    const logoCanvas = document.createElement("canvas");
    logoCanvas.width = viewport.width;
    logoCanvas.height = alturaLogo;
    const logoCtx = logoCanvas.getContext("2d");
    if (!logoCtx) return "";

    logoCtx.drawImage(fullCanvas, 0, 0, viewport.width, alturaLogo, 0, 0, viewport.width, alturaLogo);
    return logoCanvas.toDataURL("image/png");
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
        
        adicionarLog(`Conteúdo baixado com sucesso (${data.contentLength ?? htmlContent?.length ?? 0} caracteres de texto extraído, ${data.rawLength ?? '?'} bruto).`);

        const prompt = criarPromptAnaliseUrl(htmlContent);

        const tentarComProvedor = async (provedor?: "openai" | "groq" | "gemini" | "openrouter" | "cloudflare") => {
          return enviarMensagemIA([{ role: "user", content: prompt }], provedor);
        };

        let dataUrl;
        let provedorUsado: "OpenAI" | "Groq" | "Gemini" | "OpenRouter" | "Cloudflare";
        const provedoresAutomatico: ("openai" | "groq" | "gemini" | "openrouter" | "cloudflare")[] = ["groq", "openai", "gemini", "openrouter", "cloudflare"];

        if (provedorIA === "automático") {
          const mapaProvedorCapitalizado: Record<string, "OpenAI" | "Groq" | "Gemini" | "OpenRouter" | "Cloudflare"> = {
            openai: "OpenAI",
            groq: "Groq",
            gemini: "Gemini",
            openrouter: "OpenRouter",
            cloudflare: "Cloudflare",
          };

          for (const provedor of provedoresAutomatico) {
            try {
              const nomeProvedor = mapaProvedorCapitalizado[provedor];
              adicionarLog(`Analisando URL com ${nomeProvedor}...`);
              dataUrl = await tentarComProvedor(provedor);
              provedorUsado = nomeProvedor;
              if (dataUrl) break;
            } catch (error) {
              const nomeProvedor = mapaProvedorCapitalizado[provedor];
              console.warn(`Falha no ${nomeProvedor}, tentando com o próximo...`, error);
              adicionarLog(`Falha no ${nomeProvedor} para URL. Tentando com o próximo...`);
            }
          }

          if (!dataUrl) {
            adicionarLog(`Todos os provedores de IA falharam para a URL. Continuando com análise de documentos...`);
            
            const erroDocumento: Documento = {
              id: Date.now() + Math.floor(Math.random() * 10000),
              nome: `URL: ${url} (Erro)`,
              tipo: "text/url",
              arquivo: url,
              analise: `**Relatório da Análise da URL**\n\nErro: Todos os provedores de IA falharam.\n\nPor favor, verifique as configurações das APIs e tente novamente.`,
            };
            setForm((f) => ({
              ...f,
              documentos: [...(f.documentos || []), erroDocumento] as Documento[],
            }));
            
            setVouchersMinimizado(false);
          }
        } else {
          const mapaProvedor: Record<string, "OpenAI" | "Groq" | "Gemini" | "OpenRouter" | "Cloudflare"> = {
            openai: "OpenAI",
            groq: "Groq",
            gemini: "Gemini",
            openrouter: "OpenRouter",
            cloudflare: "Cloudflare",
          };
          const provedorCapitalizado = mapaProvedor[provedorIA] || "OpenAI";
          adicionarLog(`Analisando URL com ${provedorCapitalizado}...`);
          try {
            dataUrl = await tentarComProvedor(provedorIA);
            provedorUsado = provedorCapitalizado;
          } catch (error) {
            adicionarLog(`Falha ao analisar URL com ${provedorCapitalizado}. Continuando com análise de documentos...`);
            
            const erroDocumento: Documento = {
              id: Date.now() + Math.floor(Math.random() * 10000),
              nome: `URL: ${url} (Erro)`,
              tipo: "text/url",
              arquivo: url,
              analise: `**Relatório da Análise da URL**\n\nErro: Falha ao analisar com ${provedorCapitalizado}.\n\nDetalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nPor favor, verifique as configurações da API e tente novamente.`,
            };
            setForm((f) => ({
              ...f,
              documentos: [...(f.documentos || []), erroDocumento] as Documento[],
            }));
            
            setVouchersMinimizado(false);
          }
        }

        if (dataUrl) {
          adicionarLog(`Resposta recebida da IA.`);
          const respostaLimpa = dataUrl.reply.replace(/^```json\s*/, "").replace(/```$/, "").trim();

          if (!respostaLimpa.startsWith('{') && !respostaLimpa.startsWith('[')) {
            adicionarLog(`Resposta não é JSON válido. Resposta: ${respostaLimpa.substring(0, 100)}...`);
            throw new Error("A IA não retornou um JSON válido. Verifique os logs para mais detalhes.");
          }

          adicionarLog(`Parseando resposta JSON...`);
          const respostaJson = JSON.parse(respostaLimpa);

          adicionarLog(`Dados extraídos do JSON: ${JSON.stringify(respostaJson).substring(0, 200)}...`);

          const dadosIACompletos = montarDadosIAFromJson(respostaJson, respostaJson.operador || "");
          adicionarLog(`Dados IA completos gerados.`);

          const relatorioCompleto = montarRelatorioUrl(provedorUsado, dadosIACompletos);
          adicionarLog(`Relatório gerado: ${relatorioCompleto.substring(0, 100)}...`);

          adicionarLog(`Análise da URL concluída com sucesso.`);
          adicionarLog(`Relatório gerado com ${relatorioCompleto.length} caracteres.`);

          const novoDocumento: Documento = {
            id: Date.now() + Math.floor(Math.random() * 10000),
            nome: `URL: ${url}`,
            tipo: "text/url",
            arquivo: url,
            analise: relatorioCompleto,
            dadosIA: dadosIACompletos,
          };
          setForm((f) => ({
            ...f,
            documentos: [...(f.documentos || []), novoDocumento] as Documento[],
          }));

          setVouchersMinimizado(false);
        } else {
          adicionarLog(`Nenhum dado recebido da IA para a URL: ${url}`);
        }
      } catch (error) {
        const mensagemErro = error instanceof Error ? error.message : "Não foi possível analisar a URL.";
        adicionarLog(`Falha ao analisar URL ${url}: ${mensagemErro}`);
        console.error("Erro na análise da URL:", error);
        continue;
      }
    }

    let workerOcr: any = null;
    try {
      try {
        // @ts-ignore
        workerOcr = await Tesseract.createWorker("eng");
      } catch {
        adicionarLog("OCR indisponível; tentando identificação por IA e comparação visual.");
      }

      const novasAnalises = await Promise.all(
          (form.documentos || []).filter(doc => doc.tipo !== "text/url").map(async (doc) => {
            let contextoArquivo = "Nome do arquivo: " + doc.nome + "\n\n";
            let temConteudoPdf = false;
            let operadorDetectado = "";

            if (doc.tipo === 'application/pdf' && doc.arquivo) {
              try {
                const loadingTask = pdfjsLib.getDocument({ data: atob(doc.arquivo.split(',')[1]) });
                const pdf = await loadingTask.promise;
                let textContent = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                  const page = await pdf.getPage(i);
                  const text = await page.getTextContent();
                  textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
                }
                contextoArquivo += "--- Conteúdo do arquivo: " + doc.nome + " ---\n" + textContent + "\n--- Fim do arquivo: " + doc.nome + " ---\n\n";
                temConteudoPdf = true;

                adicionarLog(`Extraindo logo do fornecedor em "${doc.nome}"...`);
                const logoEmbutido = await extrairPrimeiraImagemEmbutidaDoPdf(pdf);
                if (logoEmbutido) {
                  // OCR could be added here if needed
                }

                if (!operadorDetectado) {
                  adicionarLog(`Tentando identificar operador pelo topo do PDF...`);
                  const logoTopo = await extrairLogoDoTopoDoPdf(pdf);
                  if (logoTopo) {
                    // OCR could be added here if needed
                  }
                }
              } catch (e) {
                contextoArquivo += "--- Erro ao ler o conteúdo do PDF: " + doc.nome + " ---\n";
              }
            }

            const prompt = criarPromptAnaliseCompleta(contextoArquivo, temConteudoPdf);

            const tentarComProvedor = async (provedor?: "openai" | "groq" | "gemini" | "openrouter" | "cloudflare") => {
              return enviarMensagemIA([{ role: "user", content: prompt }], provedor);
            };

            try {
              let data;
              let provedorUsado: "OpenAI" | "Groq" | "Gemini" | "OpenRouter" | "Cloudflare";
              const provedoresAutomatico: ("openai" | "groq" | "gemini" | "openrouter" | "cloudflare")[] = ["groq", "openai", "gemini", "openrouter", "cloudflare"];

              if (provedorIA === "automático") {
                const mapaProvedorCapitalizado: Record<string, "OpenAI" | "Groq" | "Gemini" | "OpenRouter" | "Cloudflare"> = {
                  openai: "OpenAI",
                  groq: "Groq",
                  gemini: "Gemini",
                  openrouter: "OpenRouter",
                  cloudflare: "Cloudflare",
                };

                for (const provedor of provedoresAutomatico) {
                  try {
                    const nomeProvedor = mapaProvedorCapitalizado[provedor];
                    adicionarLog(`Analisando "${doc.nome}" com ${nomeProvedor}...`);
                    data = await tentarComProvedor(provedor);
                    provedorUsado = nomeProvedor;
                    if (data) break;
                  } catch (error) {
                    const nomeProvedor = mapaProvedorCapitalizado[provedor];
                    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
                    console.warn(`Falha no ${nomeProvedor}, tentando com o próximo...`, error);
                    adicionarLog(`Falha no ${nomeProvedor} para "${doc.nome}": ${errorMessage}. Tentando com o próximo...`);
                  }
                }

                if (!data) {
                  throw new Error("Todos os provedores de IA falharam.");
                }
              } else {
                const mapaProvedor: Record<string, "OpenAI" | "Groq" | "Gemini" | "OpenRouter" | "Cloudflare"> = {
                  openai: "OpenAI",
                  groq: "Groq",
                  gemini: "Gemini",
                  openrouter: "OpenRouter",
                  cloudflare: "Cloudflare",
                };
                const provedorCapitalizado = mapaProvedor[provedorIA] || "OpenAI";
                adicionarLog(`Analisando "${doc.nome}" com ${provedorCapitalizado}...`);
                data = await tentarComProvedor(provedorIA);
                provedorUsado = provedorCapitalizado;
              }

              const respostaLimpa = data.reply.replace(/^```json\s*/, "").replace(/```$/, "").trim();
              const respostaJson = JSON.parse(respostaLimpa);

              const dadosIACompletos = montarDadosIAFromJson(respostaJson, operadorDetectado);
              const relatorioCompleto = montarRelatorioCompleto(provedorUsado, operadorDetectado, dadosIACompletos);

              return {
                ...doc,
                analise: relatorioCompleto,
                dadosIA: dadosIACompletos,
              };
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
              adicionarLog(`Falha ao analisar "${doc.nome}": ${errorMessage}`);
              return { ...doc, analise: `Falha na análise com IA: ${errorMessage}` };
            }
          })
      );

      // Preencher campos automaticamente após a análise
      let novoFormCalculado = { ...form };
      
      // Extrair dados dos documentos analisados
      const dadosUnificados: DadosIAExtraidos = {};
      for (const doc of novasAnalises) {
        if (doc.dadosIA) {
          Object.assign(dadosUnificados, doc.dadosIA);
        }
      }

      // Preencher campos do formulário com dados extraídos
      if (dadosUnificados.empresa) novoFormCalculado.empresa = dadosUnificados.empresa;
      if (dadosUnificados.tipo) novoFormCalculado.tipo = dadosUnificados.tipo;
      if (dadosUnificados.origem) novoFormCalculado.origem = dadosUnificados.origem;
      if (dadosUnificados.destino) novoFormCalculado.destino = dadosUnificados.destino;
      if (dadosUnificados.valor) novoFormCalculado.valor = parseFloat(dadosUnificados.valor.replace(/[^\d.-]/g, '')) || 0;
      if (dadosUnificados.reserva) novoFormCalculado.codigoReserva = dadosUnificados.reserva;
      if (dadosUnificados.descricao) novoFormCalculado.descricao = dadosUnificados.descricao;

      // Preservar documentos do tipo URL que foram adicionados durante a análise de URLs
      const documentosUrl = (form.documentos || []).filter(doc => doc.tipo === "text/url");
      const documentosNaoUrl = novasAnalises.filter(doc => doc.tipo !== "text/url");
      const formFinal = { ...novoFormCalculado, documentos: [...documentosUrl, ...documentosNaoUrl] };

      setForm(() => formFinal);

      adicionarLog("Campos preenchidos automaticamente com os dados extraídos.");
    } catch (error) {
      const mensagemErro = "Falha em ambos os provedores de IA. Verifique os logs e tente novamente.";
      adicionarLog(mensagemErro);
      setErro(`Falha na análise com IA: ${mensagemErro}`);
    } finally {
      if (workerOcr) {
        await workerOcr.terminate();
      }
      setAnalisandoIA(false);
      setForm((f) => ({ ...f, logAnalise: logEntries.join("\n") }));
    }
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

  const editarTransporte = (transp: Transporte) => {
    setVouchersMinimizado(false);
    setFormMinimizado(true);
    setEditandoId(transp.id);
    const logTransporte = (transp.logAnalise || "")
        .split("\n")
        .map((linha) => linha.trim())
        .filter(Boolean);
    setLogAnaliseIA(logTransporte);
    setForm({
      id: transp.id,
      tipo: transp.tipo || "",
      empresa: transp.empresa || "",
      diaRoteiro: transp.diaRoteiro || "",
      origem: transp.origem || "",
      destino: transp.destino || "",
      dataHoraSaida: transp.dataHoraSaida || "",
      dataHoraChegada: transp.dataHoraChegada || "",
      valor: transp.valor || 0,
      codigoReserva: transp.codigoReserva || "",
      descricao: transp.descricao || "",
      voucher: transp.voucher || null,
      voucherTipo: transp.voucherTipo || null,
      voucherNome: transp.voucherNome || "",
      urlOperador: transp.urlOperador || [],
      documentos: transp.documentos || [],
      logAnalise: transp.logAnalise || "",
    });
  };

  const formatarDescricao = (texto: string): string => {
    // Adiciona quebra de linha após ponto final seguido de espaço
    return texto.replace(/\.\s/g, '.\n');
  };

  const handleDescricaoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const valor = e.target.value;
    const valorFormatado = formatarDescricao(valor);
    setForm({ ...form, descricao: valorFormatado });
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="space-y-4">
      {/* Seção de Vouchers */}
      <Card className="p-3 bg-gray-50">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h5 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Package2 className="h-4 w-4 text-indigo-500" />
            Vouchers
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


            {/* Relatório da IA */}
            {(form.documentos || []).some(doc => doc.analise) && (
              <div className="mt-3 rounded-md border border-green-200 bg-green-50 text-xs text-green-800">
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="font-medium">Relatório da IA</span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRelatorioMinimizado((prev) => !prev)}
                      className="h-6 gap-1 px-2 text-green-700 hover:bg-green-100 hover:text-green-900"
                    >
                      {relatorioMinimizado ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
                {!relatorioMinimizado && (
                  <div className="p-2 pt-0 max-h-60 overflow-y-auto">
                    {(form.documentos || []).filter(doc => doc.analise).map((doc, index) => (
                      <div key={doc.id} className="mb-3 last:mb-0">
                        <div className="font-medium text-green-900 mb-1">{doc.nome}</div>
                        <div className="whitespace-pre-wrap text-green-800">{doc.analise}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Card>

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
            {formMinimizado ? "" : ""}
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
                  className={`mt-1 w-full rounded-md border border-input px-3 py-2 text-sm ${!form.tipo ? 'bg-yellow-50' : 'bg-white'}`}
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
                  className={`mt-1 ${!form.empresa ? 'bg-yellow-50' : 'bg-white'}`}
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
                  className={`mt-1 ${!form.diaRoteiro ? 'bg-yellow-50' : 'bg-white'}`}
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
                  className={`mt-1 ${!form.origem ? 'bg-yellow-50' : 'bg-white'}`}
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
                  className={`mt-1 ${!form.destino ? 'bg-yellow-50' : 'bg-white'}`}
                />
              </div>

              <div>
                <Label className="text-xs">Data / Hora Saída</Label>
                <Input
                  type="datetime-local"
                  value={form.dataHoraSaida}
                  onChange={(e) => setForm({ ...form, dataHoraSaida: e.target.value })}
                  className={`mt-1 ${!form.dataHoraSaida ? 'bg-yellow-50' : 'bg-white'}`}
                />
              </div>

              <div>
                <Label className="text-xs">Data / Hora Chegada / Devolução</Label>
                <Input
                  type="datetime-local"
                  value={form.dataHoraChegada}
                  onChange={(e) => setForm({ ...form, dataHoraChegada: e.target.value })}
                  className={`mt-1 ${!form.dataHoraChegada ? 'bg-yellow-50' : 'bg-white'}`}
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
                  className={`mt-1 ${!form.valor ? 'bg-yellow-50' : 'bg-white'}`}
                />
              </div>

              <div>
                <Label className="text-xs">Código de Reserva</Label>
                <Input
                  placeholder="Ex: ABC123"
                  value={form.codigoReserva}
                  onChange={(e) => setForm({ ...form, codigoReserva: e.target.value })}
                  className={`mt-1 ${!form.codigoReserva ? 'bg-yellow-50' : 'bg-white'}`}
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="mb-3">
              <Label className="text-xs">Descrição</Label>
              <textarea
                value={form.descricao}
                onChange={handleDescricaoChange}
                placeholder="Informações adicionais sobre o transporte..."
                rows={4}
                className={`mt-1 w-full rounded-md border border-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring resize-none ${!form.descricao ? 'bg-yellow-50' : 'bg-white'}`}
              />
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
                <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                  <button
                    onClick={() => editarTransporte(transp)}
                    className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                    title="Editar transporte"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removerTransporte(transp.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
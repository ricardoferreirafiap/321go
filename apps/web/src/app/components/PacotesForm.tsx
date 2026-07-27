import { useMemo, useState, useRef } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, Link2, Package2, Image, Upload, FileText, X, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { enviarMensagemIA } from "../data/aiChatApi";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import { createWorker, type Worker } from "tesseract.js";

const LOGO_HOTELDO_REF = "/assets/logos/hoteldo.png";

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

type DadosIAExtraidos = {
  operador?: string;
  ciaAerea?: string;
  reserva?: string;
  destino?: string;
  passageiros?: string;
  dataIda?: string;
  dataVolta?: string;
  origemIda?: string;
  destinoIda?: string;
  duracaoIda?: string;
  origemVolta?: string;
  destinoVolta?: string;
  duracaoVolta?: string;
  horaSaidaIda?: string;
  horaChegadaIda?: string;
  horaSaidaVolta?: string;
  horaChegadaVolta?: string;
  politicaAlteracoesCancelamentos?: string;
  link?: string;
  valor?: string;
  foto?: string;
  nomeHotel?: string;
  enderecoHotel?: string;
  telefoneHotel?: string;
  emailHotel?: string;
  quarto?: string;
  regimeHotel?: string;
  comodidades?: string;
  checkinHotel?: string;
  checkoutHotel?: string;
  noitesHotel?: string;
  linkHotel?: string;
  fotoHotel?: string;
  politicasCondicoesInformacoesEspeciais?: string;
  trasladoTipo?: string;
  trasladoData?: string;
  trasladoHorario?: string;
  trasladoLocalPartida?: string;
  trasladoLocalChegada?: string;
  trasladoVeiculoEmpresa?: string;
  trasladoObservacoes?: string;
  ingressoNomeAtracao?: string;
  ingressoData?: string;
  ingressoHorario?: string;
  ingressoQuantidade?: string;
  ingressoObservacoes?: string;
}

interface Pacote {
  id: number;
  operador: string;
  ciaAerea?: string;
  origem: string;
  destino: string;
  reserva?: string;
  link: string;

  foto: string | null;
  valor: number;
  dataIda?: string;
  dataVolta?: string;
  passageiros?: string;
  origemIda?: string;
  destinoIda?: string;
  duracaoIda?: string;
  origemVolta?: string;
  destinoVolta?: string;
  duracaoVolta?: string;
  politicaAlteracoesCancelamentos?: string;
  hospedagemNome?: string;
  hospedagemEndereco?: string;
  hospedagemTelefone?: string;
  hospedagemEmail?: string;
  hospedagemCheckin?: string;
  hospedagemCheckout?: string;
  hospedagemTipoQuarto?: string;
  hospedagemRegime?: string;
  hospedagemComodidades?: string;
  hospedagemPoliticasCondicoesInformacoesEspeciais?: string;
  hospedagemNoites?: string;
  hospedagemLink?: string;
  hospedagemFoto?: string | null;
  trasladoTipo?: string;
  trasladoData?: string;
  trasladoHorario?: string;
  trasladoLocalPartida?: string;
  trasladoLocalChegada?: string;
  trasladoVeiculoEmpresa?: string;
  trasladoObservacoes?: string;
  ingressoNomeAtracao?: string;
  ingressoData?: string;
  ingressoHorario?: string;
  ingressoQuantidade?: string;
  ingressoObservacoes?: string;
  logAnalise?: string;
  documentos: Documento[];
}

interface PacotesFormProps {
  pacotes: Pacote[];
  onPacotesChange: (pacotes: Pacote[]) => void;
}

const operadoresPadrao = [
  "HotelDO",
  "Decolar",
  "CVC",
  "Flytour",
  "Orinter",
  "Abreu",
  "Visual Turismo",
  "Diversa Turismo",
];

const pacoteVazio: Omit<Pacote, "id"> = {
  operador: "",
  ciaAerea: "",
  origem: "",
  destino: "",
  reserva: "",
  link: "",

  foto: null,
  valor: 0,
  dataIda: "",
  dataVolta: "",
  passageiros: "",
  origemIda: "",
  destinoIda: "",
  duracaoIda: "",
  origemVolta: "",
  destinoVolta: "",
  duracaoVolta: "",
  politicaAlteracoesCancelamentos: "",
  hospedagemNome: "",
  hospedagemEndereco: "",
  hospedagemTelefone: "",
  hospedagemEmail: "",
  hospedagemCheckin: "",
  hospedagemCheckout: "",
  hospedagemTipoQuarto: "",
  hospedagemRegime: "",
  hospedagemComodidades: "",
  hospedagemPoliticasCondicoesInformacoesEspeciais: "",
  hospedagemNoites: "",
  hospedagemLink: "",
  hospedagemFoto: null,
  trasladoTipo: "",
  trasladoData: "",
  trasladoHorario: "",
  trasladoLocalPartida: "",
  trasladoLocalChegada: "",
  trasladoVeiculoEmpresa: "",
  trasladoObservacoes: "",
  ingressoNomeAtracao: "",
  ingressoData: "",
  ingressoHorario: "",
  ingressoQuantidade: "",
  ingressoObservacoes: "",
  logAnalise: "",
  documentos: []
};

function formatarMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseMoeda(valorTexto: string) {
  const limpo = valorTexto
      .replace(/\s/g, "")
      .replace(/R\$/gi, "")
      .replace(/\./g, "")
      .replace(/,/g, ".")
      .replace(/[^\d.-]/g, "");
  const valor = Number(limpo);
  return Number.isFinite(valor) && valor >= 0 ? valor : 0;
}

function normalizarChave(texto: string) {
  return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
}

function padronizarOperador(valor: string) {
  const normalizado = normalizarChave(valor);
  if (!normalizado) return "";

  const mapaOperadores: Record<string, string> = {
    hoteldo: "HotelDO",
    decolar: "Decolar",
    cvc: "CVC",
    flytour: "Flytour",
    orinter: "Orinter",
    abreu: "Abreu",
    visualturismo: "Visual Turismo",
    diversaturismo: "Diversa Turismo",
  };

  const exato = mapaOperadores[normalizado];
  if (exato) return exato;

  const porContem = Object.entries(mapaOperadores).find(([chave]) => normalizado.includes(chave));
  return porContem?.[1] || valor.trim();
}

function normalizarValorIA(valor?: string) {
  if (!valor) return "";
  const normalizado = valor.trim();
  return normalizado.toLowerCase() === "não informado" ? "" : normalizado;
}

function dataBrParaIso(dataBr: string) {
  const partes = dataBr.split("/");
  if (partes.length !== 3) return "";
  const [dia, mes, ano] = partes;
  if (!dia || !mes || !ano) return "";
  if (dia.length !== 2 || mes.length !== 2 || ano.length !== 4) return "";
  return `${ano}-${mes}-${dia}`;
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

function detectarOperadorNoTexto(texto: string): string {
  const normalizado = normalizarChave(texto.slice(0, 1500));
  if (!normalizado) return "";

  const mapaOperadores: Record<string, string> = {
    hoteldo: "HotelDO",
    decolar: "Decolar",
    cvc: "CVC",
    flytour: "Flytour",
    orinter: "Orinter",
    abreu: "Abreu",
    visualturismo: "Visual Turismo",
    diversaturismo: "Diversa Turismo",
  };

  const porContem = Object.entries(mapaOperadores).find(([chave]) => normalizado.includes(chave));
  if (porContem) return porContem[1];

  if (normalizado.includes("hotel") && (normalizado.includes("do") || normalizado.includes("d0"))) {
    return "HotelDO";
  }

  return "";
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = src;
  });
}

async function prepararImagemParaOcr(imageUrl: string): Promise<string> {
  try {
    const img = await carregarImagem(imageUrl);
    const escala = Math.max(2, Math.ceil(400 / Math.max(img.width, img.height, 1)));
    const canvas = document.createElement("canvas");
    canvas.width = img.width * escala;
    canvas.height = img.height * escala;
    const ctx = canvas.getContext("2d");
    if (!ctx) return imageUrl;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch {
    return imageUrl;
  }
}

async function compararComLogoReferencia(imageUrl: string, referenciaUrl: string): Promise<boolean> {
  try {
    const [imgOrigem, imgRef] = await Promise.all([
      carregarImagem(imageUrl),
      carregarImagem(referenciaUrl),
    ]);

    const tamanho = 128;
    const canvas = document.createElement("canvas");
    canvas.width = tamanho;
    canvas.height = tamanho;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    const extrairPixels = (img: HTMLImageElement) => {
      ctx.clearRect(0, 0, tamanho, tamanho);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, tamanho, tamanho);
      const escala = Math.min(tamanho / img.width, tamanho / img.height);
      const largura = img.width * escala;
      const altura = img.height * escala;
      const x = (tamanho - largura) / 2;
      const y = (tamanho - altura) / 2;
      ctx.drawImage(img, x, y, largura, altura);
      return ctx.getImageData(0, 0, tamanho, tamanho).data;
    };

    const pixelsOrigem = extrairPixels(imgOrigem);
    const pixelsRef = extrairPixels(imgRef);

    let diff = 0;
    let total = 0;
    for (let i = 0; i < pixelsOrigem.length; i += 4) {
      const r1 = pixelsOrigem[i];
      const g1 = pixelsOrigem[i + 1];
      const b1 = pixelsOrigem[i + 2];
      const r2 = pixelsRef[i];
      const g2 = pixelsRef[i + 1];
      const b2 = pixelsRef[i + 2];
      const branco1 = r1 > 235 && g1 > 235 && b1 > 235;
      const branco2 = r2 > 235 && g2 > 235 && b2 > 235;
      if (branco1 && branco2) continue;
      diff += Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      total += 3;
    }

    if (total === 0) return false;
    return diff / total < 40;
  } catch {
    return false;
  }
}

async function identificarOperadorPorOcr(imageUrl: string, worker: Worker): Promise<string> {
  if (!imageUrl) return "";

  try {
    const imagemPreparada = await prepararImagemParaOcr(imageUrl);
    const { data: { text } } = await worker.recognize(imagemPreparada);
    return detectarOperadorNoTexto(text);
  } catch {
    return "";
  }
}

function extrairPoliticaAlteracoesCancelamentos(texto: string): string {
  if (!texto?.trim()) return "";

  const matchInicio = texto.match(/pol[ií]tica\s+de\s+altera[cç][oõ]es\s+e\s+cancelamentos/i);
  if (!matchInicio || matchInicio.index === undefined) return "";

  let conteudo = texto.slice(matchInicio.index + matchInicio[0].length).trim();

  const padroesFim = [
    /\bcondi[cç][oõ]es\s+gerais\b/i,
    /\binforma[cç][oõ]es\s+importantes\b/i,
    /\bobserva[cç][oõ]es\b/i,
    /\btermos\s+e\s+condi[cç][oõ]es\b/i,
    /\bnotas\s+importantes\b/i,
    /\bdocumenta[cç][oõ]es\s+necess[aá]rias\b/i,
    /\bdados\s+do\s+passageiro\b/i,
    /\bdados\s+da\s+reserva\b/i,
  ];

  let fim = conteudo.length;
  for (const padrao of padroesFim) {
    const matchFim = conteudo.match(padrao);
    if (matchFim?.index !== undefined && matchFim.index > 0 && matchFim.index < fim) {
      fim = matchFim.index;
    }
  }

  return conteudo.slice(0, fim).trim().replace(/\s{2,}/g, " ");
}

function extrairDadosIADeAnalise(analise: string): DadosIAExtraidos {
  const extrair = (regex: RegExp) => {
    const valor = analise.match(regex)?.[1];
    return normalizarValorIA(valor);
  };

  const dataIdaBr = extrair(/\*\*Data de Ida:\*\*\s*(.+)/);
  const dataVoltaBr = extrair(/\*\*Data de Volta:\*\*\s*(.+)/);
  const checkinBr = extrair(/\*\*Check-in:\*\*\s*(.+)/i);
  const checkoutBr = extrair(/\*\*Check-out:\*\*\s*(.+)/i);

  return {
    operador: padronizarOperador(extrair(/\*\*Operador:\*\*\s*(.+)/)),
    ciaAerea: extrair(/\*\*CIA A[eé]rea:\*\*\s*(.+)/i),
    reserva: extrair(/\*\*Nº de Reserva\/Localizador:\*\*\s*(.+)/),
    destino: extrair(/\*\*Destino Principal:\*\*\s*(.+)/),
    passageiros: extrair(/\*\*Passageiros:\*\*\s*(.+)/),
    dataIda: dataIdaBr ? dataBrParaIso(dataIdaBr) : "",
    dataVolta: dataVoltaBr ? dataBrParaIso(dataVoltaBr) : "",
    origemIda: extrair(/\*\*Origem \(Ida\):\*\*\s*(.+)/),
    destinoIda: extrair(/\*\*Destino \(Ida\):\*\*\s*(.+)/),
    duracaoIda: extrair(/\*\*Duração \(Ida\):\*\*\s*(.+)/i),
    origemVolta: extrair(/\*\*Origem \(Volta\):\*\*\s*(.+)/),
    destinoVolta: extrair(/\*\*Destino \(Volta\):\*\*\s*(.+)/),
    duracaoVolta: extrair(/\*\*Duração \(Volta\):\*\*\s*(.+)/i),
    horaSaidaIda: extrair(/\*\*Horário de Saída \(Ida\):\*\*\s*(.+)/i),
    horaChegadaIda: extrair(/\*\*Horário de Chegada \(Ida\):\*\*\s*(.+)/i),
    horaSaidaVolta: extrair(/\*\*Horário de Saída \(Volta\):\*\*\s*(.+)/i),
    horaChegadaVolta: extrair(/\*\*Horário de Chegada \(Volta\):\*\*\s*(.+)/i),
    link: extrair(/\*\*Link:\*\*\s*(.+)/i),
    valor: extrair(/\*\*Valor:\*\*\s*(.+)/i),
    foto: extrair(/\*\*Foto:\*\*\s*(.+)/i),
    nomeHotel: extrair(/\*\*Nome do Hotel:\*\*\s*(.+)/i),
    enderecoHotel: extrair(/\*\*Endereço do Hotel:\*\*\s*(.+)/i),
    telefoneHotel: extrair(/\*\*Telefone do Hotel:\*\*\s*(.+)/i),
    emailHotel: extrair(/\*\*E-mail do Hotel:\*\*\s*(.+)/i),
    quarto: extrair(/\*\*Tipo de Quarto:\*\*\s*(.+)/i),
    regimeHotel: extrair(/\*\*Regime \/ Pensão:\*\*\s*(.+)/i),
    comodidades: extrair(/\*\*Comodidades do Estabelecimento:\*\*\s*(.+)/i),
    checkinHotel: checkinBr ? dataBrParaIso(checkinBr) : "",
    checkoutHotel: checkoutBr ? dataBrParaIso(checkoutBr) : "",
    noitesHotel: extrair(/\*\*Noites:\*\*\s*(.+)/i),
    linkHotel: extrair(/\*\*Link do Hotel:\*\*\s*(.+)/i),
    fotoHotel: extrair(/\*\*Foto da Hospedagem:\*\*\s*(.+)/i),
    politicasCondicoesInformacoesEspeciais: (() => {
      const match = analise.match(/\*\*Políticas, Condições e Informações Especiais:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i);
      const valor = match?.[1]?.trim();
      return valor && valor.toLowerCase() !== "não informado" ? valor : "";
    })(),
    politicaAlteracoesCancelamentos: (() => {
      const match = analise.match(/\*\*Política de alterações e cancelamentos:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i);
      const valor = match?.[1]?.trim();
      return valor && valor.toLowerCase() !== "não informado" ? valor : "";
    })(),
    trasladoTipo: extrair(/\*\*Tipo de Traslado:\*\*\s*(.+)/i),
    trasladoData: (() => {
      const dataBr = extrair(/\*\*Data do Traslado:\*\*\s*(.+)/i);
      return dataBr ? dataBrParaIso(dataBr) : "";
    })(),
    trasladoHorario: extrair(/\*\*Horário do Traslado:\*\*\s*(.+)/i),
    trasladoLocalPartida: extrair(/\*\*Local de Partida \(Traslado\):\*\*\s*(.+)/i),
    trasladoLocalChegada: extrair(/\*\*Local de Chegada \(Traslado\):\*\*\s*(.+)/i),
    trasladoVeiculoEmpresa: extrair(/\*\*Veículo\/Empresa \(Traslado\):\*\*\s*(.+)/i),
    trasladoObservacoes: (() => {
      const match = analise.match(/\*\*Observações do Traslado:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i);
      const valor = match?.[1]?.trim();
      return valor && valor.toLowerCase() !== "não informado" ? valor : "";
    })(),
    ingressoNomeAtracao: extrair(/\*\*Nome da Atração\/Ingresso:\*\*\s*(.+)/i),
    ingressoData: (() => {
      const dataBr = extrair(/\*\*Data do Ingresso:\*\*\s*(.+)/i);
      return dataBr ? dataBrParaIso(dataBr) : "";
    })(),
    ingressoHorario: extrair(/\*\*Horário do Ingresso:\*\*\s*(.+)/i),
    ingressoQuantidade: extrair(/\*\*Quantidade de Ingressos:\*\*\s*(.+)/i),
    ingressoObservacoes: (() => {
      const match = analise.match(/\*\*Observações do Ingresso:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i);
      const valor = match?.[1]?.trim();
      return valor && valor.toLowerCase() !== "não informado" ? valor : "";
    })(),
  };
}

function temDadosExtraidos(dados?: DadosIAExtraidos | null) {
  if (!dados) return false;
  return Object.values(dados).some((valor) => Boolean(valor?.trim()));
}

function mesclarDadosIA(...fontes: (DadosIAExtraidos | null | undefined)[]): DadosIAExtraidos {
  const resultado: DadosIAExtraidos = {};
  for (const fonte of fontes) {
    if (!fonte) continue;
    for (const [chave, valor] of Object.entries(fonte) as [keyof DadosIAExtraidos, string | undefined][]) {
      if (valor?.trim() && !resultado[chave]?.trim()) {
        resultado[chave] = valor.trim();
      }
    }
  }
  return resultado;
}

function mesclarDadosIADocumentos(documentos: Documento[]): DadosIAExtraidos {
  const docsVoo = documentos.filter((doc) => ehDocumentoVoo(doc.nome));
  const docsHotel = documentos.filter((doc) => ehDocumentoHotel(doc.nome));
  const docsGerais = documentos.filter((doc) => !ehDocumentoVoo(doc.nome) && !ehDocumentoHotel(doc.nome));

  const fontesVoo = [...docsVoo, ...docsGerais].map((doc) => obterDadosIADocumento(doc));
  const fontesHotel = [...docsHotel, ...docsGerais].map((doc) => obterDadosIADocumento(doc));

  return mesclarDadosIA(...fontesVoo, ...fontesHotel);
}

function montarDadosIAFromJson(
    respostaJson: Record<string, string>,
    operadorDetectado: string,
    politicaExtraida: string,
): DadosIAExtraidos {
  const ciaAerea = respostaJson.ciaAerea || "";
  const politicaFinal = politicaExtraida || respostaJson.politicaAlteracoesCancelamentos || "";

  return {
    operador: padronizarOperador(operadorDetectado),
    ciaAerea,
    reserva: respostaJson.reserva || "",
    destino: respostaJson.destino || respostaJson.destinoIda || "",
    passageiros: respostaJson.passageiros || "",
    dataIda: respostaJson.dataIda || "",
    dataVolta: respostaJson.dataVolta || "",
    origemIda: respostaJson.origemIda || "",
    destinoIda: respostaJson.destinoIda || "",
    duracaoIda: respostaJson.duracaoIda || "",
    origemVolta: respostaJson.origemVolta || "",
    destinoVolta: respostaJson.destinoVolta || "",
    duracaoVolta: respostaJson.duracaoVolta || "",
    horaSaidaIda: respostaJson.horaSaidaIda || "",
    horaChegadaIda: respostaJson.horaChegadaIda || "",
    horaSaidaVolta: respostaJson.horaSaidaVolta || "",
    horaChegadaVolta: respostaJson.horaChegadaVolta || "",
    politicaAlteracoesCancelamentos: politicaFinal,
    link: respostaJson.link || "",
    valor: respostaJson.valor || "",
    foto: respostaJson.foto || "",
    nomeHotel: respostaJson.nomeHotel || "",
    enderecoHotel: respostaJson.enderecoHotel || "",
    telefoneHotel: respostaJson.telefoneHotel || "",
    emailHotel: respostaJson.emailHotel || "",
    quarto: respostaJson.quarto || "",
    regimeHotel: respostaJson.regimeHotel || "",
    comodidades: respostaJson.comodidades || "",
    checkinHotel: respostaJson.checkinHotel || "",
    checkoutHotel: respostaJson.checkoutHotel || "",
    noitesHotel: respostaJson.noitesHotel || "",
    linkHotel: respostaJson.linkHotel || "",
    fotoHotel: respostaJson.fotoHotel || "",
    politicasCondicoesInformacoesEspeciais: respostaJson.politicasCondicoesInformacoesEspeciais || "",
    trasladoTipo: respostaJson.trasladoTipo || "",
    trasladoData: respostaJson.trasladoData || "",
    trasladoHorario: respostaJson.trasladoHorario || "",
    trasladoLocalPartida: respostaJson.trasladoLocalPartida || "",
    trasladoLocalChegada: respostaJson.trasladoLocalChegada || "",
    trasladoVeiculoEmpresa: respostaJson.trasladoVeiculoEmpresa || "",
    trasladoObservacoes: respostaJson.trasladoObservacoes || "",
    ingressoNomeAtracao: respostaJson.ingressoNomeAtracao || "",
    ingressoData: respostaJson.ingressoData || "",
    ingressoHorario: respostaJson.ingressoHorario || "",
    ingressoQuantidade: respostaJson.ingressoQuantidade || "",
    ingressoObservacoes: respostaJson.ingressoObservacoes || "",
  };
}

function montarRelatorioCompleto(
    provedorUsado: string,
    operadorDetectado: string,
    dados: DadosIAExtraidos,
) {
  const fmtData = (d?: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR") : "Não informado");
  const fmtCampo = (v?: string) => v || "Não informado";

  return [
    `**Relatório do Pacote (Analisado com ${provedorUsado})**`,
    "--------------------",
    `**Operador:** ${dados.operador || padronizarOperador(operadorDetectado) || "Não informado"}`,
    `**CIA Aérea:** ${fmtCampo(dados.ciaAerea)}`,
    `**Nº de Reserva/Localizador:** ${fmtCampo(dados.reserva)}`,
    `**Destino Principal:** ${fmtCampo(dados.destino || dados.destinoIda)}`,
    `**Passageiros:** ${fmtCampo(dados.passageiros)}`,
    `**Data de Ida:** ${fmtData(dados.dataIda)}`,
    `**Origem (Ida):** ${fmtCampo(dados.origemIda)}`,
    `**Destino (Ida):** ${fmtCampo(dados.destinoIda)}`,
    `**Duração (Ida):** ${fmtCampo(dados.duracaoIda)}`,
    `**Horário de Saída (Ida):** ${fmtCampo(dados.horaSaidaIda)}`,
    `**Horário de Chegada (Ida):** ${fmtCampo(dados.horaChegadaIda)}`,
    `**Data de Volta:** ${fmtData(dados.dataVolta)}`,
    `**Origem (Volta):** ${fmtCampo(dados.origemVolta)}`,
    `**Destino (Volta):** ${fmtCampo(dados.destinoVolta)}`,
    `**Duração (Volta):** ${fmtCampo(dados.duracaoVolta)}`,
    `**Horário de Saída (Volta):** ${fmtCampo(dados.horaSaidaVolta)}`,
    `**Horário de Chegada (Volta):** ${fmtCampo(dados.horaChegadaVolta)}`,
    `**Link:** ${fmtCampo(dados.link)}`,
    `**Valor:** ${fmtCampo(dados.valor)}`,
    `**Foto:** ${fmtCampo(dados.foto)}`,
    "**Política de alterações e cancelamentos:**",
    dados.politicaAlteracoesCancelamentos || "Não informado",
    `**Nome do Hotel:** ${fmtCampo(dados.nomeHotel)}`,
    `**Endereço do Hotel:** ${fmtCampo(dados.enderecoHotel)}`,
    `**Telefone do Hotel:** ${fmtCampo(dados.telefoneHotel)}`,
    `**E-mail do Hotel:** ${fmtCampo(dados.emailHotel)}`,
    `**Check-in:** ${fmtData(dados.checkinHotel)}`,
    `**Check-out:** ${fmtData(dados.checkoutHotel)}`,
    `**Tipo de Quarto:** ${fmtCampo(dados.quarto)}`,
    `**Regime / Pensão:** ${fmtCampo(dados.regimeHotel)}`,
    `**Comodidades do Estabelecimento:** ${fmtCampo(dados.comodidades)}`,
    `**Noites:** ${fmtCampo(dados.noitesHotel)}`,
    `**Link do Hotel:** ${fmtCampo(dados.linkHotel)}`,
    `**Foto da Hospedagem:** ${fmtCampo(dados.fotoHotel)}`,
    "**Políticas, Condições e Informações Especiais:**",
    dados.politicasCondicoesInformacoesEspeciais || "Não informado",
    `**Tipo de Traslado:** ${fmtCampo(dados.trasladoTipo)}`,
    `**Data do Traslado:** ${fmtData(dados.trasladoData)}`,
    `**Horário do Traslado:** ${fmtCampo(dados.trasladoHorario)}`,
    `**Local de Partida (Traslado):** ${fmtCampo(dados.trasladoLocalPartida)}`,
    `**Local de Chegada (Traslado):** ${fmtCampo(dados.trasladoLocalChegada)}`,
    `**Veículo/Empresa (Traslado):** ${fmtCampo(dados.trasladoVeiculoEmpresa)}`,
    "**Observações do Traslado:**",
    dados.trasladoObservacoes || "Não informado",
    `**Nome da Atração/Ingresso:** ${fmtCampo(dados.ingressoNomeAtracao)}`,
    `**Data do Ingresso:** ${fmtData(dados.ingressoData)}`,
    `**Horário do Ingresso:** ${fmtCampo(dados.ingressoHorario)}`,
    `**Quantidade de Ingressos:** ${fmtCampo(dados.ingressoQuantidade)}`,
    "**Observações do Ingresso:**",
    dados.ingressoObservacoes || "Não informado",
  ].join("\n");
}

function criarPromptAnaliseCompleta(contextoArquivo: string, temConteudoArquivo: boolean) {
  return `Você é um assistente especialista em turismo. Analise o contexto de um arquivo de um pacote de viagem e extraia TODAS as informações disponíveis no documento para o formato JSON.

Contexto do arquivo para análise:
${contextoArquivo}

Instruções:
1. Extraia todas as informações do conteúdo do arquivo (PDF, OCR ou imagem). Seja exaustivo e procure em todas as seções do documento.
2. Se uma informação não for encontrada, retorne uma string vazia "" para o campo correspondente.
3. Para datas (dataIda, dataVolta, checkinHotel, checkoutHotel), use o formato AAAA-MM-DD.
4. O campo "ciaAerea" deve conter o nome da companhia aérea (ex: LATAM Airlines Group, GOL, Azul). Não confunda com operadora de turismo.
5. Identifique origem, destino e duração separadamente para o trecho de IDA e para o trecho de VOLTA.
6. A duração do voo deve estar no formato legível (ex: "2h 30min", "11h 45min", "1h 05min").
7. Horários devem estar no formato HH:MM (ex: "08:35", "23:10").
8. O campo "valor" deve conter o valor total do pacote/reserva como aparece no documento (ex: "R$ 5.432,10").
9. Os campos "link" e "foto" devem conter URLs completas quando existirem no documento.
10. O campo "nomeHotel" deve conter o nome do estabelecimento de hospedagem.
11. O campo "regimeHotel" deve conter o regime de pensão (ex: "Café da manhã", "Meia pensão", "All inclusive").
12. O campo "noitesHotel" deve conter apenas o número de noites (ex: "7").
13. Localize a seção "Política de alterações e cancelamentos" e copie todo o texto integralmente para "politicaAlteracoesCancelamentos", sem resumir.
14. Localize seções de "Políticas", "Condições" ou "Informações Especiais" da hospedagem e copie integralmente para "politicasCondicoesInformacoesEspeciais".
15. Identifique informações de TRASLADO (transfer), quando houver: tipo (ex: "Aeroporto-Hotel", "Hotel-Aeroporto", "Hotel-Passeio"), data, horário, local de partida, local de chegada, veículo/empresa responsável e observações relevantes (ex: regular, privativo, ponto de encontro).
16. Identifique informações de INGRESSO (tickets/atrações), quando houver: nome da atração/local, data, horário, quantidade de ingressos e observações relevantes (ex: categoria do ingresso, se inclui guia).
17. Retorne APENAS o objeto JSON, sem nenhum texto ou formatação adicional.
${!temConteudoArquivo ? "\n18. Como o conteúdo do arquivo não pôde ser lido, baseie sua análise no nome do arquivo e na imagem anexada (se houver)." : ""}
Formato JSON esperado:
{
  "ciaAerea": "string",
  "reserva": "string",
  "destino": "string",
  "passageiros": "string",
  "dataIda": "string",
  "horaSaidaIda": "string",
  "horaChegadaIda": "string",
  "origemIda": "string",
  "destinoIda": "string",
  "duracaoIda": "string",
  "dataVolta": "string",
  "horaSaidaVolta": "string",
  "horaChegadaVolta": "string",
  "origemVolta": "string",
  "destinoVolta": "string",
  "duracaoVolta": "string",
  "link": "string",
  "valor": "string",
  "foto": "string",
  "nomeHotel": "string",
  "enderecoHotel": "string",
  "telefoneHotel": "string",
  "emailHotel": "string",
  "checkinHotel": "string",
  "checkoutHotel": "string",
  "quarto": "string",
  "regimeHotel": "string",
  "comodidades": "string",
  "noitesHotel": "string",
  "linkHotel": "string",
  "fotoHotel": "string",
  "politicasCondicoesInformacoesEspeciais": "string",
  "politicaAlteracoesCancelamentos": "string",
  "trasladoTipo": "string",
  "trasladoData": "string",
  "trasladoHorario": "string",
  "trasladoLocalPartida": "string",
  "trasladoLocalChegada": "string",
  "trasladoVeiculoEmpresa": "string",
  "trasladoObservacoes": "string",
  "ingressoNomeAtracao": "string",
  "ingressoData": "string",
  "ingressoHorario": "string",
  "ingressoQuantidade": "string",
  "ingressoObservacoes": "string"
}`;
}

function chaveNomeArquivo(nomeArquivo: string) {
  const semExtensao = nomeArquivo.replace(/\.[^.]+$/, "");
  return normalizarChave(semExtensao);
}

function ehDocumentoVoo(nomeArquivo: string) {
  const chave = chaveNomeArquivo(nomeArquivo);
  return chave.startsWith("voucherflight") || chave.startsWith("voucheraereo") || chave.includes("voucheraereo");
}

function ehDocumentoHotel(nomeArquivo: string) {
  const chave = chaveNomeArquivo(nomeArquivo);
  return chave.startsWith("voucherhotel") || chave.includes("voucherhotel");
}

function obterDadosIADocumento(doc: Documento) {
  if (!doc.dadosIA && !doc.analise) return null;
  return doc.dadosIA || extrairDadosIADeAnalise(doc.analise || "");
}

function encontrarDocumentoVoo(documentos: Documento[]) {
  return documentos.find((doc) => ehDocumentoVoo(doc.nome) && (doc.dadosIA || doc.analise));
}

function encontrarDocumentoHotel(documentos: Documento[]) {
  const documentoEspecifico = documentos.find((doc) => ehDocumentoHotel(doc.nome) && (doc.dadosIA || doc.analise));
  if (documentoEspecifico) return documentoEspecifico;

  return documentos.find((doc) => ehDocumentoVoo(doc.nome) && (doc.dadosIA || doc.analise));
}

function mapearDetalhesVoo<T extends Pick<
    Pacote,
    | "operador"
    | "ciaAerea"
    | "reserva"
    | "destino"
    | "origem"
    | "dataIda"
    | "dataVolta"
    | "passageiros"
    | "origemIda"
    | "destinoIda"
    | "duracaoIda"
    | "origemVolta"
    | "destinoVolta"
    | "duracaoVolta"
    | "politicaAlteracoesCancelamentos"
>>(formAtual: T, dadosIAVoo: NonNullable<Documento["dadosIA"]>): T {
  return {
    ...formAtual,
    operador: dadosIAVoo.operador || formAtual.operador || "",
    ciaAerea: dadosIAVoo.ciaAerea || formAtual.ciaAerea || "",
    reserva: dadosIAVoo.reserva || formAtual.reserva || "",
    destino: dadosIAVoo.destinoIda || dadosIAVoo.destino || formAtual.destino || "",
    origem: dadosIAVoo.origemIda || formAtual.origem || "",
    dataIda: dadosIAVoo.dataIda || formAtual.dataIda || "",
    dataVolta: dadosIAVoo.dataVolta || formAtual.dataVolta || "",
    passageiros: dadosIAVoo.passageiros || formAtual.passageiros || "",
    origemIda: dadosIAVoo.origemIda || formAtual.origemIda || "",
    destinoIda: dadosIAVoo.destinoIda || formAtual.destinoIda || "",
    duracaoIda: dadosIAVoo.duracaoIda || formAtual.duracaoIda || "",
    origemVolta: dadosIAVoo.origemVolta || formAtual.origemVolta || "",
    destinoVolta: dadosIAVoo.destinoVolta || formAtual.destinoVolta || "",
    duracaoVolta: dadosIAVoo.duracaoVolta || formAtual.duracaoVolta || "",
    politicaAlteracoesCancelamentos: dadosIAVoo.politicaAlteracoesCancelamentos || formAtual.politicaAlteracoesCancelamentos || "",
  };
}

function mapearDetalhesHospedagem<T extends Pick<
    Pacote,
    | "hospedagemNome"
    | "hospedagemEndereco"
    | "hospedagemTelefone"
    | "hospedagemEmail"
    | "hospedagemTipoQuarto"
    | "hospedagemComodidades"
    | "hospedagemCheckin"
    | "hospedagemCheckout"
    | "hospedagemNoites"
>>(formAtual: T, dadosIAHospedagem: NonNullable<Documento["dadosIA"]>): T {
  return {
    ...formAtual,
    hospedagemNome: dadosIAHospedagem.nomeHotel || formAtual.hospedagemNome || "",
    hospedagemEndereco: dadosIAHospedagem.enderecoHotel || formAtual.hospedagemEndereco || "",
    hospedagemTelefone: dadosIAHospedagem.telefoneHotel || formAtual.hospedagemTelefone || "",
    hospedagemEmail: dadosIAHospedagem.emailHotel || formAtual.hospedagemEmail || "",
    hospedagemTipoQuarto: dadosIAHospedagem.quarto || formAtual.hospedagemTipoQuarto || "",
    hospedagemComodidades: dadosIAHospedagem.comodidades || formAtual.hospedagemComodidades || "",
    hospedagemCheckin: dadosIAHospedagem.checkinHotel || formAtual.hospedagemCheckin || "",
    hospedagemCheckout: dadosIAHospedagem.checkoutHotel || formAtual.hospedagemCheckout || "",
    hospedagemNoites: dadosIAHospedagem.noitesHotel || formAtual.hospedagemNoites || "",
  };
}

function mapearDetalhesTraslado<T extends Pick<
    Pacote,
    | "trasladoTipo"
    | "trasladoData"
    | "trasladoHorario"
    | "trasladoLocalPartida"
    | "trasladoLocalChegada"
    | "trasladoVeiculoEmpresa"
    | "trasladoObservacoes"
>>(formAtual: T, dadosIA: NonNullable<Documento["dadosIA"]>): T {
  return {
    ...formAtual,
    trasladoTipo: dadosIA.trasladoTipo || formAtual.trasladoTipo || "",
    trasladoData: dadosIA.trasladoData || formAtual.trasladoData || "",
    trasladoHorario: dadosIA.trasladoHorario || formAtual.trasladoHorario || "",
    trasladoLocalPartida: dadosIA.trasladoLocalPartida || formAtual.trasladoLocalPartida || "",
    trasladoLocalChegada: dadosIA.trasladoLocalChegada || formAtual.trasladoLocalChegada || "",
    trasladoVeiculoEmpresa: dadosIA.trasladoVeiculoEmpresa || formAtual.trasladoVeiculoEmpresa || "",
    trasladoObservacoes: dadosIA.trasladoObservacoes || formAtual.trasladoObservacoes || "",
  };
}

function mapearDetalhesIngresso<T extends Pick<
    Pacote,
    | "ingressoNomeAtracao"
    | "ingressoData"
    | "ingressoHorario"
    | "ingressoQuantidade"
    | "ingressoObservacoes"
>>(formAtual: T, dadosIA: NonNullable<Documento["dadosIA"]>): T {
  return {
    ...formAtual,
    ingressoNomeAtracao: dadosIA.ingressoNomeAtracao || formAtual.ingressoNomeAtracao || "",
    ingressoData: dadosIA.ingressoData || formAtual.ingressoData || "",
    ingressoHorario: dadosIA.ingressoHorario || formAtual.ingressoHorario || "",
    ingressoQuantidade: dadosIA.ingressoQuantidade || formAtual.ingressoQuantidade || "",
    ingressoObservacoes: dadosIA.ingressoObservacoes || formAtual.ingressoObservacoes || "",
  };
}

function possuiDadosTraslado(dados?: DadosIAExtraidos | null) {
  if (!dados) return false;
  return Boolean(
      dados.trasladoTipo?.trim() ||
      dados.trasladoData?.trim() ||
      dados.trasladoHorario?.trim() ||
      dados.trasladoLocalPartida?.trim() ||
      dados.trasladoLocalChegada?.trim() ||
      dados.trasladoVeiculoEmpresa?.trim() ||
      dados.trasladoObservacoes?.trim()
  );
}

function possuiDadosIngresso(dados?: DadosIAExtraidos | null) {
  if (!dados) return false;
  return Boolean(
      dados.ingressoNomeAtracao?.trim() ||
      dados.ingressoData?.trim() ||
      dados.ingressoHorario?.trim() ||
      dados.ingressoQuantidade?.trim() ||
      dados.ingressoObservacoes?.trim()
  );
}

// O Traslado e o Ingresso podem estar descritos em qualquer documento do pacote
// (geralmente no próprio "Voucheraereo"), então a busca considera todos os anexos,
// dando prioridade ao documento de voo quando houver mais de um candidato.
function encontrarDocumentoTraslado(documentos: Documento[]) {
  const documentoVoo = documentos.find((doc) => ehDocumentoVoo(doc.nome) && possuiDadosTraslado(obterDadosIADocumento(doc)));
  if (documentoVoo) return documentoVoo;
  return documentos.find((doc) => possuiDadosTraslado(obterDadosIADocumento(doc)));
}

function encontrarDocumentoIngresso(documentos: Documento[]) {
  const documentoVoo = documentos.find((doc) => ehDocumentoVoo(doc.nome) && possuiDadosIngresso(obterDadosIADocumento(doc)));
  if (documentoVoo) return documentoVoo;
  return documentos.find((doc) => possuiDadosIngresso(obterDadosIADocumento(doc)));
}

export default function PacotesForm({ pacotes, onPacotesChange }: PacotesFormProps) {
  const [form, setForm] = useState<Omit<Pacote, "id">>(pacoteVazio);
  const [valorInput, setValorInput] = useState("");
  const [erro, setErro] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formMinimizado, setFormMinimizado] = useState(true);
  const [hospedagemMinimizado, setHospedagemMinimizado] = useState(true);
  const [trasladoMinimizado, setTrasladoMinimizado] = useState(true);
  const [ingressoMinimizado, setIngressoMinimizado] = useState(true);
  const [logAnaliseMinimizado, setLogAnaliseMinimizado] = useState(true);
  const [vouchersMinimizado, setVouchersMinimizado] = useState(true);
  const [comodidadesMinimizado, setComodidadesMinimizado] = useState(true);
  const [politicaCancelamentoMinimizado, setPoliticaCancelamentoMinimizado] = useState(true);
  const [relatoriosExpandidos, setRelatoriosExpandidos] = useState<Set<number>>(new Set());
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [logAnaliseIA, setLogAnaliseIA] = useState<string[]>([]);
  const [provedorIA, setProvedorIA] = useState<"automático" | "openai" | "groq" | "gemini" | "openrouter" | "cloudflare">("automático");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const operadores = useMemo(
      () => Array.from(new Set([...operadoresPadrao, ...pacotes.map((item) => item.operador.trim()).filter(Boolean)])),
      [pacotes],
  );

  function limparFormulario() {
    setForm(pacoteVazio);
    setValorInput("");
    setEditandoId(null);
    setFormMinimizado(true);
    setPoliticaCancelamentoMinimizado(true);
    setComodidadesMinimizado(true);
  }

  function salvarPacote() {
    if (!form.operador.trim()) {
      setErro("Informe o operador do pacote.");
      return;
    }

    if (editandoId !== null) {
      onPacotesChange(
          pacotes.map((item) =>
              item.id === editandoId
                  ? {
                    ...item,
                    operador: form.operador.trim(),
                    ciaAerea: form.ciaAerea?.trim(),
                    origem: (form.origemIda || form.origem).trim(),
                    destino: (form.destinoIda || form.destino).trim(),
                    reserva: form.reserva?.trim(),
                    link: form.link.trim(),

                    foto: form.foto,
                    valor: form.valor,
                    dataIda: form.dataIda,
                    dataVolta: form.dataVolta,
                    passageiros: form.passageiros,
                    origemIda: form.origemIda?.trim(),
                    destinoIda: form.destinoIda?.trim(),
                    duracaoIda: form.duracaoIda?.trim(),
                    origemVolta: form.origemVolta?.trim(),
                    destinoVolta: form.destinoVolta?.trim(),
                    duracaoVolta: form.duracaoVolta?.trim(),
                    politicaAlteracoesCancelamentos: form.politicaAlteracoesCancelamentos?.trim(),
                    hospedagemNome: form.hospedagemNome?.trim(),
                    hospedagemEndereco: form.hospedagemEndereco?.trim(),
                    hospedagemTelefone: form.hospedagemTelefone?.trim(),
                    hospedagemEmail: form.hospedagemEmail?.trim(),
                    hospedagemCheckin: form.hospedagemCheckin,
                    hospedagemCheckout: form.hospedagemCheckout,
                    hospedagemTipoQuarto: form.hospedagemTipoQuarto?.trim(),
                    hospedagemRegime: form.hospedagemRegime?.trim(),
                    hospedagemComodidades: form.hospedagemComodidades?.trim(),
                    hospedagemPoliticasCondicoesInformacoesEspeciais: form.hospedagemPoliticasCondicoesInformacoesEspeciais?.trim(),
                    hospedagemNoites: form.hospedagemNoites?.trim(),
                    hospedagemLink: form.hospedagemLink?.trim(),
                    hospedagemFoto: form.hospedagemFoto,
                    documentos: form.documentos || [],
                    logAnalise: logAnaliseIA.join("\n"),
                  }
                  : item,
          ),
      );
      limparFormulario();
      setErro("");
      return;
    }

    onPacotesChange([
      ...pacotes,
      {
        id: Date.now(),
        operador: form.operador.trim(),
        ciaAerea: form.ciaAerea?.trim(),
        origem: (form.origemIda || form.origem).trim(),
        destino: (form.destinoIda || form.destino).trim(),
        reserva: form.reserva?.trim(),
        link: form.link.trim(),

        foto: form.foto,
        valor: form.valor,
        dataIda: form.dataIda,
        dataVolta: form.dataVolta,
        passageiros: form.passageiros,
        origemIda: form.origemIda?.trim(),
        destinoIda: form.destinoIda?.trim(),
        duracaoIda: form.duracaoIda?.trim(),
        origemVolta: form.origemVolta?.trim(),
        destinoVolta: form.destinoVolta?.trim(),
        duracaoVolta: form.duracaoVolta?.trim(),
        politicaAlteracoesCancelamentos: form.politicaAlteracoesCancelamentos?.trim(),
        hospedagemNome: form.hospedagemNome?.trim(),
        hospedagemEndereco: form.hospedagemEndereco?.trim(),
        hospedagemTelefone: form.hospedagemTelefone?.trim(),
        hospedagemEmail: form.hospedagemEmail?.trim(),
        hospedagemCheckin: form.hospedagemCheckin,
        hospedagemCheckout: form.hospedagemCheckout,
        hospedagemTipoQuarto: form.hospedagemTipoQuarto?.trim(),
        hospedagemRegime: form.hospedagemRegime?.trim(),
        hospedagemComodidades: form.hospedagemComodidades?.trim(),
        hospedagemPoliticasCondicoesInformacoesEspeciais: form.hospedagemPoliticasCondicoesInformacoesEspeciais?.trim(),
        hospedagemNoites: form.hospedagemNoites?.trim(),
        hospedagemLink: form.hospedagemLink?.trim(),
        hospedagemFoto: form.hospedagemFoto,
        logAnalise: logAnaliseIA.join("\n"),
        documentos: form.documentos,
      },
    ]);
    limparFormulario();
    setErro("");
  }

  function editarPacote(pacote: Pacote) {
    setVouchersMinimizado(false);
    setFormMinimizado(false);
    setHospedagemMinimizado(false);
    setPoliticaCancelamentoMinimizado(true); // Manter minimizado ao abrir edição
    setComodidadesMinimizado(true); // Manter minimizado ao abrir edição
    setEditandoId(pacote.id);
    const logPacote = (pacote.logAnalise || "")
        .split("\n")
        .map((linha) => linha.trim())
        .filter(Boolean);
    setLogAnaliseIA(logPacote);
    setForm({
      operador: pacote.operador || "",
      ciaAerea: pacote.ciaAerea || "",
      origem: pacote.origem || "",
      destino: pacote.destino || "",
      reserva: pacote.reserva || "",
      link: pacote.link || "",

      foto: pacote.foto || null,
      valor: Number(pacote.valor) || 0,
      documentos: Array.isArray(pacote.documentos) ? pacote.documentos : [],
      dataIda: pacote.dataIda || "",
      dataVolta: pacote.dataVolta || "",
      passageiros: pacote.passageiros || "",
      origemIda: pacote.origemIda || pacote.origem || "",
      destinoIda: pacote.destinoIda || pacote.destino || "",
      duracaoIda: pacote.duracaoIda || "",
      origemVolta: pacote.origemVolta || "",
      destinoVolta: pacote.destinoVolta || "",
      duracaoVolta: pacote.duracaoVolta || "",
      politicaAlteracoesCancelamentos: pacote.politicaAlteracoesCancelamentos || "",
      hospedagemNome: pacote.hospedagemNome || "",
      hospedagemEndereco: pacote.hospedagemEndereco || "",
      hospedagemTelefone: pacote.hospedagemTelefone || "",
      hospedagemEmail: pacote.hospedagemEmail || "",
      hospedagemCheckin: pacote.hospedagemCheckin || "",
      hospedagemCheckout: pacote.hospedagemCheckout || "",
      hospedagemTipoQuarto: pacote.hospedagemTipoQuarto || "",
      hospedagemRegime: pacote.hospedagemRegime || "",
      hospedagemComodidades: pacote.hospedagemComodidades || "",
      hospedagemPoliticasCondicoesInformacoesEspeciais: pacote.hospedagemPoliticasCondicoesInformacoesEspeciais || "",
      hospedagemNoites: pacote.hospedagemNoites || "",
      hospedagemLink: pacote.hospedagemLink || "",
      hospedagemFoto: pacote.hospedagemFoto || null,
      logAnalise: pacote.logAnalise || "",
    });
    setValorInput(pacote.valor ? formatarMoeda(Number(pacote.valor) || 0) : "");
    setErro("");
  }

  function removerPacote(id: number) {
    onPacotesChange(pacotes.filter((item) => item.id !== id));
    if (editandoId === id) {
      limparFormulario();
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
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

    setForm((f) => ({ ...f, documentos: [...f.documentos, ...docs] }));
    e.target.value = "";
  }

  function removerDocumento(idDocumento: number) {
    setForm((f) => ({
      ...f,
      documentos: (f.documentos || []).filter((doc) => doc.id !== idDocumento),
    }))
  }

  function atualizarCamposComResultadoIA() {
    const documentos = form.documentos || [];
    if (documentos.length === 0) {
      setErro("Nenhum documento para atualizar os campos.");
      return;
    }

    // Os campos de Detalhes do Voo só devem ser populados com dados extraídos
    // de um documento cujo nome seja "Voucheraereo" ou comece com "voucher_flight_".
    const documentoVoo = encontrarDocumentoVoo(documentos);
    const dadosIAVoo = documentoVoo ? obterDadosIADocumento(documentoVoo) : null;

    // Os campos de Detalhes da Hospedagem só devem ser populados com dados extraídos
    // de um documento cujo nome seja "VoucherHotel" ou comece com "voucher_hotel_".
    const documentoHospedagem = encontrarDocumentoHotel(documentos);
    const dadosIAHospedagem = documentoHospedagem ? obterDadosIADocumento(documentoHospedagem) : null;

    if (!dadosIAVoo && !dadosIAHospedagem) {
      setErro('Nenhum documento "Voucheraereo", "voucher_flight_", "VoucherHotel" ou "voucher_hotel_" com resultado de IA foi encontrado.');
      return;
    }

    if (dadosIAVoo && !temDadosExtraidos(dadosIAVoo)) {
      setErro("Não foi possível extrair dados do voucher de voo para atualizar os campos.");
      return;
    }

    const documentoTraslado = encontrarDocumentoTraslado(documentos);
    const dadosIATraslado = documentoTraslado ? obterDadosIADocumento(documentoTraslado) : null;
    const documentoIngresso = encontrarDocumentoIngresso(documentos);
    const dadosIAIngresso = documentoIngresso ? obterDadosIADocumento(documentoIngresso) : null;

    setErro("");
    setForm((f) => {
      let proximo = { ...f };
      if (dadosIAVoo && temDadosExtraidos(dadosIAVoo)) {
        proximo = mapearDetalhesVoo(proximo, dadosIAVoo);
      }
      if (dadosIAHospedagem && temDadosExtraidos(dadosIAHospedagem)) {
        proximo = mapearDetalhesHospedagem(proximo, dadosIAHospedagem);
      }
      if (dadosIATraslado && possuiDadosTraslado(dadosIATraslado)) {
        proximo = mapearDetalhesTraslado(proximo, dadosIATraslado);
      }
      if (dadosIAIngresso && possuiDadosIngresso(dadosIAIngresso)) {
        proximo = mapearDetalhesIngresso(proximo, dadosIAIngresso);
      }
      return proximo;
    });
  }

  function atualizarDetalhesVoo() {
    const documentoVoo = encontrarDocumentoVoo(form.documentos || []);
    const dadosIAVoo = documentoVoo ? obterDadosIADocumento(documentoVoo) : null;

    if (!dadosIAVoo || !temDadosExtraidos(dadosIAVoo)) {
      setErro('Nenhum documento "Voucheraereo" ou "voucher_flight_" com resultado de IA foi encontrado.');
      return;
    }

    setErro("");
    setForm((f) => mapearDetalhesVoo(f, dadosIAVoo));
  }

  function atualizarDetalhesHospedagem() {
    const documentoHospedagem = encontrarDocumentoHotel(form.documentos || []);
    const dadosIAHospedagem = documentoHospedagem ? obterDadosIADocumento(documentoHospedagem) : null;

    if (!dadosIAHospedagem || !temDadosExtraidos(dadosIAHospedagem)) {
      setErro('Nenhum documento "VoucherHotel" ou "voucher_hotel_" com resultado de IA foi encontrado.');
      return;
    }

    setErro("");
    setForm((f) => mapearDetalhesHospedagem(f, dadosIAHospedagem));
  }

  function atualizarDetalhesTraslado() {
    const documentoTraslado = encontrarDocumentoTraslado(form.documentos || []);
    const dadosIATraslado = documentoTraslado ? obterDadosIADocumento(documentoTraslado) : null;

    if (!possuiDadosTraslado(dadosIATraslado)) {
      setErro('Nenhum documento com dados de Traslado analisados pela IA foi encontrado.');
      return;
    }

    setErro("");
    setForm((f) => mapearDetalhesTraslado(f, dadosIATraslado!));
  }

  function atualizarDetalhesIngresso() {
    const documentoIngresso = encontrarDocumentoIngresso(form.documentos || []);
    const dadosIAIngresso = documentoIngresso ? obterDadosIADocumento(documentoIngresso) : null;

    if (!possuiDadosIngresso(dadosIAIngresso)) {
      setErro('Nenhum documento com dados de Ingresso analisados pela IA foi encontrado.');
      return;
    }

    setErro("");
    setForm((f) => mapearDetalhesIngresso(f, dadosIAIngresso!));
  }

  async function identificarOperadorNaImagem(imageUrl: string) {
    if (!imageUrl) return "";

    const promptOperador = [
      "Esta imagem contém o logo do fornecedor/operadora de turismo no topo de um voucher ou cotação.",
      "Identifique o nome da operadora exibida no logo (ex: HotelDO, Decolar, CVC, Flytour, Orinter, Abreu, Visual Turismo, Diversa Turismo).",
      "Responda APENAS com o nome da operadora, sem frases extras.",
      "Se não conseguir identificar com confiança, responda apenas com string vazia.",
    ].join("\n");

    try {
      const resposta = await enviarMensagemIA(
          [
            {
              role: "user",
              content: [
                { type: "text", text: promptOperador },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          "openai",
      );

      return padronizarOperador(resposta.reply.replace(/[`"]/g, "").trim());
    } catch {
      return "";
    }
  }

  async function identificarOperadorNoLogo(
      imageUrl: string,
      workerOcr: Worker | null,
      adicionarLog: (mensagem: string) => void,
  ) {
    if (!imageUrl) return "";

    if (workerOcr) {
      adicionarLog("Identificando operador por OCR no logo...");
      const operadorOcr = await identificarOperadorPorOcr(imageUrl, workerOcr);
      if (operadorOcr) {
        adicionarLog(`Operador identificado por OCR: ${operadorOcr}`);
        return operadorOcr;
      }
    }

    adicionarLog("Comparando logo com referência HotelDO...");
    const ehHotelDo = await compararComLogoReferencia(imageUrl, LOGO_HOTELDO_REF);
    if (ehHotelDo) {
      adicionarLog("Logo identificado como HotelDO por comparação visual.");
      return "HotelDO";
    }

    adicionarLog("Tentando identificar operador pela IA no logo...");
    const operadorIa = await identificarOperadorNaImagem(imageUrl);
    if (operadorIa) {
      adicionarLog(`Operador identificado pela IA no logo: ${operadorIa}`);
    }
    return operadorIa;
  }

  async function identificarOperadorNoIcone(doc: Documento, workerOcr: Worker | null, adicionarLog: (mensagem: string) => void) {
    if (!doc.tipo.startsWith("image/") || !doc.arquivo) return "";
    return identificarOperadorNoLogo(doc.arquivo, workerOcr, adicionarLog);
  }

  async function analisarDocumentosComIA() {
    if (!form.documentos || form.documentos.length === 0) {
      setErro("Nenhum documento para analisar.");
      return;
    }

    setAnalisandoIA(true);
    setErro("");
    setForm((f) => ({ ...f, logAnalise: "" }));

    // Usa array local para garantir que o log seja preciso (evita problemas com estado assíncrono do React)
    const logEntries: string[] = ["Iniciando análise com IA..."];
    setLogAnaliseIA([...logEntries]);

    const adicionarLog = (mensagem: string) => {
      logEntries.push(mensagem);
      setLogAnaliseIA([...logEntries]);
    };

    let workerOcr: Worker | null = null;
    try {
      try {
        workerOcr = await createWorker("eng");
      } catch {
        adicionarLog("OCR indisponível; tentando identificação por IA e comparação visual.");
      }

      const novasAnalises = await Promise.all(
          form.documentos.map(async (doc) => {
            let contextoArquivo = "Nome do arquivo: " + doc.nome + "\n\n";
            let temConteudoPdf = false;
            let operadorDetectado = "";
            let politicaAlteracoesCancelamentos = "";

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

                politicaAlteracoesCancelamentos = extrairPoliticaAlteracoesCancelamentos(textContent);
                if (politicaAlteracoesCancelamentos) {
                  adicionarLog(`Política de alterações e cancelamentos identificada em "${doc.nome}".`);
                  contextoArquivo += "--- Política de alterações e cancelamentos ---\n" + politicaAlteracoesCancelamentos + "\n\n";
                }

                adicionarLog(`Extraindo logo do fornecedor em "${doc.nome}"...`);
                const logoEmbutido = await extrairPrimeiraImagemEmbutidaDoPdf(pdf);
                if (logoEmbutido) {
                  operadorDetectado = await identificarOperadorNoLogo(logoEmbutido, workerOcr, adicionarLog);
                }

                if (!operadorDetectado) {
                  adicionarLog(`Tentando identificar operador pelo topo do PDF...`);
                  const logoTopo = await extrairLogoDoTopoDoPdf(pdf);
                  if (logoTopo) {
                    operadorDetectado = await identificarOperadorNoLogo(logoTopo, workerOcr, adicionarLog);
                  }
                }

                if (!operadorDetectado) {
                  operadorDetectado = detectarOperadorNoTexto(textContent);
                  if (operadorDetectado) {
                    adicionarLog(`Operador identificado no texto: ${operadorDetectado}`);
                  }
                }

                if (operadorDetectado) {
                  contextoArquivo += `--- Operador identificado no logo: ${operadorDetectado} ---\n\n`;
                } else {
                  adicionarLog(`Não foi possível identificar o operador pelo logo do fornecedor.`);
                }
              } catch (e) {
                contextoArquivo += "--- Erro ao ler o conteúdo do PDF: " + doc.nome + " ---\n";
              }
            }

            if (doc.tipo.startsWith("image/") && doc.arquivo) {
              operadorDetectado = await identificarOperadorNoIcone(doc, workerOcr, adicionarLog);
              if (operadorDetectado) {
                contextoArquivo += `--- Operador identificado no ícone: ${operadorDetectado} ---\n\n`;
              }
            }

            const prompt = `Você é um assistente especialista em turismo. Analise o contexto de um arquivo de um pacote de viagem e extraia as informações solicitadas para o formato JSON.

Contexto do arquivo para análise:
${contextoArquivo}

Instruções:
1.  Extraia as seguintes informações do nome do arquivo e, se disponível, do conteúdo do PDF.
2.  Se uma informação não for encontrada, retorne uma string vazia "" para o campo correspondente.
3.  Para datas, use o formato AAAA-MM-DD.
4.  O campo "ciaAerea" deve conter o nome da companhia aérea (ex: LATAM Airlines Group, GOL, Azul). Não confunda com operadora de turismo.
5.  Identifique origem, destino e duração separadamente para o trecho de IDA e para o trecho de VOLTA (procure seções "Ida", "Volta", "Outbound", "Return" ou equivalentes no PDF).
6.  A duração do voo deve estar no formato legível (ex: "2h 30min", "11h 45min", "1h 05min").
7.  Localize a seção "Política de alterações e cancelamentos" no PDF e copie todo o texto dessa seção integralmente para o campo "politicaAlteracoesCancelamentos", sem resumir.
8.  O campo "nomeHotel" deve conter o nome do estabelecimento de hospedagem (hotel, resort, pousada), exatamente como aparece no documento.
9.  Identifique informações de TRASLADO (transfer), quando houver no documento: tipo (ex: "Aeroporto-Hotel", "Hotel-Aeroporto", "Hotel-Passeio"), data, horário, local de partida, local de chegada, veículo/empresa responsável e observações relevantes (ex: regular, privativo, ponto de encontro).
10. Identifique informações de INGRESSO (tickets/atrações/passeios), quando houver no documento: nome da atração/local, data, horário, quantidade de ingressos e observações relevantes (ex: categoria do ingresso, se inclui guia).
11. Retorne APENAS o objeto JSON, sem nenhum texto ou formatação adicional.
${!temConteudoPdf ? "\n12. Como o conteúdo do arquivo não pôde ser lido, baseie sua análise **exclusivamente no nome do arquivo**." : ""}
Formato JSON esperado:
{
  "ciaAerea": "string",
  "reserva": "string",
  "destino": "string",
  "passageiros": "string",
  "dataIda": "string",
  "horaSaidaIda": "string",
  "horaChegadaIda": "string",
  "origemIda": "string",
  "destinoIda": "string",
  "duracaoIda": "string",
  "dataVolta": "string",
  "horaSaidaVolta": "string",
  "horaChegadaVolta": "string",
  "origemVolta": "string",
  "destinoVolta": "string",
  "duracaoVolta": "string",
  "nomeHotel": "string",
  "enderecoHotel": "string",
  "telefoneHotel": "string",
  "emailHotel": "string",
  "quarto": "string",
  "comodidades": "string",
  "checkinHotel": "string",
  "checkoutHotel": "string",
  "noitesHotel": "string",
  "linkHotel": "string",
  "politicasCondicoesInformacoesEspeciais": "string",
  "politicaAlteracoesCancelamentos": "string",
  "trasladoTipo": "string",
  "trasladoData": "string",
  "trasladoHorario": "string",
  "trasladoLocalPartida": "string",
  "trasladoLocalChegada": "string",
  "trasladoVeiculoEmpresa": "string",
  "trasladoObservacoes": "string",
  "ingressoNomeAtracao": "string",
  "ingressoData": "string",
  "ingressoHorario": "string",
  "ingressoQuantidade": "string",
  "ingressoObservacoes": "string"
}`;

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
                    // Se a chamada for bem-sucedida, saia do loop
                    if (data) break;
                  } catch (error) {
                    const nomeProvedor = mapaProvedorCapitalizado[provedor];
                    console.warn(`Falha no ${nomeProvedor}, tentando com o próximo...`, error);
                    adicionarLog(`Falha no ${nomeProvedor} para "${doc.nome}". Tentando com o próximo...`);
                  }
                }

                if (!data) {
                  // Se todos os provedores falharem
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

              const politicaFinal =
                  politicaAlteracoesCancelamentos ||
                  respostaJson.politicaAlteracoesCancelamentos ||
                  "";

              // Usa as funções completas de montagem para garantir que TODAS as
              // informações extraídas pela IA sejam aproveitadas, incluindo
              // Traslado e Ingressos (que antes eram descartados aqui).
              const dadosIACompletos = montarDadosIAFromJson(respostaJson, operadorDetectado, politicaFinal);
              const relatorioCompleto = montarRelatorioCompleto(provedorUsado, operadorDetectado, dadosIACompletos);

              return {
                ...doc,
                analise: relatorioCompleto,
                dadosIA: dadosIACompletos,
              };
            } catch (error) {
              const mensagemErro = "Não foi possível analisar o documento. Tente novamente mais tarde.";
              adicionarLog(`Falha ao analisar "${doc.nome}": ${mensagemErro}`);
              return { ...doc, analise: `Falha na análise com IA: ${mensagemErro}` };
            }
          })
      );

      const documentoVoo = encontrarDocumentoVoo(novasAnalises);
      const dadosIAVoo = documentoVoo ? obterDadosIADocumento(documentoVoo) : null;
      const documentoHospedagem = encontrarDocumentoHotel(novasAnalises);
      const dadosIAHospedagem = documentoHospedagem ? obterDadosIADocumento(documentoHospedagem) : null;
      const documentoTraslado = encontrarDocumentoTraslado(novasAnalises);
      const dadosIATraslado = documentoTraslado ? obterDadosIADocumento(documentoTraslado) : null;
      const documentoIngresso = encontrarDocumentoIngresso(novasAnalises);
      const dadosIAIngresso = documentoIngresso ? obterDadosIADocumento(documentoIngresso) : null;

      if (dadosIAVoo && temDadosExtraidos(dadosIAVoo)) {
        adicionarLog(`Preenchendo Detalhes do Voo com base no relatório de "${documentoVoo?.nome}".`);
        setFormMinimizado(false);
      }
      if (dadosIAHospedagem && temDadosExtraidos(dadosIAHospedagem)) {
        adicionarLog(`Preenchendo Detalhes da Hospedagem com base no relatório de "${documentoHospedagem?.nome}".`);
        setHospedagemMinimizado(false);
      }
      if (dadosIATraslado && possuiDadosTraslado(dadosIATraslado)) {
        adicionarLog(`Preenchendo Detalhes do Traslado com base no relatório de "${documentoTraslado?.nome}".`);
        setTrasladoMinimizado(false);
      }
      if (dadosIAIngresso && possuiDadosIngresso(dadosIAIngresso)) {
        adicionarLog(`Preenchendo Detalhes do Ingresso com base no relatório de "${documentoIngresso?.nome}".`);
        setIngressoMinimizado(false);
      }

      setForm((f) => {
        let proximo = { ...f, documentos: novasAnalises };
        if (dadosIAVoo && temDadosExtraidos(dadosIAVoo)) {
          proximo = mapearDetalhesVoo(proximo, dadosIAVoo);
        }
        if (dadosIAHospedagem && temDadosExtraidos(dadosIAHospedagem)) {
          proximo = mapearDetalhesHospedagem(proximo, dadosIAHospedagem);
        }
        if (dadosIATraslado && possuiDadosTraslado(dadosIATraslado)) {
          proximo = mapearDetalhesTraslado(proximo, dadosIATraslado);
        }
        if (dadosIAIngresso && possuiDadosIngresso(dadosIAIngresso)) {
          proximo = mapearDetalhesIngresso(proximo, dadosIAIngresso);
        }
        return proximo;
      });
    } catch (error) {
      const mensagemErro = "Falha em ambos os provedores de IA. Verifique os logs e tente novamente.";
      adicionarLog(mensagemErro);
      setErro(`Falha na análise com IA: ${mensagemErro}`);
    } finally {
      if (workerOcr) {
        await workerOcr.terminate();
      }
      setAnalisandoIA(false);
      // Persiste o log no formulário para exibir após a análise (usa o array local que tem os valores corretos)
      setForm((f) => ({ ...f, logAnalise: logEntries.join("\n") }));
    }
  }


  return (
      <div className="space-y-4">
        {/* Seção de Anexos e Análise com IA */}
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="flex items-center gap-2 font-semibold text-gray-900">
              <Package2 className="h-4 w-4 text-indigo-500" />
              Vouchers
            </h4>          <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setVouchersMinimizado((prev) => !prev)}
              className="gap-2 text-gray-600 hover:text-gray-900"
          >
            {vouchersMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            {vouchersMinimizado ? "Maximizar" : "Minimizar"}
          </Button>
          </div>
          {!vouchersMinimizado && (
              <>
                <div className="space-y-4 mb-4">
                  <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors bg-white"
                  >
                    <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                    <p className="text-xs text-gray-500">Clique para anexar arquivos</p>
                    <p className="text-xs text-gray-400 mt-0.5">PDF, ZIP, JPG, etc.</p>
                  </div>
                  <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                  />
                  {(form.documentos || []).length > 0 ? (
                      <div className="space-y-1.5 pr-2">
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
                                {doc.analise && (
                                    <div className="mt-2 rounded-md border border-indigo-200 bg-indigo-50 text-xs text-indigo-800">
                                      <div className="flex items-center justify-between gap-2 p-2">
                                        <span className="font-medium">Relatório do arquivo</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setRelatoriosExpandidos((prev) => {
                                              const proximos = new Set(prev);
                                              proximos.has(doc.id) ? proximos.delete(doc.id) : proximos.add(doc.id);
                                              return proximos;
                                            })}
                                            className="h-6 gap-1 px-2 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900"
                                        >
                                          {relatoriosExpandidos.has(doc.id) ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                          {relatoriosExpandidos.has(doc.id) ? "Minimizar" : "Maximizar"}
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
                            </div>
                        ))}
                      </div>
                  ) : (
                      <div className="text-center text-xs text-gray-400 border border-dashed rounded-lg p-4 flex items-center justify-center bg-white">Nenhum anexo adicionado.</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={analisarDocumentosComIA}
                      disabled={analisandoIA || (form.documentos || []).length === 0}
                      className="gap-2 text-indigo-600 border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Sparkles className={`w-4 h-4 ${analisandoIA ? "animate-spin" : ""}`} />
                    {analisandoIA ? "Analisando..." : "Analisar com IA"}
                  </Button>
                  <select
                      value={provedorIA}
                      onChange={(e) => {
                        const valor = e.target.value;
                        if (
                            valor === "automático" ||
                            valor === "openai" ||
                            valor === "groq" ||
                            valor === "gemini" ||
                            valor === "openrouter" ||
                            valor === "cloudflare"
                        ) {
                          setProvedorIA(valor);
                        }
                      }}
                      className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring"
                      disabled={analisandoIA}
                  >
                    <option value="automático">Automático</option>
                    <option value="openai">OpenAI</option>
                    <option value="groq">Groq</option>
                    <option value="gemini">Gemini</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="cloudflare">Cloudflare</option>
                  </select>
                </div>
                {logAnaliseIA.length > 0 && (
                    <div className={`mt-2 text-xs ${analisandoIA ? "text-gray-500" : "text-gray-600 p-2 border rounded-md bg-gray-50"}`}>
                      {!analisandoIA && (
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold">Log da última análise:</p>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setLogAnaliseMinimizado((prev) => !prev)}
                                className="h-6 gap-1 px-2 text-gray-600 hover:text-gray-900"
                            >
                              {logAnaliseMinimizado ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                              {logAnaliseMinimizado ? "Maximizar" : "Minimizar"}
                            </Button>
                          </div>
                      )}
                      {(analisandoIA || !logAnaliseMinimizado) && (
                          <pre className="whitespace-pre-wrap font-sans space-y-1 mt-1">{logAnaliseIA.join("\n")}</pre>
                      )}
                    </div>
                )}
                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t">
                  <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                    <Plus className="h-4 w-4 text-indigo-500" />
                    Detalhes do Voo
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={atualizarDetalhesVoo}
                        disabled={analisandoIA || (form.documentos || []).length === 0}
                        className="gap-2"
                    >
                      <Sparkles className={`w-4 h-4 ${analisandoIA ? "animate-spin" : ""}`} />
                      Atualizar
                    </Button>
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
                </div>

                {!formMinimizado && (
                    <>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-4">
                        <div className="sm:col-span-2">
                          <Label className="text-xs">Operador *</Label>
                          <Input
                              className="mt-1"
                              placeholder="Selecione da lista ou digite"
                              value={form.operador}
                              onChange={(e) => setForm((prev) => ({ ...prev, operador: e.target.value }))}
                              list="lista-operadores-pacotes"
                          />
                          <datalist id="lista-operadores-pacotes">
                            {operadores.map((operador) => (
                                <option key={operador} value={operador} />
                            ))}
                          </datalist>
                        </div>

                        <div className="sm:col-span-2">
                          <Label className="text-xs">CIA Aérea</Label>
                          <Input
                              className="mt-1"
                              placeholder="Ex: LATAM Airlines Group"
                              value={form.ciaAerea || ""}
                              onChange={(e) => setForm((prev) => ({ ...prev, ciaAerea: e.target.value }))}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <Label className="text-xs">Nº de Reserva</Label>
                          <Input
                              className="mt-1"
                              placeholder="Ex: ABC123"
                              value={form.reserva || ""}
                              onChange={(e) => setForm((prev) => ({ ...prev, reserva: e.target.value }))}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <Label className="text-xs">Link</Label>
                          <div className="relative mt-1">
                            <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="https://..."
                                className="pl-8"
                                value={form.link}
                                onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Trecho de Ida</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Origem (Ida)</Label>
                              <Input
                                  className="mt-1"
                                  placeholder="Ex: São Paulo (GRU)"
                                  value={form.origemIda || ""}
                                  onChange={(e) => setForm((prev) => ({ ...prev, origemIda: e.target.value, origem: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Destino (Ida)</Label>
                              <Input
                                  className="mt-1"
                                  placeholder="Ex: Lisboa (LIS)"
                                  value={form.destinoIda || ""}
                                  onChange={(e) => setForm((prev) => ({ ...prev, destinoIda: e.target.value, destino: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Duração (Ida)</Label>
                              <Input
                                  className="mt-1"
                                  placeholder="Ex: 11h 30min"
                                  value={form.duracaoIda || ""}
                                  onChange={(e) => setForm((prev) => ({ ...prev, duracaoIda: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Trecho de Volta</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Origem (Volta)</Label>
                              <Input
                                  className="mt-1"
                                  placeholder="Ex: Lisboa (LIS)"
                                  value={form.origemVolta || ""}
                                  onChange={(e) => setForm((prev) => ({ ...prev, origemVolta: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Destino (Volta)</Label>
                              <Input
                                  className="mt-1"
                                  placeholder="Ex: São Paulo (GRU)"
                                  value={form.destinoVolta || ""}
                                  onChange={(e) => setForm((prev) => ({ ...prev, destinoVolta: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Duração (Volta)</Label>
                              <Input
                                  className="mt-1"
                                  placeholder="Ex: 11h 30min"
                                  value={form.duracaoVolta || ""}
                                  onChange={(e) => setForm((prev) => ({ ...prev, duracaoVolta: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">Data de Ida</Label>
                            <Input
                                type="date"
                                className="mt-1"
                                value={form.dataIda || ""}
                                onChange={(e) => setForm((prev) => ({ ...prev, dataIda: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Data de Volta</Label>
                            <Input
                                type="date"
                                className="mt-1"
                                value={form.dataVolta || ""}
                                onChange={(e) => setForm((prev) => ({ ...prev, dataVolta: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Passageiros</Label>
                            <Input
                                className="mt-1"
                                placeholder="Ex: 2 adultos, 1 criança"
                                value={form.passageiros || ""}
                                onChange={(e) => setForm((prev) => ({ ...prev, passageiros: e.target.value }))}
                            />
                          </div>
                        </div>



                        <div className="sm:col-span-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Política de alterações e cancelamentos</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPoliticaCancelamentoMinimizado((prev) => !prev)}
                                className="gap-1 text-gray-600 hover:text-gray-900 h-7 px-1.5"
                            >
                              {politicaCancelamentoMinimizado ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                              <span className="text-xs">{politicaCancelamentoMinimizado ? "Maximizar" : "Minimizar"}</span>
                            </Button>
                          </div>
                          {!politicaCancelamentoMinimizado && (
                              <Textarea
                                  className="mt-1 min-h-28"
                                  placeholder="Texto extraído do voucher sobre alterações e cancelamentos"
                                  value={form.politicaAlteracoesCancelamentos || ""}
                                  onChange={(e) => setForm((prev) => ({ ...prev, politicaAlteracoesCancelamentos: e.target.value }))}
                              />
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <Label className="text-xs">Foto (Link)</Label>
                          <div className="relative mt-1">
                            <Image className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="https://media.staticontent.com/media/pictures/..."
                                className="pl-8"
                                value={form.foto || ""}
                                onChange={(e) => setForm((prev) => ({ ...prev, foto: e.target.value.trim() || null }))}
                            />
                          </div>
                          {form.foto && (
                              <div className="mt-2 overflow-hidden rounded-md border border-gray-200">
                                <img src={form.foto} alt="Prévia da foto do pacote" className="h-28 w-full object-cover" />
                              </div>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <Label className="text-xs">Valor (R$)</Label>
                          <Input
                              placeholder="R$ 0,00"
                              value={valorInput}
                              onChange={(e) => {
                                const texto = e.target.value;
                                setValorInput(texto);
                                setForm((prev) => ({ ...prev, valor: parseMoeda(texto) }));
                              }}
                              onBlur={() => {
                                setValorInput(form.valor > 0 ? formatarMoeda(form.valor) : "");
                              }}
                              className="mt-1"
                          />
                        </div>
                      </div>
                    </>
                )}

                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t">
                  <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                    <Plus className="h-4 w-4 text-indigo-500" />
                    Detalhes da Hospedagem
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={atualizarDetalhesHospedagem}
                        disabled={analisandoIA || (form.documentos || []).length === 0}
                        className="gap-2"
                    >
                      <Sparkles className={`w-4 h-4 ${analisandoIA ? "animate-spin" : ""}`} />
                      Atualizar
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setHospedagemMinimizado((prev) => !prev)}
                        className="gap-2 text-gray-600 hover:text-gray-900"
                    >
                      {hospedagemMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      {hospedagemMinimizado ? "Maximizar" : "Minimizar"}
                    </Button>
                  </div>
                </div>

                {!hospedagemMinimizado && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-4">
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Nome do Hotel</Label>
                        <Input
                            className="mt-1"
                            placeholder="Ex: Hotel Ibis Lisboa"
                            value={form.hospedagemNome || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemNome: e.target.value }))}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs">Endereço</Label>
                        <Input
                            className="mt-1"
                            placeholder="Ex: Rua Augusta, 123 - Lisboa"
                            value={form.hospedagemEndereco || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemEndereco: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Telefone</Label>
                        <Input
                            type="tel"
                            className="mt-1"
                            placeholder="Ex: +55 11 1234-5678"
                            value={form.hospedagemTelefone || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemTelefone: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">E-mail</Label>
                        <Input
                            type="email"
                            className="mt-1"
                            placeholder="Ex: reservas@hotel.com"
                            value={form.hospedagemEmail || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemEmail: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Check-in</Label>
                        <Input
                            type="date"
                            className="mt-1"
                            value={form.hospedagemCheckin || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemCheckin: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Check-out</Label>
                        <Input
                            type="date"
                            className="mt-1"
                            value={form.hospedagemCheckout || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemCheckout: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Tipo de Quarto</Label>
                        <Input
                            className="mt-1"
                            placeholder="Ex: Duplo Standard"
                            value={form.hospedagemTipoQuarto || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemTipoQuarto: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Regime / Pensão</Label>
                        <Input
                            className="mt-1"
                            placeholder="Ex: Café da manhã"
                            value={form.hospedagemRegime || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemRegime: e.target.value }))}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Comodidades do estabelecimento</Label>
                          <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setComodidadesMinimizado((prev) => !prev)}
                              className="gap-1 text-gray-600 hover:text-gray-900 h-7 px-1.5"
                          >
                            {comodidadesMinimizado ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                            <span className="text-xs">{comodidadesMinimizado ? "Maximizar" : "Minimizar"}</span>
                          </Button>
                        </div>
                        {!comodidadesMinimizado && (
                            <Textarea
                                className="mt-1 min-h-20"
                                placeholder="Ex: piscina, Wi-Fi, academia, estacionamento"
                                value={form.hospedagemComodidades || ""}
                                onChange={(e) => setForm((prev) => ({ ...prev, hospedagemComodidades: e.target.value }))}
                            />
                        )}
                      </div>

                      <div>
                        <Label className="text-xs">Noites</Label>
                        <Input
                            className="mt-1"
                            placeholder="Ex: 7"
                            value={form.hospedagemNoites || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemNoites: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Link do Hotel</Label>
                        <div className="relative mt-1">
                          <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                              placeholder="https://..."
                              className="pl-8"
                              value={form.hospedagemLink || ""}
                              onChange={(e) => setForm((prev) => ({ ...prev, hospedagemLink: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs">Foto da Hospedagem (Link)</Label>
                        <div className="relative mt-1">
                          <Image className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                              placeholder="https://..."
                              className="pl-8"
                              value={form.hospedagemFoto || ""}
                              onChange={(e) => setForm((prev) => ({ ...prev, hospedagemFoto: e.target.value.trim() || null }))}
                          />
                        </div>
                        {form.hospedagemFoto && (
                            <div className="mt-2 overflow-hidden rounded-md border border-gray-200">
                              <img src={form.hospedagemFoto} alt="Prévia da foto da hospedagem" className="h-28 w-full object-cover" />
                            </div>
                        )}
                      </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t">
                  <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                    <Plus className="h-4 w-4 text-indigo-500" />
                    Detalhes do Traslado
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={atualizarDetalhesTraslado}
                        disabled={analisandoIA || (form.documentos || []).length === 0}
                        className="gap-2"
                    >
                      <Sparkles className={`w-4 h-4 ${analisandoIA ? "animate-spin" : ""}`} />
                      Atualizar
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setTrasladoMinimizado((prev) => !prev)}
                        className="gap-2 text-gray-600 hover:text-gray-900"
                    >
                      {trasladoMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      {trasladoMinimizado ? "Maximizar" : "Minimizar"}
                    </Button>
                  </div>
                </div>

                {!trasladoMinimizado && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-4">
                      <div>
                        <Label className="text-xs">Tipo de Traslado</Label>
                        <Input
                            className="mt-1"
                            placeholder="Ex: Aeroporto-Hotel"
                            value={form.trasladoTipo || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, trasladoTipo: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Veículo/Empresa</Label>
                        <Input
                            className="mt-1"
                            placeholder="Ex: Shuttle Regular XYZ"
                            value={form.trasladoVeiculoEmpresa || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, trasladoVeiculoEmpresa: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Data do Traslado</Label>
                        <Input
                            type="date"
                            className="mt-1"
                            value={form.trasladoData || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, trasladoData: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Horário do Traslado</Label>
                        <Input
                            type="time"
                            className="mt-1"
                            value={form.trasladoHorario || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, trasladoHorario: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Local de Partida</Label>
                        <Input
                            className="mt-1"
                            placeholder="Ex: Aeroporto de Lisboa"
                            value={form.trasladoLocalPartida || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, trasladoLocalPartida: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Local de Chegada</Label>
                        <Input
                            className="mt-1"
                            placeholder="Ex: Hotel Ibis Lisboa"
                            value={form.trasladoLocalChegada || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, trasladoLocalChegada: e.target.value }))}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs">Observações do Traslado</Label>
                        <Textarea
                            className="mt-1 min-h-20"
                            placeholder="Ex: regular, privativo, ponto de encontro"
                            value={form.trasladoObservacoes || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, trasladoObservacoes: e.target.value }))}
                        />
                      </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t">
                  <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                    <Plus className="h-4 w-4 text-indigo-500" />
                    Detalhes do Ingresso
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={atualizarDetalhesIngresso}
                        disabled={analisandoIA || (form.documentos || []).length === 0}
                        className="gap-2"
                    >
                      <Sparkles className={`w-4 h-4 ${analisandoIA ? "animate-spin" : ""}`} />
                      Atualizar
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIngressoMinimizado((prev) => !prev)}
                        className="gap-2 text-gray-600 hover:text-gray-900"
                    >
                      {ingressoMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      {ingressoMinimizado ? "Maximizar" : "Minimizar"}
                    </Button>
                  </div>
                </div>

                {!ingressoMinimizado && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-4">
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Nome da Atração/Ingresso</Label>
                        <Input
                            className="mt-1"
                            placeholder="Ex: Torre Eiffel - Acesso ao topo"
                            value={form.ingressoNomeAtracao || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, ingressoNomeAtracao: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Data do Ingresso</Label>
                        <Input
                            type="date"
                            className="mt-1"
                            value={form.ingressoData || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, ingressoData: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Horário do Ingresso</Label>
                        <Input
                            type="time"
                            className="mt-1"
                            value={form.ingressoHorario || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, ingressoHorario: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Quantidade de Ingressos</Label>
                        <Input
                            className="mt-1"
                            placeholder="Ex: 2"
                            value={form.ingressoQuantidade || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, ingressoQuantidade: e.target.value }))}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs">Observações do Ingresso</Label>
                        <Textarea
                            className="mt-1 min-h-20"
                            placeholder="Ex: categoria do ingresso, se inclui guia"
                            value={form.ingressoObservacoes || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, ingressoObservacoes: e.target.value }))}
                        />
                      </div>
                    </div>
                )}

                {(!formMinimizado || !hospedagemMinimizado) && (
                    <>
                      {erro && <p className="mt-3 text-xs text-red-500">{erro}</p>}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" onClick={salvarPacote} className="gap-2">
                          <Plus className="h-4 w-4" />
                          {editandoId !== null ? "Salvar voucher" : "Adicionar voucher"}
                        </Button>
                        {editandoId !== null && (
                            <Button type="button" variant="outline" onClick={limparFormulario}>
                              Cancelar edição
                            </Button>
                        )}
                      </div>
                    </>
                )}
              </>
          )}

        </Card>

        {/* Lista de Pacotes Adicionados */}
        <div className="space-y-3">
          {pacotes.map((pacote, index) => (
              <Card key={pacote.id} className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-400">Voucher {index + 1}</p>
                    <p className="font-semibold text-gray-900">{pacote.operador || "Sem operador"}</p>
                    {pacote.reserva && (
                        <p className="text-xs text-gray-500 mt-0.5">Reserva: {pacote.reserva}</p>
                    )}
                    {(pacote.origemIda || pacote.destinoIda || pacote.origem || pacote.destino) && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Ida: {pacote.origemIda || pacote.origem || "Origem"} → {pacote.destinoIda || pacote.destino || "Destino"}
                          {pacote.duracaoIda ? ` (${pacote.duracaoIda})` : ""}
                        </p>
                    )}
                    {(pacote.origemVolta || pacote.destinoVolta) && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Volta: {pacote.origemVolta || "Origem"} → {pacote.destinoVolta || "Destino"}
                          {pacote.duracaoVolta ? ` (${pacote.duracaoVolta})` : ""}
                        </p>
                    )}
                    {pacote.hospedagemNome && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Hotel: {pacote.hospedagemNome}
                          {pacote.hospedagemCheckin && pacote.hospedagemCheckout
                              ? ` (${pacote.hospedagemCheckin} → ${pacote.hospedagemCheckout})`
                              : ""}
                        </p>
                    )}
                    {(pacote.trasladoTipo ||
                        pacote.trasladoLocalPartida ||
                        pacote.trasladoLocalChegada ||
                        pacote.trasladoData ||
                        pacote.trasladoHorario ||
                        pacote.trasladoVeiculoEmpresa) && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Traslado: {pacote.trasladoTipo || "Tipo não informado"}
                          {pacote.trasladoLocalPartida && pacote.trasladoLocalChegada
                              ? ` (${pacote.trasladoLocalPartida} → ${pacote.trasladoLocalChegada})`
                              : ""}
                          {pacote.trasladoData || pacote.trasladoHorario
                              ? ` - ${[pacote.trasladoData, pacote.trasladoHorario].filter(Boolean).join(" ")}`
                              : ""}
                          {pacote.trasladoVeiculoEmpresa ? ` - ${pacote.trasladoVeiculoEmpresa}` : ""}
                        </p>
                    )}
                    {pacote.trasladoObservacoes && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Obs. Traslado: {pacote.trasladoObservacoes}
                        </p>
                    )}
                    {pacote.ingressoNomeAtracao && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Ingresso: {pacote.ingressoNomeAtracao}
                          {pacote.ingressoQuantidade ? ` (${pacote.ingressoQuantidade})` : ""}
                        </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => editarPacote(pacote)}
                        className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                        title="Editar pacote"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => removerPacote(pacote.id)}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50"
                        title="Remover pacote"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
          ))}
        </div>
      </div>
  );
}
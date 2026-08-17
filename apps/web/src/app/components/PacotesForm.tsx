import { useMemo, useState, useRef } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, Link2, Package2, Image, Upload, FileText, X, Sparkles, RefreshCw, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { enviarMensagemIA, type AIChatApiMessageContent } from "../data/aiChatApi";
import { API_CONFIG } from "../data/apiConfig";
import { buscarFotoDestino } from "../data/placePhotoApi";
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
  exibirNoRoteiro?: boolean;
  analise?: string;
  dadosIA?: DadosIAExtraidos;
}

// Representa uma única atração/ingresso extraída do documento
interface IngressoItem {
  nomeAtracao: string;
  data: string;
  horario: string;
  quantidade: string;
  observacoes: string;
}

type DadosIAExtraidos = {
  operador?: string;
  ciaAerea?: string;
  ciaAereaVolta?: string;
  numeroVooIda?: string;
  numeroVooVolta?: string;
  bagagemIda?: string;
  bagagemVolta?: string;
  reserva?: string;
  reservaVolta?: string;
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
  linkVolta?: string;
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
  horarioCheckinHotel?: string;
  horarioCheckoutHotel?: string;
  noitesHotel?: string;
  valorHotel?: string;
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
  seguroAssistencia?: string;
  seguroSeguradora?: string;
  seguroPlano?: string;
  seguroNumeroReserva?: string;
  seguroNumeroConfirmacao?: string;
  seguroApoliceCertificado?: string;
  seguroSegurados?: string;
  seguroDestino?: string;
  seguroAmbitoCobertura?: string;
  seguroVigenciaInicio?: string;
  seguroVigenciaFim?: string;
  seguroCoberturas?: string;
  seguroValor?: string;
  seguroObservacoes?: string;
  // Campos legados (single ingresso) - mantidos para retrocompatibilidade com relatórios antigos
  ingressoNomeAtracao?: string;
  ingressoData?: string;
  ingressoHorario?: string;
  ingressoQuantidade?: string;
  ingressoObservacoes?: string;
  // Array com todas as atrações/ingressos extraídas
  ingressos?: IngressoItem[];
  dadosCliente?: string;
  informacoesAdicionais?: string;
  conteudoCompleto?: string;
}

interface Pacote {
  id: number;
  operador: string;
  ciaAerea?: string;
  ciaAereaVolta?: string;
  numeroVooIda?: string;
  numeroVooVolta?: string;
  bagagemIda?: string;
  bagagemVolta?: string;
  origem: string;
  destino: string;
  reserva?: string;
  reservaVolta?: string;
  link: string;
  linkVolta?: string;
  urlOperador?: string[];

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
  horaSaidaIda?: string;
  horaChegadaIda?: string;
  horaSaidaVolta?: string;
  horaChegadaVolta?: string;
  politicaAlteracoesCancelamentos?: string;
  hospedagemNome?: string;
  hospedagemEndereco?: string;
  hospedagemTelefone?: string;
  hospedagemEmail?: string;
  hospedagemCheckin?: string;
  hospedagemCheckout?: string;
  hospedagemHorarioCheckin?: string;
  hospedagemHorarioCheckout?: string;
  hospedagemTipoQuarto?: string;
  hospedagemRegime?: string;
  hospedagemComodidades?: string;
  hospedagemPoliticasCondicoesInformacoesEspeciais?: string;
  hospedagemNoites?: string;
  hospedagemValor?: number;
  hospedagemLink?: string;
  hospedagemLinks?: string[];
  hospedagemFoto?: string | null;
  hospedagemFotos?: string[];
  trasladoTipo?: string;
  trasladoData?: string;
  trasladoHorario?: string;
  trasladoLocalPartida?: string;
  trasladoLocalChegada?: string;
  trasladoVeiculoEmpresa?: string;
  trasladoObservacoes?: string;
  seguroAssistencia?: string;
  seguroSeguradora?: string;
  seguroPlano?: string;
  seguroNumeroReserva?: string;
  seguroNumeroConfirmacao?: string;
  seguroApoliceCertificado?: string;
  seguroSegurados?: string;
  seguroDestino?: string;
  seguroAmbitoCobertura?: string;
  seguroVigenciaInicio?: string;
  seguroVigenciaFim?: string;
  seguroCoberturas?: string;
  seguroValor?: number;
  seguroObservacoes?: string;
  // Campos legados (single ingresso) - mantidos para retrocompatibilidade
  ingressoNomeAtracao?: string;
  ingressoData?: string;
  ingressoHorario?: string;
  ingressoQuantidade?: string;
  ingressoObservacoes?: string;
  // Array com todas as atrações/ingressos
  ingressos?: IngressoItem[];
  dadosCliente?: string;
  informacoesAdicionais?: string;
  conteudoCompleto?: string;
  descricao?: string;
  logAnalise?: string;
  documentos: Documento[];
}

interface PacotesFormProps {
  pacotes: Pacote[];
  onPacotesChange: (pacotes: Pacote[]) => void;
  hospedagens?: any[];
  onHospedagensChange?: (hospedagens: any[]) => void;
}

const operadoresPadrao = [
  "Abreu",
  "AgaxTur",
  "CVC",
  "Decolar",
  "Diversa Turismo",
  "Flytour",
  "HotelDO",
  "Orinter",
  "Visual Turismo",
];

const ciasAereasPadrao = [
  "Azul",
  "GOL",
  "LATAM",
  "TAP Air Portugal",
  "American Airlines",
  "Air Canada",
  "Air Europa",
  "Air France",
  "Aerolíneas Argentinas",
  "Avianca",
  "British Airways",
  "Copa Airlines",
  "Delta Air Lines",
  "Emirates",
  "Iberia",
  "ITA Airways",
  "KLM",
  "Lufthansa",
  "Qatar Airways",
  "Swiss",
  "Turkish Airlines",
];

function obterOpcoesCiaAerea(valorAtual?: string): string[] {
  if (!valorAtual || ciasAereasPadrao.includes(valorAtual)) return ciasAereasPadrao;
  return [...ciasAereasPadrao, valorAtual];
}

const aeroportosPadrao = [
  { value: "São Paulo (GRU)", label: "GRU — São Paulo / Guarulhos" },
  { value: "São Paulo (CGH)", label: "CGH — São Paulo / Congonhas" },
  { value: "Campinas (VCP)", label: "VCP — Campinas / Viracopos" },
  { value: "Rio de Janeiro (GIG)", label: "GIG — Rio de Janeiro / Galeão" },
  { value: "Rio de Janeiro (SDU)", label: "SDU — Rio de Janeiro / Santos Dumont" },
  { value: "Brasília (BSB)", label: "BSB — Brasília" },
  { value: "Belo Horizonte (CNF)", label: "CNF — Belo Horizonte / Confins" },
  { value: "Salvador (SSA)", label: "SSA — Salvador" },
  { value: "Recife (REC)", label: "REC — Recife" },
  { value: "Fortaleza (FOR)", label: "FOR — Fortaleza" },
  { value: "Porto Alegre (POA)", label: "POA — Porto Alegre" },
  { value: "Curitiba (CWB)", label: "CWB — Curitiba" },
  { value: "Florianópolis (FLN)", label: "FLN — Florianópolis" },
  { value: "Manaus (MAO)", label: "MAO — Manaus" },
  { value: "Belém (BEL)", label: "BEL — Belém" },
  { value: "Natal (NAT)", label: "NAT — Natal" },
  { value: "Maceió (MCZ)", label: "MCZ — Maceió" },
  { value: "Aracaju (AJU)", label: "AJU — Aracaju" },
  { value: "Vitória (VIX)", label: "VIX — Vitória" },
  { value: "Goiânia (GYN)", label: "GYN — Goiânia" },
  { value: "Cuiabá (CGB)", label: "CGB — Cuiabá" },
  { value: "Foz do Iguaçu (IGU)", label: "IGU — Foz do Iguaçu" },
  { value: "João Pessoa (JPA)", label: "JPA — João Pessoa" },
  { value: "São Luís (SLZ)", label: "SLZ — São Luís" },
  { value: "Teresina (THE)", label: "THE — Teresina" },
  { value: "Miami (MIA)", label: "MIA — Miami" },
  { value: "Orlando (MCO)", label: "MCO — Orlando" },
  { value: "Nova York (JFK)", label: "JFK — Nova York / John F. Kennedy" },
  { value: "Nova York (EWR)", label: "EWR — Nova York / Newark" },
  { value: "Los Angeles (LAX)", label: "LAX — Los Angeles" },
  { value: "Lisboa (LIS)", label: "LIS — Lisboa" },
  { value: "Porto (OPO)", label: "OPO — Porto" },
  { value: "Madri (MAD)", label: "MAD — Madri" },
  { value: "Barcelona (BCN)", label: "BCN — Barcelona" },
  { value: "Paris (CDG)", label: "CDG — Paris / Charles de Gaulle" },
  { value: "Paris (ORY)", label: "ORY — Paris / Orly" },
  { value: "Londres (LHR)", label: "LHR — Londres / Heathrow" },
  { value: "Roma (FCO)", label: "FCO — Roma / Fiumicino" },
  { value: "Amsterdã (AMS)", label: "AMS — Amsterdã" },
  { value: "Frankfurt (FRA)", label: "FRA — Frankfurt" },
  { value: "Zurique (ZRH)", label: "ZRH — Zurique" },
  { value: "Dubai (DXB)", label: "DXB — Dubai" },
  { value: "Doha (DOH)", label: "DOH — Doha" },
  { value: "Buenos Aires (EZE)", label: "EZE — Buenos Aires / Ezeiza" },
  { value: "Santiago (SCL)", label: "SCL — Santiago" },
];

function obterOpcoesAeroporto(valorAtual?: string): { value: string; label: string }[] {
  if (!valorAtual || aeroportosPadrao.some(({ value }) => value === valorAtual)) return aeroportosPadrao;
  return [...aeroportosPadrao, { value: valorAtual, label: valorAtual }];
}

const pacoteVazio: Omit<Pacote, "id"> = {
  operador: "",
  ciaAerea: "",
  ciaAereaVolta: "",
  origem: "",
  destino: "",
  reserva: "",
  reservaVolta: "",
  link: "",
  linkVolta: "",
  urlOperador: [],

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
  horaSaidaIda: "",
  horaChegadaIda: "",
  horaSaidaVolta: "",
  horaChegadaVolta: "",
  numeroVooIda: "",
  numeroVooVolta: "",
  bagagemIda: "",
  bagagemVolta: "",
  politicaAlteracoesCancelamentos: "",
  hospedagemNome: "",
  hospedagemEndereco: "",
  hospedagemTelefone: "",
  hospedagemEmail: "",
  hospedagemCheckin: "",
  hospedagemCheckout: "",
  hospedagemHorarioCheckin: "",
  hospedagemHorarioCheckout: "",
  hospedagemTipoQuarto: "",
  hospedagemRegime: "",
  hospedagemComodidades: "",
  hospedagemPoliticasCondicoesInformacoesEspeciais: "",
  hospedagemNoites: "",
  hospedagemValor: 0,
  hospedagemLink: "",
  hospedagemLinks: [],
  hospedagemFoto: null,
  hospedagemFotos: [],
  trasladoTipo: "",
  trasladoData: "",
  trasladoHorario: "",
  trasladoLocalPartida: "",
  trasladoLocalChegada: "",
  trasladoVeiculoEmpresa: "",
  trasladoObservacoes: "",
  seguroAssistencia: "",
  seguroSeguradora: "",
  seguroPlano: "",
  seguroNumeroReserva: "",
  seguroNumeroConfirmacao: "",
  seguroApoliceCertificado: "",
  seguroSegurados: "",
  seguroDestino: "",
  seguroAmbitoCobertura: "",
  seguroVigenciaInicio: "",
  seguroVigenciaFim: "",
  seguroCoberturas: "",
  seguroValor: 0,
  seguroObservacoes: "",
  ingressoNomeAtracao: "",
  ingressoData: "",
  ingressoHorario: "",
  ingressoQuantidade: "",
  ingressoObservacoes: "",
  ingressos: [],
  dadosCliente: "",
  informacoesAdicionais: "",
  conteudoCompleto: "",
  descricao: "",
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

function formatarDataIsoBr(dataIso?: string): string {
  if (!dataIso) return "";
  const partes = dataIso.split("-");
  if (partes.length !== 3) return dataIso;
  const [ano, mes, dia] = partes;
  if (!ano || !mes || !dia) return dataIso;
  return `${dia}/${mes}/${ano}`;
}

// Monta um resumo curto da viagem com base nos Detalhes do Voo, Hospedagem,
// Seguro, Traslado e Ingresso já preenchidos no pacote. É esse texto que aparece
// como descrição do pacote na tela pública do Roteiro.
export function gerarResumoPacote(dados: Omit<Pacote, "id" | "documentos">): string {
  const partes: string[] = [];

  const origemIda = dados.origemIda?.trim() || dados.origem?.trim();
  const destinoIda = dados.destinoIda?.trim() || dados.destino?.trim();

  if (origemIda || destinoIda || dados.dataIda || dados.ciaAerea) {
    let trecho = "Voo";
    if (dados.ciaAerea?.trim()) trecho += ` pela ${dados.ciaAerea.trim()}`;
    if (origemIda || destinoIda) trecho += ` de ${origemIda || "?"} para ${destinoIda || "?"}`;
    if (dados.dataIda) trecho += ` em ${formatarDataIsoBr(dados.dataIda)}`;
    partes.push(`${trecho}.`);
  }

  if (dados.dataVolta || dados.origemVolta?.trim() || dados.destinoVolta?.trim() || dados.ciaAereaVolta?.trim()) {
    let volta = "Volta";
    const ciaVolta = dados.ciaAereaVolta?.trim() || dados.ciaAerea?.trim();
    if (ciaVolta) volta += ` pela ${ciaVolta}`;
    if (dados.origemVolta?.trim() || dados.destinoVolta?.trim()) {
      volta += ` de ${dados.origemVolta?.trim() || "?"} para ${dados.destinoVolta?.trim() || "?"}`;
    }
    if (dados.dataVolta) volta += ` em ${formatarDataIsoBr(dados.dataVolta)}`;
    partes.push(`${volta}.`);
  }

  if (dados.hospedagemNome?.trim()) {
    let hospedagem = `Hospedagem no ${dados.hospedagemNome.trim()}`;
    if (dados.hospedagemCheckin && dados.hospedagemCheckout) {
      hospedagem += `, de ${formatarDataIsoBr(dados.hospedagemCheckin)} a ${formatarDataIsoBr(dados.hospedagemCheckout)}`;
    }
    if (dados.hospedagemNoites?.trim()) hospedagem += ` (${dados.hospedagemNoites.trim()} noites)`;
    partes.push(`${hospedagem}.`);
  }

  if (dados.seguroPlano?.trim() || dados.seguroAssistencia?.trim() || dados.seguroSeguradora?.trim()) {
    let seguro = `Seguro ${dados.seguroPlano?.trim() || "viagem"}`;
    const fornecedor = dados.seguroAssistencia?.trim() || dados.seguroSeguradora?.trim();
    if (fornecedor) seguro += ` pela ${fornecedor}`;
    if (dados.seguroVigenciaInicio && dados.seguroVigenciaFim) {
      seguro += `, de ${formatarDataIsoBr(dados.seguroVigenciaInicio)} a ${formatarDataIsoBr(dados.seguroVigenciaFim)}`;
    }
    partes.push(`${seguro}.`);
  }

  if (dados.trasladoTipo?.trim() || dados.trasladoLocalPartida?.trim() || dados.trasladoLocalChegada?.trim()) {
    let traslado = "Traslado";
    if (dados.trasladoTipo?.trim()) traslado += ` ${dados.trasladoTipo.trim()}`;
    if (dados.trasladoLocalPartida?.trim() && dados.trasladoLocalChegada?.trim()) {
      traslado += ` de ${dados.trasladoLocalPartida.trim()} até ${dados.trasladoLocalChegada.trim()}`;
    }
    partes.push(`${traslado}.`);
  }

  // Todos os ingressos (array novo ou campo legado)
  const todosIngressos: IngressoItem[] = dados.ingressos && dados.ingressos.length > 0
    ? dados.ingressos
    : dados.ingressoNomeAtracao?.trim()
      ? [{ nomeAtracao: dados.ingressoNomeAtracao, data: dados.ingressoData || "", horario: dados.ingressoHorario || "", quantidade: dados.ingressoQuantidade || "", observacoes: dados.ingressoObservacoes || "" }]
      : [];

  for (const ing of todosIngressos) {
    if (ing.nomeAtracao?.trim()) {
      let ingresso = `Ingresso para ${ing.nomeAtracao.trim()}`;
      if (ing.quantidade?.trim()) ingresso += ` (${ing.quantidade.trim()})`;
      partes.push(`${ingresso}.`);
    }
  }

  return partes.join(" ");
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

function dataUrlBase64ParaUint8Array(dataUrl: string): Uint8Array {
  const separador = dataUrl.indexOf(",");
  if (separador < 0) {
    throw new Error("Arquivo em Data URL inválido.");
  }

  const binario = atob(dataUrl.slice(separador + 1));
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
}

async function renderizarPaginaPdfComoImagem(
    page: pdfjsLib.PDFPageProxy,
    scale = 1.5,
): Promise<string> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) return "";

  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.9);
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
    const totalPixels = obj.width * obj.height;
    if (obj.data.length === totalPixels * 4) {
      imageData.data.set(obj.data);
    } else if (obj.data.length === totalPixels * 3) {
      for (let origem = 0, destino = 0; origem < obj.data.length; origem += 3, destino += 4) {
        imageData.data[destino] = obj.data[origem];
        imageData.data[destino + 1] = obj.data[origem + 1];
        imageData.data[destino + 2] = obj.data[origem + 2];
        imageData.data[destino + 3] = 255;
      }
    } else if (obj.data.length === totalPixels) {
      for (let origem = 0, destino = 0; origem < obj.data.length; origem += 1, destino += 4) {
        imageData.data[destino] = obj.data[origem];
        imageData.data[destino + 1] = obj.data[origem];
        imageData.data[destino + 2] = obj.data[origem];
        imageData.data[destino + 3] = 255;
      }
    } else {
      return "";
    }
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

async function extrairMaioresImagensEmbutidasDoPdf(
    pdf: pdfjsLib.PDFDocumentProxy,
    limite = 3,
): Promise<string[]> {
  const imagens: { dataUrl: string; area: number }[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const ops = await page.getOperatorList();

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      if (fn !== pdfjsLib.OPS.paintImageXObject && fn !== pdfjsLib.OPS.paintInlineImageXObject) continue;

      const imgName = ops.argsArray[i][0];
      if (typeof imgName !== "string") continue;

      try {
        let img: unknown;
        try {
          img = await resolvePdfObject(page.objs, imgName);
        } catch {
          img = await resolvePdfObject(pdf.commonObjs, imgName);
        }

        const dimensoes = img && typeof img === "object"
          ? img as { width?: number; height?: number }
          : {};
        const area = (dimensoes.width || 0) * (dimensoes.height || 0);
        const dataUrl = imagemPdfParaDataUrl(img);
        if (dataUrl && area > 0) imagens.push({ dataUrl, area });
      } catch {
        // tenta a próxima imagem
      }
    }
  }

  return imagens
      .sort((a, b) => b.area - a.area)
      .slice(0, limite)
      .map(({ dataUrl }) => dataUrl);
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

function detectarCiaAereaNoTexto(texto: string): string {
  if (!texto.trim()) return "";

  const textoNormalizado = texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase();
  const contextoDeVoo = /\b(voo|flight|embarque|aeroporto|saida|chegada|sai|chega)\b/.test(textoNormalizado);
  if (!contextoDeVoo) return "";

  const companhias: { nome: string; aliases: RegExp; codigoVoo: RegExp }[] = [
    { nome: "Azul", aliases: /\bazul(?: linhas aereas| brazilian airlines)?\b/i, codigoVoo: /\bAD\s?\d{3,4}\b/i },
    { nome: "LATAM", aliases: /\blatam(?: airlines)?\b/i, codigoVoo: /\b(?:LA|JJ)\s?\d{3,4}\b/i },
    { nome: "GOL", aliases: /\bgol(?: linhas aereas)?\b/i, codigoVoo: /\bG3\s?\d{3,4}\b/i },
    { nome: "Avianca", aliases: /\bavianca\b/i, codigoVoo: /\bAV\s?\d{3,4}\b/i },
    { nome: "TAP Air Portugal", aliases: /\btap(?: air portugal)?\b/i, codigoVoo: /\bTP\s?\d{3,4}\b/i },
    { nome: "Copa Airlines", aliases: /\bcopa airlines\b/i, codigoVoo: /\bCM\s?\d{3,4}\b/i },
    { nome: "American Airlines", aliases: /\bamerican airlines\b/i, codigoVoo: /\bAA\s?\d{3,4}\b/i },
    { nome: "Delta Air Lines", aliases: /\bdelta air lines\b|\bdelta airlines\b/i, codigoVoo: /\bDL\s?\d{3,4}\b/i },
    { nome: "United Airlines", aliases: /\bunited airlines\b/i, codigoVoo: /\bUA\s?\d{3,4}\b/i },
    { nome: "Air France", aliases: /\bair france\b/i, codigoVoo: /\bAF\s?\d{3,4}\b/i },
    { nome: "KLM", aliases: /\bklm\b/i, codigoVoo: /\bKL\s?\d{3,4}\b/i },
    { nome: "Iberia", aliases: /\biberia\b/i, codigoVoo: /\bIB\s?\d{3,4}\b/i },
    { nome: "Lufthansa", aliases: /\blufthansa\b/i, codigoVoo: /\bLH\s?\d{3,4}\b/i },
    { nome: "Turkish Airlines", aliases: /\bturkish airlines\b/i, codigoVoo: /\bTK\s?\d{3,4}\b/i },
    { nome: "Emirates", aliases: /\bemirates\b/i, codigoVoo: /\bEK\s?\d{3,4}\b/i },
    { nome: "Qatar Airways", aliases: /\bqatar airways\b/i, codigoVoo: /\bQR\s?\d{3,4}\b/i },
    { nome: "British Airways", aliases: /\bbritish airways\b/i, codigoVoo: /\bBA\s?\d{3,4}\b/i },
    { nome: "Air Europa", aliases: /\bair europa\b/i, codigoVoo: /\bUX\s?\d{3,4}\b/i },
  ];

  const porCodigo = companhias.find(({ codigoVoo }) => codigoVoo.test(texto));
  if (porCodigo) return porCodigo.nome;

  const porNome = companhias.find(({ aliases }) => aliases.test(textoNormalizado));
  return porNome?.nome || "";
}

function nomeArquivoIndicaVolta(nome: string): boolean {
  const normalizado = normalizarChave(nome);
  return normalizado.includes("volta") || normalizado.includes("return") || normalizado.includes("inbound");
}

function aplicarCiaAereaDetectada(
    dados: DadosIAExtraidos,
    nomeArquivo: string,
    ciaAereaDetectada: string,
): { dados: DadosIAExtraidos; trechoAplicado: "Ida" | "Volta" | null } {
  if (!ciaAereaDetectada) return { dados, trechoAplicado: null };

  if (nomeArquivoIndicaVolta(nomeArquivo)) {
    if (dados.ciaAereaVolta) return { dados, trechoAplicado: null };
    return {
      dados: { ...dados, ciaAereaVolta: ciaAereaDetectada },
      trechoAplicado: "Volta",
    };
  }

  if (dados.ciaAerea) return { dados, trechoAplicado: null };
  return {
    dados: { ...dados, ciaAerea: ciaAereaDetectada },
    trechoAplicado: "Ida",
  };
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
    const text = await extrairTextoPorOcr(imageUrl, worker);
    return detectarOperadorNoTexto(text);
  } catch {
    return "";
  }
}

async function extrairTextoPorOcr(imageUrl: string, worker: Worker): Promise<string> {
  if (!imageUrl) return "";
  const imagemPreparada = await prepararImagemParaOcr(imageUrl);
  const { data: { text } } = await worker.recognize(imagemPreparada);
  return text.trim();
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

function extrairPoliticasHospedagem(texto: string): string {
  if (!texto?.trim()) return "";

  const inicio = texto.search(
      /\b(?:pol[ií]ticas?\s+e\s+condi[cç][oõ]es|condi[cç][oõ]es\s+de\s+reserva|regras\s+da\s+hospedagem|informa[cç][oõ]es\s+(?:importantes|especiais))\b/i,
  );
  if (inicio < 0) return "";

  const secao = texto.slice(inicio);
  const fim = secao.search(
      /\n---\s*(?:p[aá]gina|imagem)|\n(?:dados\s+do\s+cliente|traslado|seguro\s+viagem|detalhes\s+do\s+voo)\b/i,
  );
  const conteudo = (fim > 0 ? secao.slice(0, fim) : secao)
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  return conteudo.length > 30 ? conteudo : "";
}

function textoMaisCompleto(...valores: (string | null | undefined)[]): string {
  return valores
      .map((valor) => valor?.trim() || "")
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)[0] || "";
}

function extrairDadosIADeAnalise(analise: string): DadosIAExtraidos {
  // Captura sempre o último grupo da regex (o valor real), ignorando grupos opcionais anteriores
  const extrair = (regex: RegExp) => {
    const match = analise.match(regex);
    if (!match) return "";
    // Pega o último grupo capturado não-undefined
    const valor = [...match].slice(1).filter(v => v !== undefined).pop();
    return normalizarValorIA(valor);
  };

  const dataIdaBr = extrair(/\*\*Data (?:de )?Ida:\*\*\s*(.+)/);
  const dataVoltaBr = extrair(/\*\*Data (?:de )?Volta:\*\*\s*(.+)/);
  const checkinBr = extrair(/\*\*Check-in:\*\*\s*(.+)/i);
  const checkoutBr = extrair(/\*\*Check-out:\*\*\s*(.+)/i);

  return {
    operador: padronizarOperador(extrair(/\*\*Operador:\*\*\s*(.+)/)),
    ciaAerea: extrair(/\*\*CIA A[eé]rea(?: \(Ida\))?:\*\*\s*(.+)/i),
    ciaAereaVolta: extrair(/\*\*CIA A[eé]rea \(Volta\):\*\*\s*(.+)/i),
    numeroVooIda: extrair(/\*\*N[º°]? do Voo \(Ida\):\*\*\s*(.+)/i),
    numeroVooVolta: extrair(/\*\*N[º°]? do Voo \(Volta\):\*\*\s*(.+)/i),
    bagagemIda: extrair(/\*\*Bagagem \(Ida\):\*\*\s*(.+)/i),
    bagagemVolta: extrair(/\*\*Bagagem \(Volta\):\*\*\s*(.+)/i),
    reserva: extrair(/\*\*Nº de Reserva\/Localizador(?: \(Ida\))?:\*\*\s*(.+)/i),
    reservaVolta: extrair(/\*\*Nº de Reserva\/Localizador \(Volta\):\*\*\s*(.+)/i),
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
    horaSaidaIda: extrair(/\*\*Horário (?:de )?Saída (?:\(Ida\))?:\*\*\s*(.+)/i),
    horaChegadaIda: extrair(/\*\*Horário (?:de )?Chegada (?:\(Ida\))?:\*\*\s*(.+)/i),
    horaSaidaVolta: extrair(/\*\*Horário (?:de )?Saída (?:\(Volta\))?:\*\*\s*(.+)/i),
    horaChegadaVolta: extrair(/\*\*Horário (?:de )?Chegada (?:\(Volta\))?:\*\*\s*(.+)/i),
    link: extrair(/\*\*Link(?: \(Ida\))?:\*\*\s*(.+)/i),
    linkVolta: extrair(/\*\*Link \(Volta\):\*\*\s*(.+)/i),
    valor: extrair(/\*\*Valor:\*\*\s*(.+)/i),
    foto: extrair(/\*\*Foto:\*\*\s*(.+)/i),
    nomeHotel: extrair(/\*\*Nome (?:do )?Hotel:\*\*\s*(.+)/i),
    enderecoHotel: extrair(/\*\*Endereço (?:do )?Hotel:\*\*\s*(.+)/i),
    telefoneHotel: extrair(/\*\*Telefone (?:do )?Hotel:\*\*\s*(.+)/i),
    emailHotel: extrair(/\*\*E-mail (?:do )?Hotel:\*\*\s*(.+)/i),
    quarto: extrair(/\*\*Tipo (?:de )?Quarto:\*\*\s*(.+)/i),
    regimeHotel: extrair(/\*\*Regime \/ Pensão:\*\*\s*(.+)/i),
    comodidades: extrair(/\*\*Comodidades (?:do )?Estabelecimento:\*\*\s*(.+)/i),
    checkinHotel: checkinBr ? dataBrParaIso(checkinBr) : "",
    checkoutHotel: checkoutBr ? dataBrParaIso(checkoutBr) : "",
    horarioCheckinHotel: extrair(/\*\*Horário de Check-in:\*\*\s*(.+)/i),
    horarioCheckoutHotel: extrair(/\*\*Horário de Check-out:\*\*\s*(.+)/i),
    noitesHotel: extrair(/\*\*Noites:\*\*\s*(.+)/i),
    linkHotel: extrair(/\*\*Link (?:do )?Hotel:\*\*\s*(.+)/i),
    fotoHotel: extrair(/\*\*Foto (?:da )?Hospedagem:\*\*\s*(.+)/i),
    politicasCondicoesInformacoesEspeciais: (() => {
      const match = analise.match(/\*\*Políticas, Condições e Informações Especiais:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i);
      const valor = match?.[1]?.trim();
      return valor && valor.toLowerCase() !== "não informado" ? valor : "";
    })(),
    politicaAlteracoesCancelamentos: (() => {
      const match = analise.match(/\*\*Políticas? (?:de )?Alterações? (?:e )?Cancelamentos?:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i);
      const valor = match?.[1]?.trim();
      return valor && valor.toLowerCase() !== "não informado" ? valor : "";
    })(),
    seguroAssistencia: extrair(/\*\*Assistência do Seguro:\*\*\s*(.+)/i),
    seguroSeguradora: extrair(/\*\*Seguradora:\*\*\s*(.+)/i),
    seguroPlano: extrair(/\*\*Plano\/Produto do Seguro:\*\*\s*(.+)/i),
    seguroNumeroReserva: extrair(/\*\*Nº de Reserva do Seguro:\*\*\s*(.+)/i),
    seguroNumeroConfirmacao: extrair(/\*\*Nº de Confirmação do Seguro:\*\*\s*(.+)/i),
    seguroApoliceCertificado: extrair(/\*\*Apólice\/Certificado:\*\*\s*(.+)/i),
    seguroSegurados: extrair(/\*\*Segurados:\*\*\s*(.+)/i),
    seguroDestino: extrair(/\*\*Destino do Seguro:\*\*\s*(.+)/i),
    seguroAmbitoCobertura: extrair(/\*\*Âmbito de Cobertura:\*\*\s*(.+)/i),
    seguroVigenciaInicio: (() => {
      const dataBr = extrair(/\*\*Início da Vigência:\*\*\s*(.+)/i);
      return dataBr ? dataBrParaIso(dataBr) : "";
    })(),
    seguroVigenciaFim: (() => {
      const dataBr = extrair(/\*\*Fim da Vigência:\*\*\s*(.+)/i);
      return dataBr ? dataBrParaIso(dataBr) : "";
    })(),
    seguroCoberturas: (() => {
      const match = analise.match(/\*\*Coberturas do Seguro:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i);
      const valor = match?.[1]?.trim();
      return valor && valor.toLowerCase() !== "não informado" ? valor : "";
    })(),
    seguroValor: extrair(/\*\*Valor do Seguro:\*\*\s*(.+)/i),
    seguroObservacoes: (() => {
      const match = analise.match(/\*\*Observações do Seguro:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i);
      const valor = match?.[1]?.trim();
      return valor && valor.toLowerCase() !== "não informado" ? valor : "";
    })(),
    trasladoTipo: extrair(/\*\*Tipo de Traslado:\*\*\s*(.+)/i),
    trasladoData: (() => {
      const dataBr = extrair(/\*\*Data (?:do )?Traslado:\*\*\s*(.+)/i);
      return dataBr ? dataBrParaIso(dataBr) : "";
    })(),
    trasladoHorario: extrair(/\*\*Horário (?:do )?Traslado:\*\*\s*(.+)/i),
    trasladoLocalPartida: extrair(/\*\*Local (?:de )?Partida(?:\s*\(Traslado\))?:\*\*\s*(.+)/i),
    trasladoLocalChegada: extrair(/\*\*Local (?:de )?Chegada(?:\s*\(Traslado\))?:\*\*\s*(.+)/i),
    trasladoVeiculoEmpresa: extrair(/\*\*Veículo\/Empresa( \(Traslado\))?:\*\*\s*(.+)/i),
    trasladoObservacoes: (() => {
      const match = analise.match(/\*\*Observações( do)? Traslado:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i);
      const valor = match?.[2]?.trim();
      return valor && valor.toLowerCase() !== "não informado" ? valor : "";
    })(),
    ingressoNomeAtracao: extrair(/\*\*Nome (da )?Atração\/Ingresso:\*\*\s*(.+)/i),
    ingressoData: (() => {
      const dataBr = extrair(/\*\*Data (do )?Ingresso:\*\*\s*(.+)/i);
      return dataBr ? dataBrParaIso(dataBr) : "";
    })(),
    ingressoHorario: extrair(/\*\*Horário (do )?Ingresso:\*\*\s*(.+)/i),
    ingressoQuantidade: extrair(/\*\*Quantidade (de )?Ingressos:\*\*\s*(.+)/i),
    ingressoObservacoes: (() => {
      const match = analise.match(/\*\*Observações( do)? Ingresso:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i);
      const valor = match?.[2]?.trim();
      return valor && valor.toLowerCase() !== "não informado" ? valor : "";
    })(),
    // Extrai TODAS as atrações/ingressos do relatório (blocos numerados ou não)
    ingressos: (() => {
      const itens: IngressoItem[] = [];

      // Divide o relatório em blocos de ingresso.
      // Novo formato: "**Atração 1 — Nome da Atração/Ingresso:**" ou "**Nome da Atração/Ingresso (1):**"
      // Formato legado: um único "**Nome da Atração/Ingresso:**"
      // Estratégia: percorre todas as ocorrências de "Nome da Atração/Ingresso" e extrai
      // os campos que vêm logo depois (Data, Horário, Quantidade, Observações).
      const reNome = /\*\*(?:Atra[cç][aã]o\s+\d+\s*[—-]\s*)?Nome (da )?Atra[cç][aã]o\/Ingresso(?:\s*\(\d+\))?:\*\*\s*(.+)/gi;
      let matchNome: RegExpExecArray | null;

      while ((matchNome = reNome.exec(analise)) !== null) {
        const nomeAtracao = normalizarValorIA(matchNome[2]);
        if (!nomeAtracao) continue;

        // Pega o trecho do relatório a partir desta linha até a próxima ocorrência de "Nome da Atração" ou fim
        const inicio = matchNome.index + matchNome[0].length;
        const proximoNome = reNome.lastIndex > 0
          ? analise.indexOf("**", reNome.lastIndex) // início do próximo campo **
          : analise.length;
        // Avança até o próximo bloco "Nome da Atração" ou usa um trecho fixo de ~500 chars
        const bloco = analise.slice(inicio, inicio + 600);

        const extrairDoBloco = (re: RegExp): string => {
          const m = bloco.match(re);
          if (!m) return "";
          const val = [...m].slice(1).filter((v) => v !== undefined).pop();
          return normalizarValorIA(val);
        };

        const dataBr = extrairDoBloco(/\*\*Data (do )?Ingresso:\*\*\s*(.+)/i);
        const data = dataBr ? dataBrParaIso(dataBr) : "";
        const horario = extrairDoBloco(/\*\*Horário (do )?Ingresso:\*\*\s*(.+)/i);
        const quantidade = extrairDoBloco(/\*\*Quantidade (de )?Ingressos:\*\*\s*(.+)/i);

        const obsMatch = bloco.match(/\*\*Observações( do)? Ingresso:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i);
        const obsValor = obsMatch?.[2]?.trim();
        const observacoes = obsValor && obsValor.toLowerCase() !== "não informado" ? obsValor : "";

        itens.push({ nomeAtracao, data, horario, quantidade, observacoes });
      }

      return itens;
    })(),
  };
}

function temDadosExtraidos(dados?: DadosIAExtraidos | null) {
  if (!dados) return false;
  if (dados.ingressos && dados.ingressos.length > 0) return true;
  return Object.entries(dados).some(([chave, valor]) => {
    if (chave === "ingressos") return false;
    return Boolean((valor as string | undefined)?.trim());
  });
}

function mesclarDadosIA(...fontes: (DadosIAExtraidos | null | undefined)[]): DadosIAExtraidos {
  const resultado: DadosIAExtraidos = {};
  for (const fonte of fontes) {
    if (!fonte) continue;
    for (const [chave, valor] of Object.entries(fonte) as [keyof DadosIAExtraidos, unknown][]) {
      if (chave === "ingressos") {
        // Mescla arrays de ingressos sem duplicar por nome de atração
        const arrayAtual: IngressoItem[] = (resultado.ingressos as IngressoItem[] | undefined) || [];
        const arrayNovo: IngressoItem[] = Array.isArray(valor) ? (valor as IngressoItem[]) : [];
        const nomesAtuais = new Set(arrayAtual.map((i) => i.nomeAtracao.trim().toLowerCase()).filter(Boolean));
        const novosUnicos = arrayNovo.filter((i) => !nomesAtuais.has(i.nomeAtracao.trim().toLowerCase()));
        if (novosUnicos.length > 0) {
          resultado.ingressos = [...arrayAtual, ...novosUnicos];
        }
      } else {
        const valorStr = valor as string | undefined;
        if (valorStr?.trim() && !(resultado[chave] as string | undefined)?.trim()) {
          (resultado as Record<string, unknown>)[chave] = valorStr.trim();
        }
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
    respostaJson: Record<string, unknown>,
    operadorDetectado: string,
    politicaExtraida: string,
): DadosIAExtraidos {
  const normalizar = (valor: unknown): string => {
    if (typeof valor === "string") return normalizarValorIA(valor);
    if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
    return "";
  };
  const campo = (...chaves: string[]): string => {
    for (const chave of chaves) {
      const valor = normalizar(respostaJson[chave]);
      if (valor) return valor;
    }
    return "";
  };

  const ciaAerea = campo("ciaAerea");
  const politicaFinal = normalizar(politicaExtraida) || campo("politicaAlteracoesCancelamentos");
  const ingressoLegado = {
    nomeAtracao: campo("ingressoNomeAtracao"),
    data: campo("ingressoData"),
    horario: campo("ingressoHorario"),
    quantidade: campo("ingressoQuantidade"),
    observacoes: campo("ingressoObservacoes"),
  };
  const ingressos = Array.isArray(respostaJson.ingressos)
    ? respostaJson.ingressos
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
        .map((item) => ({
          nomeAtracao: normalizar(item.nomeAtracao) || normalizar(item.ingressoNomeAtracao),
          data: normalizar(item.data) || normalizar(item.ingressoData),
          horario: normalizar(item.horario) || normalizar(item.ingressoHorario),
          quantidade: normalizar(item.quantidade) || normalizar(item.ingressoQuantidade),
          observacoes: normalizar(item.observacoes) || normalizar(item.ingressoObservacoes),
        }))
        .filter((item) => item.nomeAtracao)
    : [];

  return {
    operador: padronizarOperador(normalizar(operadorDetectado) || campo("operador")),
    ciaAerea,
    ciaAereaVolta: campo("ciaAereaVolta"),
    numeroVooIda: campo("numeroVooIda"),
    numeroVooVolta: campo("numeroVooVolta"),
    bagagemIda: campo("bagagemIda"),
    bagagemVolta: campo("bagagemVolta"),
    reserva: campo("reserva"),
    reservaVolta: campo("reservaVolta"),
    destino: campo("destino", "destinoIda"),
    passageiros: campo("passageiros"),
    dataIda: campo("dataIda"),
    dataVolta: campo("dataVolta"),
    origemIda: campo("origemIda"),
    destinoIda: campo("destinoIda"),
    duracaoIda: campo("duracaoIda"),
    origemVolta: campo("origemVolta"),
    destinoVolta: campo("destinoVolta"),
    duracaoVolta: campo("duracaoVolta"),
    horaSaidaIda: campo("horaSaidaIda"),
    horaChegadaIda: campo("horaChegadaIda"),
    horaSaidaVolta: campo("horaSaidaVolta"),
    horaChegadaVolta: campo("horaChegadaVolta"),
    politicaAlteracoesCancelamentos: politicaFinal,
    link: campo("link"),
    linkVolta: campo("linkVolta"),
    valor: campo("valor"),
    foto: campo("foto"),
    nomeHotel: campo("nomeHotel"),
    enderecoHotel: campo("enderecoHotel"),
    telefoneHotel: campo("telefoneHotel"),
    emailHotel: campo("emailHotel"),
    quarto: campo("quarto"),
    regimeHotel: campo("regimeHotel"),
    comodidades: campo("comodidades"),
    checkinHotel: campo("checkinHotel"),
    checkoutHotel: campo("checkoutHotel"),
    horarioCheckinHotel: campo("horarioCheckinHotel"),
    horarioCheckoutHotel: campo("horarioCheckoutHotel"),
    noitesHotel: campo("noitesHotel"),
    valorHotel: campo("valorHotel"),
    linkHotel: campo("linkHotel"),
    fotoHotel: campo("fotoHotel"),
    politicasCondicoesInformacoesEspeciais: campo("politicasCondicoesInformacoesEspeciais"),
    trasladoTipo: campo("trasladoTipo"),
    trasladoData: campo("trasladoData"),
    trasladoHorario: campo("trasladoHorario"),
    trasladoLocalPartida: campo("trasladoLocalPartida"),
    trasladoLocalChegada: campo("trasladoLocalChegada"),
    trasladoVeiculoEmpresa: campo("trasladoVeiculoEmpresa"),
    trasladoObservacoes: campo("trasladoObservacoes"),
    seguroAssistencia: campo("seguroAssistencia"),
    seguroSeguradora: campo("seguroSeguradora"),
    seguroPlano: campo("seguroPlano"),
    seguroNumeroReserva: campo("seguroNumeroReserva"),
    seguroNumeroConfirmacao: campo("seguroNumeroConfirmacao"),
    seguroApoliceCertificado: campo("seguroApoliceCertificado"),
    seguroSegurados: campo("seguroSegurados"),
    seguroDestino: campo("seguroDestino"),
    seguroAmbitoCobertura: campo("seguroAmbitoCobertura"),
    seguroVigenciaInicio: campo("seguroVigenciaInicio"),
    seguroVigenciaFim: campo("seguroVigenciaFim"),
    seguroCoberturas: campo("seguroCoberturas"),
    seguroValor: campo("seguroValor"),
    seguroObservacoes: campo("seguroObservacoes"),
    ingressoNomeAtracao: ingressoLegado.nomeAtracao,
    ingressoData: ingressoLegado.data,
    ingressoHorario: ingressoLegado.horario,
    ingressoQuantidade: ingressoLegado.quantidade,
    ingressoObservacoes: ingressoLegado.observacoes,
    dadosCliente: campo("dadosCliente"),
    informacoesAdicionais: campo("informacoesAdicionais"),
    conteudoCompleto: campo("conteudoCompleto"),
    ingressos: ingressos.length > 0 ? ingressos : ingressoLegado.nomeAtracao ? [ingressoLegado] : [],
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
    `**CIA Aérea (Ida):** ${fmtCampo(dados.ciaAerea)}`,
    `**Nº do Voo (Ida):** ${fmtCampo(dados.numeroVooIda)}`,
    `**Nº de Reserva/Localizador (Ida):** ${fmtCampo(dados.reserva)}`,
    `**Bagagem (Ida):** ${fmtCampo(dados.bagagemIda)}`,
    `**CIA Aérea (Volta):** ${fmtCampo(dados.ciaAereaVolta)}`,
    `**Nº do Voo (Volta):** ${fmtCampo(dados.numeroVooVolta)}`,
    `**Nº de Reserva/Localizador (Volta):** ${fmtCampo(dados.reservaVolta)}`,
    `**Bagagem (Volta):** ${fmtCampo(dados.bagagemVolta)}`,
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
    `**Link (Ida):** ${fmtCampo(dados.link)}`,
    `**Link (Volta):** ${fmtCampo(dados.linkVolta)}`,
    `**Valor:** ${fmtCampo(dados.valor)}`,
    `**Foto:** ${fmtCampo(dados.foto)}`,
    "**Política de alterações e cancelamentos:**",
    dados.politicaAlteracoesCancelamentos || "Não informado",
    `**Nome do Hotel:** ${fmtCampo(dados.nomeHotel)}`,
    `**Endereço do Hotel:** ${fmtCampo(dados.enderecoHotel)}`,
    `**Telefone do Hotel:** ${fmtCampo(dados.telefoneHotel)}`,
    `**E-mail do Hotel:** ${fmtCampo(dados.emailHotel)}`,
    `**Check-in:** ${fmtData(dados.checkinHotel)}`,
    `**Horário de Check-in:** ${fmtCampo(dados.horarioCheckinHotel)}`,
    `**Check-out:** ${fmtData(dados.checkoutHotel)}`,
    `**Horário de Check-out:** ${fmtCampo(dados.horarioCheckoutHotel)}`,
    `**Tipo de Quarto:** ${fmtCampo(dados.quarto)}`,
    `**Regime / Pensão:** ${fmtCampo(dados.regimeHotel)}`,
    `**Comodidades do Estabelecimento:** ${fmtCampo(dados.comodidades)}`,
    `**Noites:** ${fmtCampo(dados.noitesHotel)}`,
    `**Valor da Hospedagem:** ${fmtCampo(dados.valorHotel)}`,
    `**Link do Hotel:** ${fmtCampo(dados.linkHotel)}`,
    `**Foto da Hospedagem:** ${fmtCampo(dados.fotoHotel)}`,
    "**Políticas, Condições e Informações Especiais:**",
    dados.politicasCondicoesInformacoesEspeciais || "Não informado",
    `**Assistência do Seguro:** ${fmtCampo(dados.seguroAssistencia)}`,
    `**Seguradora:** ${fmtCampo(dados.seguroSeguradora)}`,
    `**Plano/Produto do Seguro:** ${fmtCampo(dados.seguroPlano)}`,
    `**Nº de Reserva do Seguro:** ${fmtCampo(dados.seguroNumeroReserva)}`,
    `**Nº de Confirmação do Seguro:** ${fmtCampo(dados.seguroNumeroConfirmacao)}`,
    `**Apólice/Certificado:** ${fmtCampo(dados.seguroApoliceCertificado)}`,
    `**Segurados:** ${fmtCampo(dados.seguroSegurados)}`,
    `**Destino do Seguro:** ${fmtCampo(dados.seguroDestino)}`,
    `**Âmbito de Cobertura:** ${fmtCampo(dados.seguroAmbitoCobertura)}`,
    `**Início da Vigência:** ${fmtData(dados.seguroVigenciaInicio)}`,
    `**Fim da Vigência:** ${fmtData(dados.seguroVigenciaFim)}`,
    "**Coberturas do Seguro:**",
    dados.seguroCoberturas || "Não informado",
    `**Valor do Seguro:** ${fmtCampo(dados.seguroValor)}`,
    "**Observações do Seguro:**",
    dados.seguroObservacoes || "Não informado",
    `**Tipo de Traslado:** ${fmtCampo(dados.trasladoTipo)}`,
    `**Data do Traslado:** ${fmtData(dados.trasladoData)}`,
    `**Horário do Traslado:** ${fmtCampo(dados.trasladoHorario)}`,
    `**Local de Partida (Traslado):** ${fmtCampo(dados.trasladoLocalPartida)}`,
    `**Local de Chegada (Traslado):** ${fmtCampo(dados.trasladoLocalChegada)}`,
    `**Veículo/Empresa (Traslado):** ${fmtCampo(dados.trasladoVeiculoEmpresa)}`,
    "**Observações do Traslado:**",
    dados.trasladoObservacoes || "Não informado",
    // Emite um bloco numerado por atração/ingresso
    ...(() => {
      const lista: IngressoItem[] = dados.ingressos && dados.ingressos.length > 0
        ? dados.ingressos
        : dados.ingressoNomeAtracao?.trim()
          ? [{ nomeAtracao: dados.ingressoNomeAtracao, data: dados.ingressoData || "", horario: dados.ingressoHorario || "", quantidade: dados.ingressoQuantidade || "", observacoes: dados.ingressoObservacoes || "" }]
          : [];

      if (lista.length === 0) {
        return [
          `**Nome da Atração/Ingresso:** Não informado`,
          `**Data do Ingresso:** Não informado`,
          `**Horário do Ingresso:** Não informado`,
          `**Quantidade de Ingressos:** Não informado`,
          "**Observações do Ingresso:**",
          "Não informado",
        ];
      }

      return lista.flatMap((item, idx) => {
        const sufixo = lista.length > 1 ? ` (${idx + 1})` : "";
        return [
          `**Nome da Atração/Ingresso${sufixo}:** ${fmtCampo(item.nomeAtracao)}`,
          `**Data do Ingresso${sufixo}:** ${fmtData(item.data)}`,
          `**Horário do Ingresso${sufixo}:** ${fmtCampo(item.horario)}`,
          `**Quantidade de Ingressos${sufixo}:** ${fmtCampo(item.quantidade)}`,
          `**Observações do Ingresso${sufixo}:**`,
          item.observacoes || "Não informado",
        ];
      });
    })(),
  ].join("\n");
}

function criarPromptAnaliseUrl(conteudo: string) {
  return `Você é um assistente especialista em turismo. Analise o conteúdo fornecido de uma página de operador de turismo e extraia TODAS as informações disponíveis para o formato JSON.

Conteúdo da página:
${conteudo}

O conteúdo pode conter as seguintes seções:
- Dados do Cliente
- HotelDO (operador)
- Voo de Ida
- Voo de Volta
- Hospedagem
- Traslado
- Políticas de alteração e cancelamento
- Valor Total da Viagem
- Informações adicionais
- Outros dados relevantes

Instruções:
1. Analise o conteúdo fornecido cuidadosamente.
2. Extraia todas as informações disponíveis nas seções mencionadas acima.
3. Para o campo "operador", extraia o nome do operador (ex: HotelDO, Decolar, CVC). NÃO INVENTE ou HALLUCINE dados que não existem no conteúdo.
4. Para datas (dataIda, dataVolta, checkinHotel, checkoutHotel, seguroVigenciaInicio, seguroVigenciaFim), use o formato AAAA-MM-DD.
5. Os campos "ciaAerea", "reserva" e "link" representam o trecho de IDA. Os campos "ciaAereaVolta", "reservaVolta" e "linkVolta" representam o trecho de VOLTA. Diferencie companhia aérea, localizador e link/voucher por trecho; quando o documento apresentar apenas um valor comum aos dois trechos, preencha somente os campos de IDA para preservar a retrocompatibilidade.
6. Identifique companhia aérea, número do voo, bagagens incluídas, localizador, origem, destino e duração separadamente para o trecho de IDA e para o trecho de VOLTA.
7. A duração do voo deve estar no formato legível (ex: "2h 30min", "11h 45min", "1h 05min").
8. Horários devem estar no formato HH:MM (ex: "08:35", "23:10").
9. O campo "valor" deve conter o valor total da viagem como aparece na página (ex: "R$ 5.432,10").
10. Os campos "link", "linkVolta" e "foto" devem conter URLs completas quando existirem na página.
11. O campo "nomeHotel" deve conter o nome do estabelecimento de hospedagem.
12. O campo "regimeHotel" deve conter o regime de pensão (ex: "Café da manhã", "Meia pensão", "All inclusive").
13. O campo "noitesHotel" deve conter apenas o número de noites (ex: "7").
14. Localize a seção "Políticas de alteração e cancelamento" e copie todo o texto integralmente para "politicaAlteracoesCancelamentos", sem resumir.
15. Extraia informações sobre traslado (tipo, data, horário, locais, veículo/empresa, observações).
16. Extraia informações sobre ingressos (nome da atração, data, horário, quantidade, observações). Se houver MAIS DE UM ingresso/atração, preencha o array "ingressos" com um objeto por atração. Também preencha "ingressoNomeAtracao", "ingressoData", "ingressoHorario", "ingressoQuantidade" e "ingressoObservacoes" com os dados da primeira atração (retrocompatibilidade).
17. Se houver SEGURO VIAGEM, extraia separadamente: empresa de assistência, seguradora garantidora, plano/produto, números de reserva e confirmação, apólice/certificado, segurados, destino, âmbito territorial, início e fim da vigência, todas as coberturas com seus limites, valor e observações/condições relevantes.
18. Extraia TODOS os dados do cliente (nome, email, telefone, CPF, etc.) e coloque no campo "dadosCliente".
19. Extraia quaisquer informações adicionais ou observações gerais da página e coloque no campo "informacoesAdicionais".
20. Copie TODO o conteúdo da página para o campo "conteudoCompleto" para garantir que nenhum dado seja perdido.
21. CRÍTICO: Se uma informação não for encontrada no conteúdo, retorne uma string vazia "" para o campo correspondente. NUNCA INVENTE dados.
22. Retorne APENAS o JSON, sem formatação adicional, sem blocos de código markdown.

Retorne o JSON no seguinte formato:
{
  "operador": "",
  "ciaAerea": "",
  "ciaAereaVolta": "",
  "numeroVooIda": "",
  "numeroVooVolta": "",
  "bagagemIda": "",
  "bagagemVolta": "",
  "reserva": "",
  "reservaVolta": "",
  "destino": "",
  "passageiros": "",
  "dataIda": "",
  "dataVolta": "",
  "origemIda": "",
  "destinoIda": "",
  "duracaoIda": "",
  "origemVolta": "",
  "destinoVolta": "",
  "duracaoVolta": "",
  "horaSaidaIda": "",
  "horaChegadaIda": "",
  "horaSaidaVolta": "",
  "horaChegadaVolta": "",
  "politicaAlteracoesCancelamentos": "",
  "link": "",
  "linkVolta": "",
  "valor": "",
  "foto": "",
  "nomeHotel": "",
  "enderecoHotel": "",
  "telefoneHotel": "",
  "emailHotel": "",
  "quarto": "",
  "regimeHotel": "",
  "comodidades": "",
  "checkinHotel": "",
  "checkoutHotel": "",
  "horarioCheckinHotel": "",
  "horarioCheckoutHotel": "",
  "noitesHotel": "",
  "linkHotel": "",
  "fotoHotel": "",
  "politicasCondicoesInformacoesEspeciais": "",
  "seguroAssistencia": "",
  "seguroSeguradora": "",
  "seguroPlano": "",
  "seguroNumeroReserva": "",
  "seguroNumeroConfirmacao": "",
  "seguroApoliceCertificado": "",
  "seguroSegurados": "",
  "seguroDestino": "",
  "seguroAmbitoCobertura": "",
  "seguroVigenciaInicio": "",
  "seguroVigenciaFim": "",
  "seguroCoberturas": "",
  "seguroValor": "",
  "seguroObservacoes": "",
  "trasladoTipo": "",
  "trasladoData": "",
  "trasladoHorario": "",
  "trasladoLocalPartida": "",
  "trasladoLocalChegada": "",
  "trasladoVeiculoEmpresa": "",
  "trasladoObservacoes": "",
  "ingressoNomeAtracao": "",
  "ingressoData": "",
  "ingressoHorario": "",
  "ingressoQuantidade": "",
  "ingressoObservacoes": "",
  "ingressos": [
    {
      "nomeAtracao": "",
      "data": "",
      "horario": "",
      "quantidade": "",
      "observacoes": ""
    }
  ],
  "dadosCliente": "",
  "informacoesAdicionais": "",
  "conteudoCompleto": ""
}`;
}

function montarRelatorioUrl(provedor: string, dados: DadosIAExtraidos): string {
  const campos: [string, string | undefined][] = [
    ["Operador", dados.operador],
    ["CIA Aérea (Ida)", dados.ciaAerea],
    ["Nº de Reserva/Localizador (Ida)", dados.reserva],
    ["CIA Aérea (Volta)", dados.ciaAereaVolta],
    ["Nº de Reserva/Localizador (Volta)", dados.reservaVolta],
    ["Destino Principal", dados.destino],
    ["Passageiros", dados.passageiros],
    ["Data de Ida", dados.dataIda],
    ["Data de Volta", dados.dataVolta],
    ["Origem (Ida)", dados.origemIda],
    ["Destino (Ida)", dados.destinoIda],
    ["Duração (Ida)", dados.duracaoIda],
    ["Origem (Volta)", dados.origemVolta],
    ["Destino (Volta)", dados.destinoVolta],
    ["Duração (Volta)", dados.duracaoVolta],
    ["Horário de Saída (Ida)", dados.horaSaidaIda],
    ["Horário de Chegada (Ida)", dados.horaChegadaIda],
    ["Horário de Saída (Volta)", dados.horaSaidaVolta],
    ["Horário de Chegada (Volta)", dados.horaChegadaVolta],
    ["Valor", dados.valor],
    ["Link (Ida)", dados.link],
    ["Link (Volta)", dados.linkVolta],
    ["Nome do Hotel", dados.nomeHotel],
    ["Endereço do Hotel", dados.enderecoHotel],
    ["Telefone do Hotel", dados.telefoneHotel],
    ["E-mail do Hotel", dados.emailHotel],
    ["Tipo de Quarto", dados.quarto],
    ["Regime / Pensão", dados.regimeHotel],
    ["Comodidades do Estabelecimento", dados.comodidades],
    ["Check-in", dados.checkinHotel],
    ["Check-out", dados.checkoutHotel],
    ["Noites", dados.noitesHotel],
    ["Link do Hotel", dados.linkHotel],
    ["Assistência do Seguro", dados.seguroAssistencia],
    ["Seguradora", dados.seguroSeguradora],
    ["Plano/Produto do Seguro", dados.seguroPlano],
    ["Nº de Reserva do Seguro", dados.seguroNumeroReserva],
    ["Nº de Confirmação do Seguro", dados.seguroNumeroConfirmacao],
    ["Apólice/Certificado", dados.seguroApoliceCertificado],
    ["Segurados", dados.seguroSegurados],
    ["Destino do Seguro", dados.seguroDestino],
    ["Âmbito de Cobertura", dados.seguroAmbitoCobertura],
    ["Início da Vigência", dados.seguroVigenciaInicio],
    ["Fim da Vigência", dados.seguroVigenciaFim],
    ["Coberturas do Seguro", dados.seguroCoberturas],
    ["Valor do Seguro", dados.seguroValor],
    ["Observações do Seguro", dados.seguroObservacoes],
    ["Tipo de Traslado", dados.trasladoTipo],
    ["Data Traslado", dados.trasladoData],
    ["Horário Traslado", dados.trasladoHorario],
    ["Local Partida Traslado", dados.trasladoLocalPartida],
    ["Local Chegada Traslado", dados.trasladoLocalChegada],
    ["Veículo/Empresa Traslado", dados.trasladoVeiculoEmpresa],
    ["Observações Traslado", dados.trasladoObservacoes],
    ["Nome Atração/Ingresso", dados.ingressoNomeAtracao],
    ["Data Ingresso", dados.ingressoData],
    ["Horário Ingresso", dados.ingressoHorario],
    ["Quantidade Ingressos", dados.ingressoQuantidade],
    ["Observações Ingresso", dados.ingressoObservacoes],
    ["Dados do Cliente", dados.dadosCliente],
    ["Informações Adicionais", dados.informacoesAdicionais],
  ];

  // Filtrar apenas campos populados
  const camposPopulados = campos.filter(([_, valor]) => valor && valor.trim() !== "" && valor !== "Não informado");

  if (camposPopulados.length === 0) {
    return `**Relatório da Análise da URL**\n\nProvedor: ${provedor}\n\nNenhuma informação foi extraída do conteúdo da página.`;
  }

  const linhas = camposPopulados.map(([label, valor]) => `**${label}:** ${valor}`);

  let relatorio = `**Relatório da Análise da URL**\n\nProvedor: ${provedor}\n\n`;
  relatorio += linhas.join("\n");

  if (dados.politicaAlteracoesCancelamentos) {
    relatorio += "\n\n**Políticas de Alteração e Cancelamento:**\n";
    relatorio += dados.politicaAlteracoesCancelamentos;
  }

  if (dados.conteudoCompleto) {
    relatorio += "\n\n**Conteúdo Completo da Página:**\n";
    relatorio += dados.conteudoCompleto;
  }

  return relatorio;
}

function criarPromptAnaliseCompleta(contextoArquivo: string, temConteudoArquivo: boolean) {
  return `Você é um assistente especialista em turismo. Analise o contexto de um arquivo de um pacote de viagem e extraia TODAS as informações disponíveis no documento para o formato JSON.

Contexto do arquivo para análise:
${contextoArquivo}

Instruções:
1. Extraia todas as informações do conteúdo do arquivo (PDF, OCR ou imagem). Seja exaustivo e procure em todas as seções do documento.
2. Se uma informação não for encontrada, retorne uma string vazia "" para o campo correspondente.
3. Para datas (dataIda, dataVolta, checkinHotel, checkoutHotel, trasladoData, ingressoData, seguroVigenciaInicio, seguroVigenciaFim), use o formato AAAA-MM-DD.
4. O campo "operador" deve conter o nome da operadora de turismo (ex: HotelDO, Decolar, CVC, Flytour, Orinter, Abreu, Visual Turismo, Diversa Turismo). Procure pelo nome no cabeçalho, rodapé ou logotipo do documento.
5. Os campos "ciaAerea", "reserva" e "link" representam o trecho de IDA. Os campos "ciaAereaVolta", "reservaVolta" e "linkVolta" representam o trecho de VOLTA. Diferencie companhia aérea, localizador e link/voucher por trecho; quando o documento apresentar apenas um valor comum aos dois trechos, preencha somente os campos de IDA para preservar a retrocompatibilidade. Não confunda companhia aérea com operadora de turismo.
6. Identifique a companhia pelo nome escrito, logotipo, código IATA/ICAO ou prefixo do número do voo (por exemplo AD/Azul, G3/GOL, LA/LATAM, AV/Avianca, TP/TAP). Examine especialmente a linha ou tabela próxima de "Voo", "Flight", "SAI" e "CHEGA", mesmo quando o nome estiver pequeno ou estilizado no logotipo. Identifique também número do voo, bagagens incluídas, localizador, origem, destino e duração separadamente para o trecho de IDA e para o trecho de VOLTA.
7. A duração do voo deve estar no formato legível (ex: "2h 30min", "11h 45min", "1h 05min").
8. Horários devem estar no formato HH:MM (ex: "08:35", "23:10").
9. O campo "valor" deve conter o valor total do pacote/reserva como aparece no documento (ex: "R$ 5.432,10").
10. O campo "valorHotel" deve conter o valor específico da hospedagem quando disponível (ex: "R$ 1.200,00").
11. Os campos "link", "linkVolta" e "foto" devem conter URLs completas quando existirem no documento.
12. O campo "nomeHotel" deve conter o nome do estabelecimento de hospedagem.
13. O campo "regimeHotel" deve conter o regime de pensão (ex: "Café da manhã", "Meia pensão", "All inclusive").
14. O campo "noitesHotel" deve conter apenas o número de noites (ex: "7").
15. Localize a seção "Política de alterações e cancelamentos" e copie todo o texto integralmente para "politicaAlteracoesCancelamentos", sem resumir.
16. Localize seções de "Políticas", "Condições", "Regras", "Cancelamento", "Informações Importantes/Especiais", observações, taxas, no-show e instruções de check-in/check-out da hospedagem. Copie integralmente todo o conteúdo, sem resumir nem retornar apenas o título, para "politicasCondicoesInformacoesEspeciais". Extraia também os horários de check-in e check-out em HH:MM.
17. Identifique informações de TRASLADO (transfer), quando houver: tipo (ex: "Aeroporto-Hotel", "Hotel-Aeroporto", "Hotel-Passeio"), data, horário, local de partida, local de chegada, veículo/empresa responsável e observações relevantes (ex: regular, privativo, ponto de encontro).
18. Identifique informações de INGRESSO (tickets/atrações), quando houver: nome da atração/local, data, horário, quantidade de ingressos e observações relevantes (ex: categoria do ingresso, se inclui guia). Se houver MAIS DE UMA atração/ingresso, preencha o array "ingressos" com um objeto por atração. Também preencha os campos "ingressoNomeAtracao", "ingressoData", "ingressoHorario", "ingressoQuantidade" e "ingressoObservacoes" com os dados da primeira atração (retrocompatibilidade).
19. Identifique informações de SEGURO VIAGEM. Diferencie a empresa de assistência da seguradora garantidora e extraia: plano/produto, números de reserva e confirmação, apólice/certificado, segurados, destino, âmbito territorial, início e fim da vigência, todas as coberturas com seus respectivos limites, valor e observações/condições relevantes.
20. Retorne APENAS o objeto JSON, sem nenhum texto ou formatação adicional.
${!temConteudoArquivo ? "\n21. Como o conteúdo do arquivo não pôde ser lido, baseie sua análise no nome do arquivo e na imagem anexada (se houver)." : ""}
Formato JSON esperado:
{
  "operador": "string",
  "ciaAerea": "string",
  "ciaAereaVolta": "string",
  "numeroVooIda": "string",
  "numeroVooVolta": "string",
  "bagagemIda": "string",
  "bagagemVolta": "string",
  "reserva": "string",
  "reservaVolta": "string",
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
  "linkVolta": "string",
  "valor": "string",
  "foto": "string",
  "nomeHotel": "string",
  "enderecoHotel": "string",
  "telefoneHotel": "string",
  "emailHotel": "string",
  "checkinHotel": "string",
  "checkoutHotel": "string",
  "horarioCheckinHotel": "string",
  "horarioCheckoutHotel": "string",
  "quarto": "string",
  "regimeHotel": "string",
  "comodidades": "string",
  "noitesHotel": "string",
  "valorHotel": "string",
  "linkHotel": "string",
  "fotoHotel": "string",
  "politicasCondicoesInformacoesEspeciais": "string",
  "politicaAlteracoesCancelamentos": "string",
  "seguroAssistencia": "string",
  "seguroSeguradora": "string",
  "seguroPlano": "string",
  "seguroNumeroReserva": "string",
  "seguroNumeroConfirmacao": "string",
  "seguroApoliceCertificado": "string",
  "seguroSegurados": "string",
  "seguroDestino": "string",
  "seguroAmbitoCobertura": "string",
  "seguroVigenciaInicio": "string",
  "seguroVigenciaFim": "string",
  "seguroCoberturas": "string",
  "seguroValor": "string",
  "seguroObservacoes": "string",
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
  "ingressoObservacoes": "string",
  "ingressos": [
    {
      "nomeAtracao": "string",
      "data": "string",
      "horario": "string",
      "quantidade": "string",
      "observacoes": "string"
    }
  ]
}`;
}

function obterDadosIADocumento(doc: Documento) {
  if (!doc.dadosIA && !doc.analise) return null;
  if (doc.dadosIA && doc.analise) {
    const dadosAnalise = extrairDadosIADeAnalise(doc.analise);
    return mesclarDadosIA(doc.dadosIA, dadosAnalise);
  }
  if (doc.analise) {
    return extrairDadosIADeAnalise(doc.analise);
  }
  return doc.dadosIA!;
}

// Mescla dados de TODOS os documentos (incluindo URL), sem depender do nome do arquivo.
// Garante que campos preenchidos em qualquer documento sejam aproveitados.
function obterDadosMescladosDeTodos(documentos: Documento[]): DadosIAExtraidos {
  const fontes = documentos
    .filter((doc) => doc.dadosIA || doc.analise)
    .map((doc) => obterDadosIADocumento(doc))
    .filter((d): d is DadosIAExtraidos => d !== null);
  return mesclarDadosIA(...fontes);
}

// Funções auxiliares para identificar tipo de documento pelo nome
function ehDocumentoVoo(nome: string): boolean {
  const normalizado = nome.toLowerCase();
  return normalizado.includes("voo") || normalizado.includes("flight") || normalizado.includes("passagem") || normalizado.includes("bilhete");
}

function ehDocumentoHotel(nome: string): boolean {
  const normalizado = nome.toLowerCase();
  return normalizado.includes("hotel") || normalizado.includes("hospedagem") || normalizado.includes("voucher") || normalizado.includes("reserva");
}

// Retorna o primeiro documento de voo que possui resultado de IA.
function encontrarDocumentoVoo(documentos: Documento[]) {
  return documentos.find((doc) => ehDocumentoVoo(doc.nome) && (doc.dadosIA || doc.analise));
}

// Retorna o primeiro documento de hotel/hospedagem que possui resultado de IA.
function encontrarDocumentoHotel(documentos: Documento[]) {
  return documentos.find((doc) => ehDocumentoHotel(doc.nome) && (doc.dadosIA || doc.analise));
}

function mapearDetalhesVoo<T extends Pick<
    Pacote,
    | "operador"
    | "ciaAerea"
    | "ciaAereaVolta"
    | "numeroVooIda"
    | "numeroVooVolta"
    | "bagagemIda"
    | "bagagemVolta"
    | "reserva"
    | "reservaVolta"
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
    | "horaSaidaIda"
    | "horaChegadaIda"
    | "horaSaidaVolta"
    | "horaChegadaVolta"
    | "politicaAlteracoesCancelamentos"
    | "link"
    | "linkVolta"
    | "foto"
    | "valor"
>>(formAtual: T, dadosIAVoo: NonNullable<Documento["dadosIA"]>): T {
  const origemIda = formAtual.origemIda || formAtual.origem || dadosIAVoo.origemIda || "";
  const destinoIda = formAtual.destinoIda || formAtual.destino || dadosIAVoo.destinoIda || dadosIAVoo.destino || "";

  return {
    ...formAtual,
    operador: formAtual.operador || dadosIAVoo.operador || "",
    ciaAerea: formAtual.ciaAerea || dadosIAVoo.ciaAerea || "",
    ciaAereaVolta: formAtual.ciaAereaVolta || dadosIAVoo.ciaAereaVolta || "",
    numeroVooIda: formAtual.numeroVooIda || dadosIAVoo.numeroVooIda || "",
    numeroVooVolta: formAtual.numeroVooVolta || dadosIAVoo.numeroVooVolta || "",
    bagagemIda: formAtual.bagagemIda || dadosIAVoo.bagagemIda || "",
    bagagemVolta: formAtual.bagagemVolta || dadosIAVoo.bagagemVolta || "",
    reserva: formAtual.reserva || dadosIAVoo.reserva || "",
    reservaVolta: formAtual.reservaVolta || dadosIAVoo.reservaVolta || "",
    destino: destinoIda,
    origem: origemIda,
    dataIda: formAtual.dataIda || dadosIAVoo.dataIda || "",
    dataVolta: formAtual.dataVolta || dadosIAVoo.dataVolta || "",
    passageiros: formAtual.passageiros || dadosIAVoo.passageiros || "",
    origemIda,
    destinoIda,
    duracaoIda: formAtual.duracaoIda || dadosIAVoo.duracaoIda || "",
    origemVolta: formAtual.origemVolta || dadosIAVoo.origemVolta || "",
    destinoVolta: formAtual.destinoVolta || dadosIAVoo.destinoVolta || "",
    duracaoVolta: formAtual.duracaoVolta || dadosIAVoo.duracaoVolta || "",
    horaSaidaIda: formAtual.horaSaidaIda || dadosIAVoo.horaSaidaIda || "",
    horaChegadaIda: formAtual.horaChegadaIda || dadosIAVoo.horaChegadaIda || "",
    horaSaidaVolta: formAtual.horaSaidaVolta || dadosIAVoo.horaSaidaVolta || "",
    horaChegadaVolta: formAtual.horaChegadaVolta || dadosIAVoo.horaChegadaVolta || "",
    politicaAlteracoesCancelamentos: textoMaisCompleto(formAtual.politicaAlteracoesCancelamentos, dadosIAVoo.politicaAlteracoesCancelamentos),
    link: formAtual.link || dadosIAVoo.link || "",
    linkVolta: formAtual.linkVolta || dadosIAVoo.linkVolta || "",
    foto: formAtual.foto || dadosIAVoo.foto || null,
    valor: formAtual.valor || (dadosIAVoo.valor ? parseMoeda(dadosIAVoo.valor) : 0),
  };
}

function mapearDetalhesHospedagem<T extends Pick<
    Pacote,
    | "hospedagemNome"
    | "hospedagemEndereco"
    | "hospedagemTelefone"
    | "hospedagemEmail"
    | "hospedagemTipoQuarto"
    | "hospedagemRegime"
    | "hospedagemComodidades"
    | "hospedagemPoliticasCondicoesInformacoesEspeciais"
    | "hospedagemCheckin"
    | "hospedagemCheckout"
    | "hospedagemHorarioCheckin"
    | "hospedagemHorarioCheckout"
    | "hospedagemNoites"
    | "hospedagemValor"
    | "hospedagemLink"
    | "hospedagemFoto"
>>(formAtual: T, dadosIAHospedagem: NonNullable<Documento["dadosIA"]>): T {
  return {
    ...formAtual,
    hospedagemNome: formAtual.hospedagemNome || dadosIAHospedagem.nomeHotel || "",
    hospedagemEndereco: formAtual.hospedagemEndereco || dadosIAHospedagem.enderecoHotel || "",
    hospedagemTelefone: formAtual.hospedagemTelefone || dadosIAHospedagem.telefoneHotel || "",
    hospedagemEmail: formAtual.hospedagemEmail || dadosIAHospedagem.emailHotel || "",
    hospedagemTipoQuarto: formAtual.hospedagemTipoQuarto || dadosIAHospedagem.quarto || "",
    hospedagemRegime: formAtual.hospedagemRegime || dadosIAHospedagem.regimeHotel || "",
    hospedagemComodidades: textoMaisCompleto(formAtual.hospedagemComodidades, dadosIAHospedagem.comodidades),
    hospedagemPoliticasCondicoesInformacoesEspeciais: textoMaisCompleto(formAtual.hospedagemPoliticasCondicoesInformacoesEspeciais, dadosIAHospedagem.politicasCondicoesInformacoesEspeciais),
    hospedagemCheckin: formAtual.hospedagemCheckin || dadosIAHospedagem.checkinHotel || "",
    hospedagemCheckout: formAtual.hospedagemCheckout || dadosIAHospedagem.checkoutHotel || "",
    hospedagemHorarioCheckin: formAtual.hospedagemHorarioCheckin || dadosIAHospedagem.horarioCheckinHotel || "",
    hospedagemHorarioCheckout: formAtual.hospedagemHorarioCheckout || dadosIAHospedagem.horarioCheckoutHotel || "",
    hospedagemNoites: formAtual.hospedagemNoites || dadosIAHospedagem.noitesHotel || "",
    hospedagemValor: formAtual.hospedagemValor || dadosIAHospedagem.valorHotel || "",
    hospedagemLink: formAtual.hospedagemLink || dadosIAHospedagem.linkHotel || "",
    hospedagemFoto: formAtual.hospedagemFoto || dadosIAHospedagem.fotoHotel || null,
  };
}

function mapearDetalhesSeguro<T extends Pick<
    Pacote,
    | "seguroAssistencia"
    | "seguroSeguradora"
    | "seguroPlano"
    | "seguroNumeroReserva"
    | "seguroNumeroConfirmacao"
    | "seguroApoliceCertificado"
    | "seguroSegurados"
    | "seguroDestino"
    | "seguroAmbitoCobertura"
    | "seguroVigenciaInicio"
    | "seguroVigenciaFim"
    | "seguroCoberturas"
    | "seguroValor"
    | "seguroObservacoes"
>>(formAtual: T, dadosIA: NonNullable<Documento["dadosIA"]>): T {
  return {
    ...formAtual,
    seguroAssistencia: dadosIA.seguroAssistencia || formAtual.seguroAssistencia || "",
    seguroSeguradora: dadosIA.seguroSeguradora || formAtual.seguroSeguradora || "",
    seguroPlano: dadosIA.seguroPlano || formAtual.seguroPlano || "",
    seguroNumeroReserva: dadosIA.seguroNumeroReserva || formAtual.seguroNumeroReserva || "",
    seguroNumeroConfirmacao: dadosIA.seguroNumeroConfirmacao || formAtual.seguroNumeroConfirmacao || "",
    seguroApoliceCertificado: dadosIA.seguroApoliceCertificado || formAtual.seguroApoliceCertificado || "",
    seguroSegurados: dadosIA.seguroSegurados || formAtual.seguroSegurados || "",
    seguroDestino: dadosIA.seguroDestino || formAtual.seguroDestino || "",
    seguroAmbitoCobertura: dadosIA.seguroAmbitoCobertura || formAtual.seguroAmbitoCobertura || "",
    seguroVigenciaInicio: dadosIA.seguroVigenciaInicio || formAtual.seguroVigenciaInicio || "",
    seguroVigenciaFim: dadosIA.seguroVigenciaFim || formAtual.seguroVigenciaFim || "",
    seguroCoberturas: dadosIA.seguroCoberturas || formAtual.seguroCoberturas || "",
    seguroValor: dadosIA.seguroValor ? parseMoeda(dadosIA.seguroValor) : (formAtual.seguroValor || 0),
    seguroObservacoes: dadosIA.seguroObservacoes || formAtual.seguroObservacoes || "",
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
    | "ingressos"
>>(formAtual: T, dadosIA: NonNullable<Documento["dadosIA"]>): T {
  // Usa o array ingressos quando disponível; caso contrário, converte campos legados
  let ingressosNovos: IngressoItem[] = [];

  if (dadosIA.ingressos && dadosIA.ingressos.length > 0) {
    ingressosNovos = dadosIA.ingressos;
  } else if (dadosIA.ingressoNomeAtracao?.trim()) {
    ingressosNovos = [{
      nomeAtracao: dadosIA.ingressoNomeAtracao || "",
      data: dadosIA.ingressoData || "",
      horario: dadosIA.ingressoHorario || "",
      quantidade: dadosIA.ingressoQuantidade || "",
      observacoes: dadosIA.ingressoObservacoes || "",
    }];
  }

  // Mescla com os ingressos já existentes no form (sem duplicar pelo nome)
  const ingressosExistentes: IngressoItem[] = (formAtual.ingressos as IngressoItem[] | undefined) || [];
  const nomesNovos = new Set(ingressosNovos.map((i) => i.nomeAtracao.trim().toLowerCase()).filter(Boolean));
  const ingressosMesclados = [
    ...ingressosNovos,
    ...ingressosExistentes.filter((i) => !nomesNovos.has(i.nomeAtracao.trim().toLowerCase())),
  ];

  // Retrocompatibilidade: mantém os campos legados apontando para o primeiro ingresso
  const primeiro = ingressosMesclados[0];
  return {
    ...formAtual,
    ingressos: ingressosMesclados,
    ingressoNomeAtracao: primeiro?.nomeAtracao || formAtual.ingressoNomeAtracao || "",
    ingressoData: primeiro?.data || formAtual.ingressoData || "",
    ingressoHorario: primeiro?.horario || formAtual.ingressoHorario || "",
    ingressoQuantidade: primeiro?.quantidade || formAtual.ingressoQuantidade || "",
    ingressoObservacoes: primeiro?.observacoes || formAtual.ingressoObservacoes || "",
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

function possuiDadosSeguro(dados?: DadosIAExtraidos | null) {
  if (!dados) return false;
  return Boolean(
      dados.seguroAssistencia?.trim() ||
      dados.seguroSeguradora?.trim() ||
      dados.seguroPlano?.trim() ||
      dados.seguroNumeroReserva?.trim() ||
      dados.seguroNumeroConfirmacao?.trim() ||
      dados.seguroApoliceCertificado?.trim() ||
      dados.seguroSegurados?.trim() ||
      dados.seguroDestino?.trim() ||
      dados.seguroAmbitoCobertura?.trim() ||
      dados.seguroVigenciaInicio?.trim() ||
      dados.seguroVigenciaFim?.trim() ||
      dados.seguroCoberturas?.trim() ||
      dados.seguroValor?.trim() ||
      dados.seguroObservacoes?.trim()
  );
}

function possuiDadosIngresso(dados?: DadosIAExtraidos | null) {
  if (!dados) return false;
  if (dados.ingressos && dados.ingressos.length > 0) return true;
  return Boolean(
      dados.ingressoNomeAtracao?.trim() ||
      dados.ingressoData?.trim() ||
      dados.ingressoHorario?.trim() ||
      dados.ingressoQuantidade?.trim() ||
      dados.ingressoObservacoes?.trim()
  );
}

// Traslado e Ingresso podem estar descritos em qualquer documento do pacote,
// independente do nome do arquivo. A busca considera todos os anexos com resultado de IA.
function encontrarDocumentoTraslado(documentos: Documento[]) {
  return documentos.find((doc) => possuiDadosTraslado(obterDadosIADocumento(doc)));
}

function encontrarDocumentoIngresso(documentos: Documento[]) {
  return documentos.find((doc) => possuiDadosIngresso(obterDadosIADocumento(doc)));
}

export default function PacotesForm({ pacotes, onPacotesChange, hospedagens, onHospedagensChange }: PacotesFormProps) {
  const [form, setForm] = useState<Omit<Pacote, "id">>(pacoteVazio);
  const [valorInput, setValorInput] = useState("");
  const [hospedagemValorInput, setHospedagemValorInput] = useState("");
  const [seguroValorInput, setSeguroValorInput] = useState("");
  const [erro, setErro] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [voucherParaExcluir, setVoucherParaExcluir] = useState<number | null>(null);
  const [ingressoParaExcluir, setIngressoParaExcluir] = useState<number | null>(null);
  const [formMinimizado, setFormMinimizado] = useState(true);
  const [trechoIdaMinimizado, setTrechoIdaMinimizado] = useState(false);
  const [trechoVoltaMinimizado, setTrechoVoltaMinimizado] = useState(false);
  const [hospedagemMinimizado, setHospedagemMinimizado] = useState(true);
  const [seguroMinimizado, setSeguroMinimizado] = useState(true);
  const [trasladoMinimizado, setTrasladoMinimizado] = useState(true);
  const [ingressoMinimizado, setIngressoMinimizado] = useState(true);
  const [logAnaliseMinimizado, setLogAnaliseMinimizado] = useState(true);
  const [resumoMinimizado, setResumoMinimizado] = useState(true);
  const [vouchersMinimizado, setVouchersMinimizado] = useState(true);
  const [comodidadesMinimizado, setComodidadesMinimizado] = useState(true);
  const [politicaCancelamentoMinimizado, setPoliticaCancelamentoMinimizado] = useState(true);
  const [urlOperadorMinimizado, setUrlOperadorMinimizado] = useState(true);
  const [relatoriosExpandidos, setRelatoriosExpandidos] = useState<Set<number>>(new Set());
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [buscandoLinkHotelIA, setBuscandoLinkHotelIA] = useState(false);
  const [buscandoFotoHotelIA, setBuscandoFotoHotelIA] = useState(false);
  const [erroFotoHotelIA, setErroFotoHotelIA] = useState("");
  const [hospedagemFotoInput, setHospedagemFotoInput] = useState("");
  const [hospedagemLinkInput, setHospedagemLinkInput] = useState("");
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [logAnaliseIA, setLogAnaliseIA] = useState<string[]>([]);
  const [provedorIA, setProvedorIA] = useState<"automático" | "openai" | "groq" | "gemini" | "openrouter" | "cloudflare">("automático");
  const [novaUrlOperador, setNovaUrlOperador] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function buscarLinkHotelIA() {
    const nome = (form.hospedagemNome || "").trim();
    if (!nome) {
      setErro("Informe o Nome do Hotel antes de buscar o link.");
      return;
    }
    const endereco = (form.hospedagemEndereco || "").trim();
    setBuscandoLinkHotelIA(true);
    setErro("");

    const prompt = `Você é um assistente de viagens especializado. Preciso do site oficial (URL) do seguinte hotel:\n\nNome: ${nome}${endereco ? `\nEndereço: ${endereco}` : ""}\n\nResponda SOMENTE com a URL completa do site oficial do hotel (ex: https://www.nomehotel.com). Se não encontrar o site oficial, responda com a URL do Booking.com ou Google Maps para este hotel. Não adicione explicações, apenas a URL.`;

    const provedores: ("openai" | "groq" | "gemini" | "openrouter" | "cloudflare")[] = ["groq", "openai", "gemini", "openrouter", "cloudflare"];
    let urlEncontrada: string | null = null;
    const erros: string[] = [];

    for (const provedor of provedores) {
      try {
        const resposta = await enviarMensagemIA([{ role: "user", content: prompt }], provedor);
        const conteudo = resposta?.choices?.[0]?.message?.content?.trim() ?? "";
        // Aceita qualquer URL na resposta
        const urlMatch = conteudo.match(/https?:\/\/[^\s"'<>\]]+/);
        if (urlMatch) {
          urlEncontrada = urlMatch[0];
          break;
        }
        // A IA respondeu mas sem URL — tenta o próximo
        erros.push(`${provedor}: resposta sem URL ("${conteudo.slice(0, 60)}")`);
      } catch (err: any) {
        // 401/403 = chave inválida, continua para o próximo
        erros.push(`${provedor}: ${err?.message ?? String(err)}`);
      }
    }

    if (urlEncontrada) {
      setForm((prev) => ({ ...prev, hospedagemLink: urlEncontrada! }));
    } else {
      const msgErro = `Nenhum provedor encontrou o link. Detalhes: ${erros.join(" | ")}`;
      setForm((prev) => ({ ...prev, hospedagemLink: msgErro }));
    }

    setBuscandoLinkHotelIA(false);
  }

  async function buscarFotoHotelIA() {
    const nome = (form.hospedagemNome || "").trim();
    const link = (form.hospedagemLink || "").trim();

    if (!nome && !link) {
      setErroFotoHotelIA("Informe o Nome do Hotel ou o Link do Hotel antes de buscar a foto.");
      return;
    }

    setBuscandoFotoHotelIA(true);
    setErroFotoHotelIA("");

    try {
      let termoBusca = nome;

      // Se não tem nome, tenta extrair do link via IA
      if (!termoBusca && link) {
        const prompt = `Dado este link de hotel: ${link}\n\nResponda SOMENTE com o nome completo do hotel (ex: "Hotel Ibis Lisboa"). Sem explicações, apenas o nome.`;
        const provedores: ("openai" | "groq" | "gemini" | "openrouter" | "cloudflare")[] = ["groq", "openai", "gemini", "openrouter", "cloudflare"];
        for (const provedor of provedores) {
          try {
            const resposta = await enviarMensagemIA([{ role: "user", content: prompt }], provedor);
            const conteudo = resposta?.choices?.[0]?.message?.content?.trim() ?? "";
            if (conteudo) {
              termoBusca = conteudo.replace(/["*_]/g, "").trim();
              break;
            }
          } catch {
            // tenta próximo provedor
          }
        }

        // Fallback: extrai o domínio da URL como termo de busca
        if (!termoBusca) {
          try {
            const url = new URL(link);
            termoBusca = url.hostname.replace(/^www\./, "").split(".")[0];
          } catch {
            // URL inválida, ignora
          }
        }
      }

      if (!termoBusca) {
        setErroFotoHotelIA("Não foi possível identificar o hotel. Preencha o Nome do Hotel e tente novamente.");
        return;
      }

      // Inclui endereço no termo para aumentar precisão no Google Places
      const endereco = (form.hospedagemEndereco || "").trim();
      const termoBuscaCompleto = endereco ? `${termoBusca}, ${endereco}` : termoBusca;

      const fotoUrl = await buscarFotoDestino(termoBuscaCompleto);

      if (fotoUrl) {
        // Adiciona ao array e preenche o input para o usuário confirmar ou ajustar
        const fotosAtuais = form.hospedagemFotos || [];
        if (!fotosAtuais.includes(fotoUrl)) {
          setForm((prev) => ({
            ...prev,
            hospedagemFotos: [...(prev.hospedagemFotos || []), fotoUrl],
            hospedagemFoto: prev.hospedagemFoto || fotoUrl,
          }));
        }
        setHospedagemFotoInput("");
      } else {
        setErroFotoHotelIA("Nenhuma foto encontrada para este hotel. Tente preencher o Nome do Hotel e tente novamente, ou insira o link manualmente.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErroFotoHotelIA(`Erro ao buscar foto: ${msg}`);
    } finally {
      setBuscandoFotoHotelIA(false);
    }
  }

  function adicionarLinkHospedagem() {
    const url = hospedagemLinkInput.trim();
    if (!url) return;
    const linksAtuais = form.hospedagemLinks || [];
    if (linksAtuais.includes(url)) return;
    setForm((prev) => ({
      ...prev,
      hospedagemLinks: [...linksAtuais, url],
      hospedagemLink: prev.hospedagemLink || url,
    }));
    setHospedagemLinkInput("");
  }

  function removerLinkHospedagem(url: string) {
    const novaLista = (form.hospedagemLinks || []).filter((l) => l !== url);
    setForm((prev) => ({
      ...prev,
      hospedagemLinks: novaLista,
      hospedagemLink: prev.hospedagemLink === url ? (novaLista[0] ?? "") : prev.hospedagemLink,
    }));
  }

  function adicionarFotoHospedagem() {
    const url = hospedagemFotoInput.trim();
    if (!url) return;
    const fotosAtuais = form.hospedagemFotos || [];
    if (fotosAtuais.includes(url)) {
      setErroFotoHotelIA("Essa foto já foi adicionada.");
      return;
    }
    setForm((prev) => ({ ...prev, hospedagemFotos: [...fotosAtuais, url], hospedagemFoto: prev.hospedagemFoto || url }));
    setHospedagemFotoInput("");
    setErroFotoHotelIA("");
  }

  function removerFotoHospedagem(url: string) {
    const novaLista = (form.hospedagemFotos || []).filter((f) => f !== url);
    setForm((prev) => ({
      ...prev,
      hospedagemFotos: novaLista,
      // Se a foto principal removida for a que estava no campo legado, limpa
      hospedagemFoto: prev.hospedagemFoto === url ? (novaLista[0] ?? null) : prev.hospedagemFoto,
    }));
  }

  function removerUrlOperador(index: number) {
    const urlsAtuais = form.urlOperador || [];
    const novasUrls = urlsAtuais.filter((_, i) => i !== index);
    setForm({ ...form, urlOperador: novasUrls });
  }

  const operadores = useMemo(() => {
    // Operadores já salvos nos pacotes existentes
    const dosPacotes = pacotes.map((item) => item.operador.trim()).filter(Boolean);

    // Operadores extraídos dos documentos analisados no formulário atual (dadosIA ou analise)
    const dosDocumentos = (form.documentos || [])
      .flatMap((doc) => {
        const lista: string[] = [];
        // Via dadosIA (campo estruturado)
        if (doc.dadosIA?.operador?.trim()) lista.push(doc.dadosIA.operador.trim());
        // Via texto do relatório — regex alinhada com montarRelatorioCompleto
        if (doc.analise) {
          const match = doc.analise.match(/\*\*Operador:\*\*\s*(.+)/);
          const valor = match?.[1]?.trim();
          if (valor && valor.toLowerCase() !== "não informado") lista.push(valor);
        }
        return lista;
      })
      .map((op) => padronizarOperador(op))
      .filter(Boolean);

    return Array.from(new Set([...operadoresPadrao, ...dosPacotes, ...dosDocumentos]));
  }, [pacotes, form.documentos]);


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
                    ciaAereaVolta: form.ciaAereaVolta?.trim(),
                    numeroVooIda: form.numeroVooIda?.trim(),
                    numeroVooVolta: form.numeroVooVolta?.trim(),
                    bagagemIda: form.bagagemIda?.trim(),
                    bagagemVolta: form.bagagemVolta?.trim(),
                    origem: (form.origemIda || form.origem).trim(),
                    destino: (form.destinoIda || form.destino).trim(),
                    reserva: form.reserva?.trim(),
                    reservaVolta: form.reservaVolta?.trim(),
                    link: form.link.trim(),
                    linkVolta: form.linkVolta?.trim(),

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
                    horaSaidaIda: form.horaSaidaIda?.trim(),
                    horaChegadaIda: form.horaChegadaIda?.trim(),
                    horaSaidaVolta: form.horaSaidaVolta?.trim(),
                    horaChegadaVolta: form.horaChegadaVolta?.trim(),
                    politicaAlteracoesCancelamentos: form.politicaAlteracoesCancelamentos?.trim(),
                    hospedagemNome: form.hospedagemNome?.trim(),
                    hospedagemEndereco: form.hospedagemEndereco?.trim(),
                    hospedagemTelefone: form.hospedagemTelefone?.trim(),
                    hospedagemEmail: form.hospedagemEmail?.trim(),
                    hospedagemCheckin: form.hospedagemCheckin,
                    hospedagemCheckout: form.hospedagemCheckout,
                    hospedagemHorarioCheckin: form.hospedagemHorarioCheckin,
                    hospedagemHorarioCheckout: form.hospedagemHorarioCheckout,
                    hospedagemTipoQuarto: form.hospedagemTipoQuarto?.trim(),
                    hospedagemRegime: form.hospedagemRegime?.trim(),
                    hospedagemComodidades: form.hospedagemComodidades?.trim(),
                    hospedagemPoliticasCondicoesInformacoesEspeciais: form.hospedagemPoliticasCondicoesInformacoesEspeciais?.trim(),
                    hospedagemNoites: form.hospedagemNoites?.trim(),
                    hospedagemValor: form.hospedagemValor,
                    hospedagemLink: form.hospedagemLink?.trim(),
                    hospedagemLinks: form.hospedagemLinks || [],
                    hospedagemFoto: form.hospedagemFoto,
                    hospedagemFotos: form.hospedagemFotos || [],
                    seguroAssistencia: form.seguroAssistencia?.trim(),
                    seguroSeguradora: form.seguroSeguradora?.trim(),
                    seguroPlano: form.seguroPlano?.trim(),
                    seguroNumeroReserva: form.seguroNumeroReserva?.trim(),
                    seguroNumeroConfirmacao: form.seguroNumeroConfirmacao?.trim(),
                    seguroApoliceCertificado: form.seguroApoliceCertificado?.trim(),
                    seguroSegurados: form.seguroSegurados?.trim(),
                    seguroDestino: form.seguroDestino?.trim(),
                    seguroAmbitoCobertura: form.seguroAmbitoCobertura?.trim(),
                    seguroVigenciaInicio: form.seguroVigenciaInicio,
                    seguroVigenciaFim: form.seguroVigenciaFim,
                    seguroCoberturas: form.seguroCoberturas?.trim(),
                    seguroValor: form.seguroValor,
                    seguroObservacoes: form.seguroObservacoes?.trim(),
                    trasladoTipo: form.trasladoTipo?.trim(),
                    trasladoData: form.trasladoData,
                    trasladoHorario: form.trasladoHorario,
                    trasladoLocalPartida: form.trasladoLocalPartida?.trim(),
                    trasladoLocalChegada: form.trasladoLocalChegada?.trim(),
                    trasladoVeiculoEmpresa: form.trasladoVeiculoEmpresa?.trim(),
                    trasladoObservacoes: form.trasladoObservacoes?.trim(),
                    ingressoNomeAtracao: form.ingressoNomeAtracao?.trim(),
                    ingressoData: form.ingressoData,
                    ingressoHorario: form.ingressoHorario,
                    ingressoQuantidade: form.ingressoQuantidade?.trim(),
                    ingressoObservacoes: form.ingressoObservacoes?.trim(),
                    ingressos: form.ingressos || [],
                    descricao: (form.descricao?.trim() || gerarResumoPacote(form)),
                    documentos: form.documentos || [],
                    logAnalise: logAnaliseIA.join("\n"),
                  }
                  : item,
          ),
      );
      setForm(pacoteVazio);
      setValorInput("");
      setHospedagemValorInput("");
      setSeguroValorInput("");
      setEditandoId(null);
      setFormMinimizado(true);
      setTrechoIdaMinimizado(false);
      setTrechoVoltaMinimizado(false);
      setPoliticaCancelamentoMinimizado(true);
      setComodidadesMinimizado(true);
      setErro("");
      return;
    }

    onPacotesChange([
      ...pacotes,
      {
        id: Date.now(),
        operador: form.operador.trim(),
        ciaAerea: form.ciaAerea?.trim(),
        ciaAereaVolta: form.ciaAereaVolta?.trim(),
        numeroVooIda: form.numeroVooIda?.trim(),
        numeroVooVolta: form.numeroVooVolta?.trim(),
        bagagemIda: form.bagagemIda?.trim(),
        bagagemVolta: form.bagagemVolta?.trim(),
        origem: (form.origemIda || form.origem).trim(),
        destino: (form.destinoIda || form.destino).trim(),
        reserva: form.reserva?.trim(),
        reservaVolta: form.reservaVolta?.trim(),
        link: form.link.trim(),
        linkVolta: form.linkVolta?.trim(),

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
        horaSaidaIda: form.horaSaidaIda?.trim(),
        horaChegadaIda: form.horaChegadaIda?.trim(),
        horaSaidaVolta: form.horaSaidaVolta?.trim(),
        horaChegadaVolta: form.horaChegadaVolta?.trim(),
        politicaAlteracoesCancelamentos: form.politicaAlteracoesCancelamentos?.trim(),
        hospedagemNome: form.hospedagemNome?.trim(),
        hospedagemEndereco: form.hospedagemEndereco?.trim(),
        hospedagemTelefone: form.hospedagemTelefone?.trim(),
        hospedagemEmail: form.hospedagemEmail?.trim(),
        hospedagemCheckin: form.hospedagemCheckin,
        hospedagemCheckout: form.hospedagemCheckout,
        hospedagemHorarioCheckin: form.hospedagemHorarioCheckin,
        hospedagemHorarioCheckout: form.hospedagemHorarioCheckout,
        hospedagemTipoQuarto: form.hospedagemTipoQuarto?.trim(),
        hospedagemRegime: form.hospedagemRegime?.trim(),
        hospedagemComodidades: form.hospedagemComodidades?.trim(),
        hospedagemPoliticasCondicoesInformacoesEspeciais: form.hospedagemPoliticasCondicoesInformacoesEspeciais?.trim(),
        hospedagemNoites: form.hospedagemNoites?.trim(),
        hospedagemValor: form.hospedagemValor,
        hospedagemLink: form.hospedagemLink?.trim(),
        hospedagemLinks: form.hospedagemLinks || [],
        hospedagemFoto: form.hospedagemFoto,
        hospedagemFotos: form.hospedagemFotos || [],
        seguroAssistencia: form.seguroAssistencia?.trim(),
        seguroSeguradora: form.seguroSeguradora?.trim(),
        seguroPlano: form.seguroPlano?.trim(),
        seguroNumeroReserva: form.seguroNumeroReserva?.trim(),
        seguroNumeroConfirmacao: form.seguroNumeroConfirmacao?.trim(),
        seguroApoliceCertificado: form.seguroApoliceCertificado?.trim(),
        seguroSegurados: form.seguroSegurados?.trim(),
        seguroDestino: form.seguroDestino?.trim(),
        seguroAmbitoCobertura: form.seguroAmbitoCobertura?.trim(),
        seguroVigenciaInicio: form.seguroVigenciaInicio,
        seguroVigenciaFim: form.seguroVigenciaFim,
        seguroCoberturas: form.seguroCoberturas?.trim(),
        seguroValor: form.seguroValor,
        seguroObservacoes: form.seguroObservacoes?.trim(),
        trasladoTipo: form.trasladoTipo?.trim(),
        trasladoData: form.trasladoData,
        trasladoHorario: form.trasladoHorario,
        trasladoLocalPartida: form.trasladoLocalPartida?.trim(),
        trasladoLocalChegada: form.trasladoLocalChegada?.trim(),
        trasladoVeiculoEmpresa: form.trasladoVeiculoEmpresa?.trim(),
        trasladoObservacoes: form.trasladoObservacoes?.trim(),
        ingressoNomeAtracao: form.ingressoNomeAtracao?.trim(),
        ingressoData: form.ingressoData,
        ingressoHorario: form.ingressoHorario,
        ingressoQuantidade: form.ingressoQuantidade?.trim(),
        ingressoObservacoes: form.ingressoObservacoes?.trim(),
        ingressos: form.ingressos || [],
        descricao: (form.descricao?.trim() || gerarResumoPacote(form)),
        logAnalise: logAnaliseIA.join("\n"),
        documentos: form.documentos,
      },
    ]);
    setForm(pacoteVazio);
    setValorInput("");
    setHospedagemValorInput("");
    setSeguroValorInput("");
    setEditandoId(null);
    setFormMinimizado(true);
    setTrechoIdaMinimizado(false);
    setTrechoVoltaMinimizado(false);
    setPoliticaCancelamentoMinimizado(true);
    setComodidadesMinimizado(true);
    setErro("");
  }

  function editarPacote(pacote: Pacote) {
    setVouchersMinimizado(false);
    setFormMinimizado(true);
    setTrechoIdaMinimizado(false);
    setTrechoVoltaMinimizado(false);
    setHospedagemMinimizado(true);
    setSeguroMinimizado(true);
    setPoliticaCancelamentoMinimizado(true); // Manter minimizado ao abrir edição
    setComodidadesMinimizado(true); // Manter minimizado ao abrir edição
    setHospedagemLinkInput(""); // Limpar input de link ao abrir edição
    setEditandoId(pacote.id);
    const logPacote = (pacote.logAnalise || "")
        .split("\n")
        .map((linha) => linha.trim())
        .filter(Boolean);
    setLogAnaliseIA(logPacote);
    setForm({
      operador: pacote.operador || "",
      ciaAerea: pacote.ciaAerea || "",
      ciaAereaVolta: pacote.ciaAereaVolta || "",
      numeroVooIda: pacote.numeroVooIda || "",
      numeroVooVolta: pacote.numeroVooVolta || "",
      bagagemIda: pacote.bagagemIda || "",
      bagagemVolta: pacote.bagagemVolta || "",
      origem: pacote.origem || "",
      destino: pacote.destino || "",
      reserva: pacote.reserva || "",
      reservaVolta: pacote.reservaVolta || "",
      link: pacote.link || "",
      linkVolta: pacote.linkVolta || "",

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
      horaSaidaIda: pacote.horaSaidaIda || "",
      horaChegadaIda: pacote.horaChegadaIda || "",
      horaSaidaVolta: pacote.horaSaidaVolta || "",
      horaChegadaVolta: pacote.horaChegadaVolta || "",
      politicaAlteracoesCancelamentos: pacote.politicaAlteracoesCancelamentos || "",
      hospedagemNome: pacote.hospedagemNome || "",
      hospedagemEndereco: pacote.hospedagemEndereco || "",
      hospedagemTelefone: pacote.hospedagemTelefone || "",
      hospedagemEmail: pacote.hospedagemEmail || "",
      hospedagemCheckin: pacote.hospedagemCheckin || "",
      hospedagemCheckout: pacote.hospedagemCheckout || "",
      hospedagemHorarioCheckin: pacote.hospedagemHorarioCheckin || "",
      hospedagemHorarioCheckout: pacote.hospedagemHorarioCheckout || "",
      hospedagemTipoQuarto: pacote.hospedagemTipoQuarto || "",
      hospedagemRegime: pacote.hospedagemRegime || "",
      hospedagemComodidades: pacote.hospedagemComodidades || "",
      hospedagemPoliticasCondicoesInformacoesEspeciais: pacote.hospedagemPoliticasCondicoesInformacoesEspeciais || "",
      hospedagemNoites: pacote.hospedagemNoites || "",
      hospedagemValor: pacote.hospedagemValor || "",
      hospedagemLink: pacote.hospedagemLink || "",
      hospedagemLinks: Array.isArray(pacote.hospedagemLinks) ? pacote.hospedagemLinks : (pacote.hospedagemLink ? [pacote.hospedagemLink] : []),
      hospedagemFoto: pacote.hospedagemFoto || null,
      hospedagemFotos: Array.isArray(pacote.hospedagemFotos) ? pacote.hospedagemFotos : (pacote.hospedagemFoto ? [pacote.hospedagemFoto] : []),
      seguroAssistencia: pacote.seguroAssistencia || "",
      seguroSeguradora: pacote.seguroSeguradora || "",
      seguroPlano: pacote.seguroPlano || "",
      seguroNumeroReserva: pacote.seguroNumeroReserva || "",
      seguroNumeroConfirmacao: pacote.seguroNumeroConfirmacao || "",
      seguroApoliceCertificado: pacote.seguroApoliceCertificado || "",
      seguroSegurados: pacote.seguroSegurados || "",
      seguroDestino: pacote.seguroDestino || "",
      seguroAmbitoCobertura: pacote.seguroAmbitoCobertura || "",
      seguroVigenciaInicio: pacote.seguroVigenciaInicio || "",
      seguroVigenciaFim: pacote.seguroVigenciaFim || "",
      seguroCoberturas: pacote.seguroCoberturas || "",
      seguroValor: Number(pacote.seguroValor) || 0,
      seguroObservacoes: pacote.seguroObservacoes || "",
      trasladoTipo: pacote.trasladoTipo || "",
      trasladoData: pacote.trasladoData || "",
      trasladoHorario: pacote.trasladoHorario || "",
      trasladoLocalPartida: pacote.trasladoLocalPartida || "",
      trasladoLocalChegada: pacote.trasladoLocalChegada || "",
      trasladoVeiculoEmpresa: pacote.trasladoVeiculoEmpresa || "",
      trasladoObservacoes: pacote.trasladoObservacoes || "",
      ingressoNomeAtracao: pacote.ingressoNomeAtracao || "",
      ingressoData: pacote.ingressoData || "",
      ingressoHorario: pacote.ingressoHorario || "",
      ingressoQuantidade: pacote.ingressoQuantidade || "",
      ingressoObservacoes: pacote.ingressoObservacoes || "",
      ingressos: Array.isArray(pacote.ingressos) && pacote.ingressos.length > 0
        ? pacote.ingressos
        : pacote.ingressoNomeAtracao?.trim()
          ? [{ nomeAtracao: pacote.ingressoNomeAtracao, data: pacote.ingressoData || "", horario: pacote.ingressoHorario || "", quantidade: pacote.ingressoQuantidade || "", observacoes: pacote.ingressoObservacoes || "" }]
          : [],
      dadosCliente: pacote.dadosCliente || "",
      informacoesAdicionais: pacote.informacoesAdicionais || "",
      conteudoCompleto: pacote.conteudoCompleto || "",
      descricao: pacote.descricao || "",
      logAnalise: pacote.logAnalise || "",
    });
    setValorInput(pacote.valor ? formatarMoeda(Number(pacote.valor) || 0) : "");
    setHospedagemValorInput(pacote.hospedagemValor ? formatarMoeda(Number(pacote.hospedagemValor) || 0) : "");
    setSeguroValorInput(pacote.seguroValor ? formatarMoeda(Number(pacote.seguroValor) || 0) : "");
    setErro("");
  }

  function removerPacote(id: number) {
    onPacotesChange(pacotes.filter((item) => item.id !== id));
    if (editandoId === id) {
      setForm(pacoteVazio);
      setValorInput("");
      setHospedagemValorInput("");
      setSeguroValorInput("");
      setEditandoId(null);
      setFormMinimizado(true);
      setTrechoIdaMinimizado(false);
      setTrechoVoltaMinimizado(false);
      setPoliticaCancelamentoMinimizado(true);
      setComodidadesMinimizado(true);
    }
    setVoucherParaExcluir(null);
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
                      exibirNoRoteiro: true,
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

  function atualizarExibicaoDocumento(idDocumento: number, exibirNoRoteiro: boolean) {
    setForm((f) => ({
      ...f,
      documentos: (f.documentos || []).map((doc) =>
        doc.id === idDocumento ? { ...doc, exibirNoRoteiro } : doc
      ),
    }));

    if (editandoId !== null) {
      onPacotesChange(
        pacotes.map((item) =>
          item.id === editandoId
            ? {
                ...item,
                documentos: (item.documentos || []).map((doc) =>
                  doc.id === idDocumento ? { ...doc, exibirNoRoteiro } : doc
                ),
              }
            : item
        )
      );
    }
  }

  // Função auxiliar interna: mescla todos os documentos e retorna dados unificados
  function obterDadosUnificados(): DadosIAExtraidos | null {
    const documentos = form.documentos || [];
    if (documentos.length === 0) return null;
    const dados = obterDadosMescladosDeTodos(documentos);
    return temDadosExtraidos(dados) ? dados : null;
  }

  // Propaga o pacote editado ao estado pai para atualizar o Resumo em tempo real
  function propagarAoPai(novoForm: Omit<Pacote, "id">) {
    if (editandoId !== null) {
      onPacotesChange(
        pacotes.map((item) =>
          item.id === editandoId ? { ...item, ...novoForm } : item
        )
      );
    }
  }

  function atualizarCamposComResultadoIA() {
    const dados = obterDadosUnificados();
    if (!dados) {
      setErro("Nenhum documento com resultado de IA foi encontrado. Analise os documentos antes de atualizar.");
      return;
    }
    setErro("");
    setAtualizando("todos");
    let novoForm = { ...form };
    novoForm = mapearDetalhesVoo(novoForm, dados);
    novoForm = mapearDetalhesHospedagem(novoForm, dados);
    if (possuiDadosSeguro(dados)) novoForm = mapearDetalhesSeguro(novoForm, dados);
    if (possuiDadosTraslado(dados)) novoForm = mapearDetalhesTraslado(novoForm, dados);
    if (possuiDadosIngresso(dados)) novoForm = mapearDetalhesIngresso(novoForm, dados);
    if (novoForm.valor > 0) setValorInput(formatarMoeda(novoForm.valor));
    if (novoForm.hospedagemValor) setHospedagemValorInput(formatarMoeda(parseMoeda(novoForm.hospedagemValor)));
    if (novoForm.seguroValor) setSeguroValorInput(formatarMoeda(novoForm.seguroValor));
    setForm((f) => ({ ...novoForm, documentos: f.documentos }));
    propagarAoPai({ ...novoForm, documentos: form.documentos });
    setTimeout(() => setAtualizando(null), 800);
  }

  function atualizarDetalhesVoo() {
    const dados = obterDadosUnificados();
    if (!dados) {
      setErro("Nenhum dado de IA encontrado nos documentos. Analise os documentos antes de atualizar.");
      return;
    }
    setErro("");
    setAtualizando("voo");
    const novoForm = mapearDetalhesVoo(form, dados);
    if (novoForm.valor > 0) setValorInput(formatarMoeda(novoForm.valor));
    setForm((f) => ({ ...novoForm, documentos: f.documentos }));
    propagarAoPai({ ...novoForm, documentos: form.documentos });
    setFormMinimizado(false);
    setTimeout(() => setAtualizando(null), 800);
  }

  function atualizarDetalhesHospedagem() {
    const dados = obterDadosUnificados();
    if (!dados) {
      setErro("Nenhum dado de IA encontrado nos documentos. Analise os documentos antes de atualizar.");
      return;
    }
    setErro("");
    setAtualizando("hospedagem");
    let novoForm = mapearDetalhesVoo(form, dados);
    novoForm = mapearDetalhesHospedagem(novoForm, dados);
    if (novoForm.valor > 0) setValorInput(formatarMoeda(novoForm.valor));
    setForm((f) => ({ ...novoForm, documentos: f.documentos }));
    propagarAoPai({ ...novoForm, documentos: form.documentos });
    setHospedagemMinimizado(false);
    setTimeout(() => setAtualizando(null), 800);
  }

  function atualizarDetalhesTraslado() {
    const dados = obterDadosUnificados();
    if (!dados || !possuiDadosTraslado(dados)) {
      setErro("Nenhum dado de Traslado encontrado nos documentos.");
      return;
    }
    setErro("");
    setAtualizando("traslado");
    const novoForm = mapearDetalhesTraslado(form, dados);
    setForm((f) => ({ ...novoForm, documentos: f.documentos }));
    propagarAoPai({ ...novoForm, documentos: form.documentos });
    setTimeout(() => setAtualizando(null), 800);
  }

  function atualizarDetalhesSeguro() {
    const dados = obterDadosUnificados();
    if (!dados || !possuiDadosSeguro(dados)) {
      setErro("Nenhum dado de Seguro encontrado nos documentos.");
      return;
    }
    setErro("");
    setAtualizando("seguro");
    const novoForm = mapearDetalhesSeguro(form, dados);
    if (novoForm.seguroValor) setSeguroValorInput(formatarMoeda(novoForm.seguroValor));
    setForm((f) => ({ ...novoForm, documentos: f.documentos }));
    propagarAoPai({ ...novoForm, documentos: form.documentos });
    setSeguroMinimizado(false);
    setTimeout(() => setAtualizando(null), 800);
  }

  function atualizarDetalhesIngresso() {
    const dados = obterDadosUnificados();
    if (!dados || !possuiDadosIngresso(dados)) {
      setErro("Nenhum dado de Ingresso encontrado nos documentos.");
      return;
    }
    setErro("");
    setAtualizando("ingresso");
    const novoForm = mapearDetalhesIngresso(form, dados);
    setForm((f) => ({ ...novoForm, documentos: f.documentos }));
    propagarAoPai({ ...novoForm, documentos: form.documentos });
    setTimeout(() => setAtualizando(null), 800);
  }

  function atualizarResumoPacote() {
    const dados = obterDadosUnificados();
    if (!dados) {
      setErro("Nenhum documento com resultado de IA foi encontrado. Analise os documentos antes de atualizar.");
      return;
    }
    setErro("");
    setAtualizando("resumo");
    let novoForm = { ...form };
    novoForm = mapearDetalhesVoo(novoForm, dados);
    novoForm = mapearDetalhesHospedagem(novoForm, dados);
    if (possuiDadosSeguro(dados)) novoForm = mapearDetalhesSeguro(novoForm, dados);
    if (possuiDadosTraslado(dados)) novoForm = mapearDetalhesTraslado(novoForm, dados);
    if (possuiDadosIngresso(dados)) novoForm = mapearDetalhesIngresso(novoForm, dados);
    novoForm = { ...novoForm, descricao: gerarResumoPacote(novoForm) };
    if (novoForm.valor > 0) setValorInput(formatarMoeda(novoForm.valor));
    if (novoForm.seguroValor) setSeguroValorInput(formatarMoeda(novoForm.seguroValor));
    setForm((f) => ({ ...novoForm, documentos: f.documentos }));
    propagarAoPai({ ...novoForm, documentos: form.documentos });
    setResumoMinimizado(false);
    setTimeout(() => setAtualizando(null), 800);
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
      if (!form.urlOperador || form.urlOperador.length === 0) {
        setErro("Nenhum documento ou URL para analisar.");
        return;
      }
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

    // Analisar URLs do operador se estiverem preenchidas
    for (const url of form.urlOperador || []) {
      if (!url?.trim()) continue;
      
      try {
        adicionarLog(`Baixando conteúdo da URL: ${url}`);

        // Fazer download do conteúdo da página usando o backend para evitar CORS
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
            
            // Criar documento com mensagem de erro para o usuário
            const erroDocumento: Documento = {
              id: Date.now() + Math.floor(Math.random() * 10000),
              nome: `URL: ${url} (Erro)`,
              tipo: "text/url",
              arquivo: url,
              analise: `**Relatório da Análise da URL**\n\nErro: Todos os provedores de IA falharam.\n\nDetalhes:\n- Groq: Limite de taxa excedido\n- OpenAI: Chave de API inválida\n- Gemini: Créditos esgotados\n\nPor favor, verifique as configurações das APIs e tente novamente.`,
            };
            setForm((f) => ({
              ...f,
              documentos: [...(f.documentos || []), erroDocumento],
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
            
            // Criar documento com mensagem de erro para o usuário
            const erroDocumento: Documento = {
              id: Date.now() + Math.floor(Math.random() * 10000),
              nome: `URL: ${url} (Erro)`,
              tipo: "text/url",
              arquivo: url,
              analise: `**Relatório da Análise da URL**\n\nErro: Falha ao analisar com ${provedorCapitalizado}.\n\nDetalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nPor favor, verifique as configurações da API e tente novamente.`,
            };
            setForm((f) => ({
              ...f,
              documentos: [...(f.documentos || []), erroDocumento],
            }));
            
            setVouchersMinimizado(false);
          }
        }

        if (dataUrl) {
          adicionarLog(`Resposta recebida da IA.`);
          const respostaLimpa = dataUrl.reply.replace(/^```json\s*/, "").replace(/```$/, "").trim();

          // Verificar se a resposta parece ser JSON válido
          if (!respostaLimpa.startsWith('{') && !respostaLimpa.startsWith('[')) {
            adicionarLog(`Resposta não é JSON válido. Resposta: ${respostaLimpa.substring(0, 100)}...`);
            throw new Error("A IA não retornou um JSON válido. Verifique os logs para mais detalhes.");
          }

          adicionarLog(`Parseando resposta JSON...`);
          const respostaJson = JSON.parse(respostaLimpa);

          adicionarLog(`Dados extraídos do JSON: ${JSON.stringify(respostaJson).substring(0, 200)}...`);

          const dadosIACompletos = montarDadosIAFromJson(respostaJson, respostaJson.operador || "", respostaJson.politicaAlteracoesCancelamentos || "");
          adicionarLog(`Dados IA completos gerados.`);

          const relatorioCompleto = montarRelatorioUrl(provedorUsado, dadosIACompletos);
          adicionarLog(`Relatório gerado: ${relatorioCompleto.substring(0, 100)}...`);

          adicionarLog(`Análise da URL concluída com sucesso.`);
          adicionarLog(`Relatório gerado com ${relatorioCompleto.length} caracteres.`);

          // Salvar a URL como um documento no array documentos
          const novoDocumento: Documento = {
            id: Date.now() + Math.floor(Math.random() * 10000),
            nome: `URL: ${url}`,
            tipo: "text/url",
            arquivo: url,
            analise: relatorioCompleto,
          };
          setForm((f) => ({
            ...f,
            documentos: [...(f.documentos || []), novoDocumento],
          }));

          // Expandir seção de vouchers para mostrar o relatório da URL
          setVouchersMinimizado(false);
        } else {
          adicionarLog(`Nenhum dado recebido da IA para a URL: ${url}`);
        }
      } catch (error) {
        const mensagemErro = error instanceof Error ? error.message : "Não foi possível analisar a URL.";
        adicionarLog(`Falha ao analisar URL ${url}: ${mensagemErro}`);
        console.error("Erro na análise da URL:", error);
        // Continue with next URL instead of throwing
        continue;
      }
    }

    let workerOcr: Worker | null = null;
    try {
      try {
        workerOcr = await createWorker(["por", "eng"]);
      } catch {
        adicionarLog("OCR indisponível; tentando identificação por IA e comparação visual.");
      }

      const novasAnalises: Documento[] = [];
      for (const doc of form.documentos || []) {
        let contextoArquivo = "Nome do arquivo: " + doc.nome + "\n\n";
        let temConteudoPdf = false;
        let operadorDetectado = "";
        let ciaAereaDetectada = "";
        let politicaAlteracoesCancelamentos = "";
        let politicasHospedagemDetectadas = "";
        const imagensParaAnalise: string[] = [];

        if (doc.tipo === "application/pdf" && doc.arquivo) {
          try {
            const bytesPdf = dataUrlBase64ParaUint8Array(doc.arquivo);
            const loadingTask = pdfjsLib.getDocument({ data: bytesPdf });
            const pdf = await loadingTask.promise;
            let textContent = "";

            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const text = await page.getTextContent();
              let textoPagina = text.items.map((item) => ("str" in item ? item.str : "")).join(" ").trim();

              if (!textoPagina) {
                adicionarLog(`Página ${i} de "${doc.nome}" sem texto. Aplicando OCR...`);
                const imagemPagina = await renderizarPaginaPdfComoImagem(page);
                if (imagemPagina && imagensParaAnalise.length < 3) {
                  imagensParaAnalise.push(imagemPagina);
                }
                if (imagemPagina && workerOcr) {
                  try {
                    textoPagina = await extrairTextoPorOcr(imagemPagina, workerOcr);
                  } catch (error) {
                    console.warn(`Falha no OCR da página ${i} de "${doc.nome}":`, error);
                    adicionarLog(`OCR falhou na página ${i}; a imagem será enviada à OpenAI.`);
                  }
                }
              }

              if (textoPagina) {
                textContent += `--- Página ${i} ---\n${textoPagina}\n`;
              }
            }

            ciaAereaDetectada = detectarCiaAereaNoTexto(textContent);
            if (!ciaAereaDetectada && ehDocumentoVoo(doc.nome)) {
              const imagensEmbutidas = await extrairMaioresImagensEmbutidasDoPdf(pdf, 2);
              for (const imagemEmbutida of imagensEmbutidas) {
                if (imagensParaAnalise.length < 3) imagensParaAnalise.push(imagemEmbutida);
                if (!workerOcr) continue;

                try {
                  const textoImagemEmbutida = await extrairTextoPorOcr(imagemEmbutida, workerOcr);
                  if (textoImagemEmbutida) {
                    textContent += `--- Imagem embutida ---\n${textoImagemEmbutida}\n`;
                    ciaAereaDetectada = detectarCiaAereaNoTexto(textoImagemEmbutida);
                  }
                  if (ciaAereaDetectada) break;
                } catch (error) {
                  console.warn(`Falha no OCR de imagem embutida de "${doc.nome}":`, error);
                }
              }
            }

            temConteudoPdf = Boolean(textContent.trim());
            if (temConteudoPdf) {
              contextoArquivo += "--- Conteúdo do arquivo: " + doc.nome + " ---\n" + textContent + "\n--- Fim do arquivo: " + doc.nome + " ---\n\n";
            }

            if (ciaAereaDetectada) {
              adicionarLog(`Companhia aérea identificada no texto/OCR: ${ciaAereaDetectada}`);
              contextoArquivo += `--- Companhia aérea identificada no texto/OCR: ${ciaAereaDetectada} ---\n\n`;
            }

            politicaAlteracoesCancelamentos = extrairPoliticaAlteracoesCancelamentos(textContent);
            if (politicaAlteracoesCancelamentos) {
              adicionarLog(`Política de alterações e cancelamentos identificada em "${doc.nome}".`);
              contextoArquivo += "--- Política de alterações e cancelamentos ---\n" + politicaAlteracoesCancelamentos + "\n\n";
            }

            politicasHospedagemDetectadas = extrairPoliticasHospedagem(textContent);
            if (politicasHospedagemDetectadas) {
              adicionarLog(`Políticas de hospedagem identificadas em "${doc.nome}" (${politicasHospedagemDetectadas.length} caracteres).`);
              contextoArquivo += "--- Políticas, condições e informações da hospedagem ---\n" + politicasHospedagemDetectadas + "\n\n";
            }

            adicionarLog(`Extraindo logo do fornecedor em "${doc.nome}"...`);
            const logoEmbutido = await extrairPrimeiraImagemEmbutidaDoPdf(pdf);
            if (logoEmbutido) {
              operadorDetectado = await identificarOperadorNoLogo(logoEmbutido, workerOcr, adicionarLog);
            }

            if (!operadorDetectado) {
              adicionarLog("Tentando identificar operador pelo topo do PDF...");
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
              adicionarLog("Não foi possível identificar o operador pelo logo do fornecedor.");
            }
          } catch (error) {
            console.error(`Erro ao ler o PDF "${doc.nome}":`, error);
            contextoArquivo += "--- Erro ao ler o conteúdo do PDF: " + doc.nome + " ---\n";
          }
        }

        if (doc.tipo.startsWith("image/") && doc.arquivo) {
          imagensParaAnalise.push(doc.arquivo);
          if (workerOcr) {
            adicionarLog(`Extraindo texto da imagem "${doc.nome}" por OCR...`);
            try {
              const textoImagem = await extrairTextoPorOcr(doc.arquivo, workerOcr);
              if (textoImagem) {
                contextoArquivo += `--- Conteúdo OCR da imagem: ${doc.nome} ---\n${textoImagem}\n--- Fim do OCR ---\n\n`;
                operadorDetectado = detectarOperadorNoTexto(textoImagem);
                ciaAereaDetectada = detectarCiaAereaNoTexto(textoImagem);
                if (ciaAereaDetectada) {
                  adicionarLog(`Companhia aérea identificada no OCR: ${ciaAereaDetectada}`);
                  contextoArquivo += `--- Companhia aérea identificada no OCR: ${ciaAereaDetectada} ---\n\n`;
                }
              }
            } catch (error) {
              console.warn(`Falha no OCR da imagem "${doc.nome}":`, error);
              adicionarLog(`OCR falhou em "${doc.nome}"; a imagem será enviada à OpenAI.`);
            }
          }
          if (!operadorDetectado) {
            operadorDetectado = await identificarOperadorNoIcone(doc, workerOcr, adicionarLog);
          }
          if (operadorDetectado) {
            contextoArquivo += `--- Operador identificado na imagem: ${operadorDetectado} ---\n\n`;
          }
        }

        const prompt = criarPromptAnaliseCompleta(contextoArquivo, temConteudoPdf || contextoArquivo.includes("Conteúdo OCR"));
        const tentarComProvedor = async (provedor: "openai" | "groq" | "gemini" | "openrouter" | "cloudflare") => {
          const content: AIChatApiMessageContent = provedor === "openai" && imagensParaAnalise.length > 0
            ? [
                { type: "text", text: prompt },
                ...imagensParaAnalise.map((url) => ({ type: "image_url" as const, image_url: { url } })),
              ]
            : prompt;
          return enviarMensagemIA([{ role: "user", content }], provedor);
        };

        try {
          let data;
          let provedorUsado: "OpenAI" | "Groq" | "Gemini" | "OpenRouter" | "Cloudflare" = "OpenAI";
          const provedoresAutomatico: ("openai" | "groq" | "gemini" | "openrouter" | "cloudflare")[] =
            imagensParaAnalise.length > 0
              ? ["openai", "groq", "gemini", "openrouter", "cloudflare"]
              : ["groq", "openai", "gemini", "openrouter", "cloudflare"];
          const mapaProvedor: Record<string, "OpenAI" | "Groq" | "Gemini" | "OpenRouter" | "Cloudflare"> = {
            openai: "OpenAI",
            groq: "Groq",
            gemini: "Gemini",
            openrouter: "OpenRouter",
            cloudflare: "Cloudflare",
          };

          if (provedorIA === "automático") {
            for (const provedor of provedoresAutomatico) {
              try {
                const nomeProvedor = mapaProvedor[provedor];
                adicionarLog(`Analisando "${doc.nome}" com ${nomeProvedor}...`);
                data = await tentarComProvedor(provedor);
                provedorUsado = nomeProvedor;
                if (data) break;
              } catch (error) {
                const nomeProvedor = mapaProvedor[provedor];
                console.warn(`Falha no ${nomeProvedor}, tentando com o próximo...`, error);
                adicionarLog(`Falha no ${nomeProvedor} para "${doc.nome}". Tentando com o próximo...`);
              }
            }
            if (!data) throw new Error("Todos os provedores de IA falharam.");
          } else {
            provedorUsado = mapaProvedor[provedorIA] || "OpenAI";
            adicionarLog(`Analisando "${doc.nome}" com ${provedorUsado}...`);
            data = await tentarComProvedor(provedorIA);
          }

          const respostaLimpa = data.reply.replace(/^```json\s*/, "").replace(/```$/, "").trim();
          const respostaJson: unknown = JSON.parse(respostaLimpa);
          if (!respostaJson || typeof respostaJson !== "object" || Array.isArray(respostaJson)) {
            throw new Error("A IA retornou um JSON inválido.");
          }

          const respostaObjeto = respostaJson as Record<string, unknown>;
          const politicaResposta = typeof respostaObjeto.politicaAlteracoesCancelamentos === "string"
            ? respostaObjeto.politicaAlteracoesCancelamentos
            : "";
          const politicaFinal = politicaAlteracoesCancelamentos || politicaResposta;
          const dadosNormalizados = montarDadosIAFromJson(respostaObjeto, operadorDetectado, politicaFinal);
          dadosNormalizados.hospedagemPoliticasCondicoesInformacoesEspeciais = textoMaisCompleto(
              dadosNormalizados.hospedagemPoliticasCondicoesInformacoesEspeciais,
              politicasHospedagemDetectadas,
          );
          const { dados: dadosIACompletos, trechoAplicado } = aplicarCiaAereaDetectada(
              dadosNormalizados,
              doc.nome,
              ciaAereaDetectada,
          );
          if (trechoAplicado) {
            adicionarLog(`Companhia aérea aplicada ao trecho de ${trechoAplicado}: ${ciaAereaDetectada}`);
          }
          const relatorioCompleto = montarRelatorioCompleto(provedorUsado, operadorDetectado, dadosIACompletos);

          novasAnalises.push({
            ...doc,
            analise: relatorioCompleto,
            dadosIA: dadosIACompletos,
          });
        } catch (error) {
          console.error(`Erro ao analisar "${doc.nome}":`, error);
          const mensagemErro = "Não foi possível analisar o documento. Tente novamente mais tarde.";
          adicionarLog(`Falha ao analisar "${doc.nome}": ${mensagemErro}`);
          novasAnalises.push({ ...doc, analise: `Falha na análise com IA: ${mensagemErro}` });
        }
      }

      const dadosUnificados = obterDadosMescladosDeTodos(novasAnalises);

      // Preencher campos automaticamente após a análise
      let novoFormCalculado = { ...form };
      if (temDadosExtraidos(dadosUnificados)) {
        novoFormCalculado = mapearDetalhesVoo(novoFormCalculado, dadosUnificados);
        novoFormCalculado = mapearDetalhesHospedagem(novoFormCalculado, dadosUnificados);
        if (possuiDadosSeguro(dadosUnificados)) novoFormCalculado = mapearDetalhesSeguro(novoFormCalculado, dadosUnificados);
        if (possuiDadosTraslado(dadosUnificados)) novoFormCalculado = mapearDetalhesTraslado(novoFormCalculado, dadosUnificados);
        if (possuiDadosIngresso(dadosUnificados)) novoFormCalculado = mapearDetalhesIngresso(novoFormCalculado, dadosUnificados);
        novoFormCalculado = { ...novoFormCalculado, descricao: gerarResumoPacote(novoFormCalculado) };
      }

      if (novoFormCalculado.valor > 0) {
        setValorInput(formatarMoeda(novoFormCalculado.valor));
      }
      if (novoFormCalculado.seguroValor) {
        setSeguroValorInput(formatarMoeda(novoFormCalculado.seguroValor));
      }

      // Preservar documentos do tipo URL que foram adicionados durante a análise de URLs
      const documentosUrl = (form.documentos || []).filter(doc => doc.tipo === "text/url");
      const documentosNaoUrl = novasAnalises.filter(doc => doc.tipo !== "text/url");
      const formFinal = { ...novoFormCalculado, documentos: [...documentosUrl, ...documentosNaoUrl] };

      setForm(() => formFinal);
      propagarAoPai(formFinal);

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
      // Persiste o log no formulário para exibir após a análise (usa o array local que tem os valores corretos)
      setForm((f) => ({ ...f, logAnalise: logEntries.join("\n") }));
    }
  }


  return (
      <div className="space-y-4">
        {/* Seção de Anexos e Análise com IA */}
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between gap-3 cursor-pointer select-none" onClick={() => setVouchersMinimizado((prev) => !prev)}>
            <h4 className="flex items-center gap-2 font-semibold text-gray-900">
              <Package2 className="h-4 w-4 text-indigo-500" />
              Vouchers
            </h4>          <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setVouchersMinimizado((prev) => !prev); }}
              className="gap-2 text-gray-600 hover:text-gray-900"
          >
            {vouchersMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            {vouchersMinimizado ? " " : " "}
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
                  {(form.documentos || []).length > 0 && (
                      <div className="space-y-1.5 pr-2">
                        {(form.documentos || []).map((doc) => (
                            <div key={doc.id} className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs">
                              <a href={doc.arquivo} download={doc.nome} className="flex min-w-0 flex-1 items-center gap-2 text-indigo-600 hover:text-indigo-700">
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{doc.nome}</span>
                              </a>
                              <div className="flex shrink-0 items-center gap-2">
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <Checkbox
                                      id={`exibir-no-roteiro-${doc.id}`}
                                      checked={doc.exibirNoRoteiro !== false}
                                      onCheckedChange={(checked) => atualizarExibicaoDocumento(doc.id, checked === true)}
                                  />
                                  <Label
                                      htmlFor={`exibir-no-roteiro-${doc.id}`}
                                      className="cursor-pointer text-xs font-normal text-gray-600"
                                  >
                                    Exibir no roteiro
                                  </Label>
                                </div>
                                <button type="button" onClick={() => removerDocumento(doc.id)} className="rounded p-1 text-red-500 hover:bg-red-50" title="Remover documento">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                        ))}
                      </div>
                  )}
                  <div className="mt-4">
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
                          className={`pl-8 ${!novaUrlOperador ? 'bg-yellow-50' : 'bg-white'}`}
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
                        <div className="space-y-1.5 pr-2 mt-2">
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
                </div>
                <div className="flex justify-end">
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


                {(form.documentos || []).filter(doc => doc.analise && doc.tipo === "text/url").length > 0 && (
                    <div className="mt-3 rounded-md border border-indigo-200 bg-indigo-50 text-xs text-indigo-800">
                      <div className="flex items-center justify-between gap-2 p-2">
                        <span className="font-medium">Relatório da URL</span>
                      </div>
                      {(form.documentos || []).filter(doc => doc.analise && doc.tipo === "text/url").map((doc) => (
                          <div key={doc.id} className="border-t border-indigo-200">
                            <div className="flex items-center justify-between gap-2 p-2">
                              <span className="truncate">{doc.nome}</span>
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
                              </Button>
                            </div>
                            {relatoriosExpandidos.has(doc.id) && (
                                <div className="whitespace-pre-wrap border-t border-indigo-200 px-2 pb-2 pt-2 max-h-60 overflow-y-auto">
                                  {doc.analise}
                                </div>
                            )}
                          </div>
                      ))}
                    </div>
                )}

                {(form.documentos || []).filter(doc => doc.analise && doc.tipo !== "text/url").length > 0 && (
                    <div className="mt-3 rounded-md border border-indigo-200 bg-indigo-50 text-xs text-indigo-800">
                      <div className="flex items-center justify-between gap-2 p-2">
                        <span className="font-medium">Relatórios dos Arquivos</span>
                      </div>
                      {(form.documentos || []).filter(doc => doc.analise && doc.tipo !== "text/url").map((doc) => (
                          <div key={doc.id} className="border-t border-indigo-200">
                            <div className="flex items-center justify-between gap-2 p-2">
                              <span className="truncate">{doc.nome}</span>
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
                              </Button>
                            </div>
                            {relatoriosExpandidos.has(doc.id) && (
                                <div className="whitespace-pre-wrap border-t border-indigo-200 px-2 pb-2 pt-2 max-h-60 overflow-y-auto">
                                  {doc.analise}
                                </div>
                            )}
                          </div>
                      ))}
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t cursor-pointer select-none" onClick={() => setFormMinimizado((prev) => !prev)}>
                  <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                    <Plus className="h-4 w-4 text-indigo-500" />
                    Voo
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); atualizarDetalhesVoo(); }}
                        className="gap-2"
                    >
                      <Sparkles className={`w-4 h-4 ${analisandoIA ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setFormMinimizado((prev) => !prev); }}
                        className="gap-2 text-gray-600 hover:text-gray-900"
                    >
                      {formMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      {formMinimizado ? " " : " "}
                    </Button>
                  </div>
                </div>

                {!formMinimizado && (
                    <>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-4">
                        <div className="sm:col-span-2">
                          <Label className="text-xs">Operador *</Label>
                          <select
                              className={`mt-1 flex h-9 w-full rounded-md border border-input px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 ${!form.operador ? 'bg-yellow-50' : 'bg-input-background'}`}
                              value={form.operador}
                              onChange={(e) => setForm((prev) => ({ ...prev, operador: e.target.value }))}
                          >
                            <option value="">Selecione um operador</option>
                            {Array.from(new Set([
                              ...operadores,
                              ...(form.operador && !operadores.includes(form.operador) ? [form.operador] : [])
                            ])).map((operador) => (
                              <option key={operador} value={operador}>{operador}</option>
                            ))}
                          </select>
                        </div>

                        <section className="sm:col-span-2 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                          <div className={`flex cursor-pointer select-none items-center justify-between ${trechoIdaMinimizado ? "" : "mb-4"}`} onClick={() => setTrechoIdaMinimizado((prev) => !prev)}>
                            <h5 className="font-semibold text-blue-800">Trecho de Ida</h5>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-expanded={!trechoIdaMinimizado}
                                aria-controls="campos-trecho-ida"
                                onClick={(e) => { e.stopPropagation(); setTrechoIdaMinimizado((prev) => !prev); }}
                                className="h-7 gap-1 px-1.5 text-blue-700 hover:text-blue-900"
                            >
                              {trechoIdaMinimizado ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                              <span className="sr-only">{trechoIdaMinimizado ? "Expandir trecho de ida" : "Recolher trecho de ida"}</span>
                            </Button>
                          </div>
                          {!trechoIdaMinimizado && (
                          <div id="campos-trecho-ida" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <Label htmlFor="pacote-data-ida" className="text-xs">Data</Label>
                              <Input id="pacote-data-ida" type="date" className={`mt-1 ${!form.dataIda ? 'bg-yellow-50' : 'bg-white'}`} value={form.dataIda || ""} onChange={(e) => setForm((prev) => ({ ...prev, dataIda: e.target.value }))} />
                            </div>
                            <div>
                              <Label htmlFor="pacote-cia-ida" className="text-xs">CIA Aérea</Label>
                              <select
                                  id="pacote-cia-ida"
                                  className={`mt-1 flex h-9 w-full rounded-md border border-input px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 ${!form.ciaAerea ? 'bg-yellow-50' : 'bg-white'}`}
                                  value={form.ciaAerea || ""}
                                  onChange={(e) => setForm((prev) => ({ ...prev, ciaAerea: e.target.value }))}
                              >
                                <option value="">Selecione uma companhia</option>
                                {obterOpcoesCiaAerea(form.ciaAerea).map((ciaAerea) => (
                                  <option key={ciaAerea} value={ciaAerea}>{ciaAerea}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label htmlFor="pacote-reserva-ida" className="text-xs">Nº de Reserva/Localizador</Label>
                              <Input id="pacote-reserva-ida" className={`mt-1 ${!form.reserva ? 'bg-yellow-50' : 'bg-white'}`} placeholder="Ex: ABC123" value={form.reserva || ""} onChange={(e) => setForm((prev) => ({ ...prev, reserva: e.target.value }))} />
                            </div>
                            <div>
                              <Label htmlFor="pacote-voo-ida" className="text-xs">Nº do Voo</Label>
                              <Input id="pacote-voo-ida" className={`mt-1 ${!form.numeroVooIda ? 'bg-yellow-50' : 'bg-white'}`} placeholder="Ex: AD 2440" value={form.numeroVooIda || ""} onChange={(e) => setForm((prev) => ({ ...prev, numeroVooIda: e.target.value }))} />
                            </div>
                            <div>
                              <Label htmlFor="pacote-bagagem-ida" className="text-xs">Bagagem</Label>
                              <Input id="pacote-bagagem-ida" className={`mt-1 ${!form.bagagemIda ? 'bg-yellow-50' : 'bg-white'}`} placeholder="Ex: 1 mala de 23 kg" value={form.bagagemIda || ""} onChange={(e) => setForm((prev) => ({ ...prev, bagagemIda: e.target.value }))} />
                            </div>
                            <div>
                              <Label htmlFor="pacote-link-ida" className="text-xs">Link</Label>
                              <div className="relative mt-1">
                                <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input id="pacote-link-ida" type="url" placeholder="https://..." className={`pl-8 ${!form.link ? 'bg-yellow-50' : 'bg-white'}`} value={form.link} onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))} />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="pacote-origem-ida" className="text-xs">Origem</Label>
                              <select
                                  id="pacote-origem-ida"
                                  className={`mt-1 flex h-9 w-full rounded-md border border-input px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 ${!form.origemIda ? 'bg-yellow-50' : 'bg-white'}`}
                                  value={form.origemIda || ""}
                                  onChange={(e) => setForm((prev) => ({ ...prev, origemIda: e.target.value, origem: e.target.value }))}
                              >
                                <option value="">Selecione o aeroporto de origem</option>
                                {obterOpcoesAeroporto(form.origemIda).map((aeroporto) => (
                                  <option key={aeroporto.value} value={aeroporto.value}>{aeroporto.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label htmlFor="pacote-destino-ida" className="text-xs">Destino</Label>
                              <select
                                  id="pacote-destino-ida"
                                  className={`mt-1 flex h-9 w-full rounded-md border border-input px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 ${!form.destinoIda ? 'bg-yellow-50' : 'bg-white'}`}
                                  value={form.destinoIda || ""}
                                  onChange={(e) => setForm((prev) => ({ ...prev, destinoIda: e.target.value, destino: e.target.value }))}
                              >
                                <option value="">Selecione o aeroporto de destino</option>
                                {obterOpcoesAeroporto(form.destinoIda).map((aeroporto) => (
                                  <option key={aeroporto.value} value={aeroporto.value}>{aeroporto.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label htmlFor="pacote-duracao-ida" className="text-xs">Duração</Label>
                              <Input id="pacote-duracao-ida" className={`mt-1 ${!form.duracaoIda ? 'bg-yellow-50' : 'bg-white'}`} placeholder="Ex: 11h 30min" value={form.duracaoIda || ""} onChange={(e) => setForm((prev) => ({ ...prev, duracaoIda: e.target.value }))} />
                            </div>
                            <div>
                              <Label htmlFor="pacote-saida-ida" className="text-xs">Horário de Saída</Label>
                              <Input id="pacote-saida-ida" className={`mt-1 ${!form.horaSaidaIda ? 'bg-yellow-50' : 'bg-white'}`} placeholder="Ex: 14:30" value={form.horaSaidaIda || ""} onChange={(e) => setForm((prev) => ({ ...prev, horaSaidaIda: e.target.value }))} />
                            </div>
                            <div>
                              <Label htmlFor="pacote-chegada-ida" className="text-xs">Horário de Chegada</Label>
                              <Input id="pacote-chegada-ida" className={`mt-1 ${!form.horaChegadaIda ? 'bg-yellow-50' : 'bg-white'}`} placeholder="Ex: 05:30" value={form.horaChegadaIda || ""} onChange={(e) => setForm((prev) => ({ ...prev, horaChegadaIda: e.target.value }))} />
                            </div>
                          </div>
                          )}
                        </section>

                        <section className="sm:col-span-2 rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                          <div className={`flex cursor-pointer select-none items-center justify-between ${trechoVoltaMinimizado ? "" : "mb-4"}`} onClick={() => setTrechoVoltaMinimizado((prev) => !prev)}>
                            <h5 className="font-semibold text-orange-800">Trecho de Volta</h5>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-expanded={!trechoVoltaMinimizado}
                                aria-controls="campos-trecho-volta"
                                onClick={(e) => { e.stopPropagation(); setTrechoVoltaMinimizado((prev) => !prev); }}
                                className="h-7 gap-1 px-1.5 text-orange-700 hover:text-orange-900"
                            >
                              {trechoVoltaMinimizado ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                              <span className="sr-only">{trechoVoltaMinimizado ? "Expandir trecho de volta" : "Recolher trecho de volta"}</span>
                            </Button>
                          </div>
                          {!trechoVoltaMinimizado && (
                          <div id="campos-trecho-volta" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <Label htmlFor="pacote-data-volta" className="text-xs">Data</Label>
                              <Input id="pacote-data-volta" type="date" className={`mt-1 ${!form.dataVolta ? 'bg-yellow-50' : 'bg-white'}`} value={form.dataVolta || ""} onChange={(e) => setForm((prev) => ({ ...prev, dataVolta: e.target.value }))} />
                            </div>
                            <div>
                              <Label htmlFor="pacote-cia-volta" className="text-xs">CIA Aérea</Label>
                              <select
                                  id="pacote-cia-volta"
                                  className={`mt-1 flex h-9 w-full rounded-md border border-input px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 ${!form.ciaAereaVolta ? 'bg-yellow-50' : 'bg-white'}`}
                                  value={form.ciaAereaVolta || ""}
                                  onChange={(e) => setForm((prev) => ({ ...prev, ciaAereaVolta: e.target.value }))}
                              >
                                <option value="">Selecione uma companhia</option>
                                {obterOpcoesCiaAerea(form.ciaAereaVolta).map((ciaAerea) => (
                                  <option key={ciaAerea} value={ciaAerea}>{ciaAerea}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label htmlFor="pacote-reserva-volta" className="text-xs">Nº de Reserva/Localizador</Label>
                              <Input id="pacote-reserva-volta" className={`mt-1 ${!form.reservaVolta ? 'bg-yellow-50' : 'bg-white'}`} placeholder={form.reserva ? `Ex: ${form.reserva}` : "Ex: ABC123"} value={form.reservaVolta || ""} onChange={(e) => setForm((prev) => ({ ...prev, reservaVolta: e.target.value }))} />
                            </div>
                            <div>
                              <Label htmlFor="pacote-voo-volta" className="text-xs">Nº do Voo</Label>
                              <Input id="pacote-voo-volta" className={`mt-1 ${!form.numeroVooVolta ? 'bg-yellow-50' : 'bg-white'}`} placeholder="Ex: LA 4754" value={form.numeroVooVolta || ""} onChange={(e) => setForm((prev) => ({ ...prev, numeroVooVolta: e.target.value }))} />
                            </div>
                            <div>
                              <Label htmlFor="pacote-bagagem-volta" className="text-xs">Bagagem</Label>
                              <Input id="pacote-bagagem-volta" className={`mt-1 ${!form.bagagemVolta ? 'bg-yellow-50' : 'bg-white'}`} placeholder="Ex: 1 mala de 23 kg" value={form.bagagemVolta || ""} onChange={(e) => setForm((prev) => ({ ...prev, bagagemVolta: e.target.value }))} />
                            </div>
                            <div>
                              <Label htmlFor="pacote-link-volta" className="text-xs">Link</Label>
                              <div className="relative mt-1">
                                <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input id="pacote-link-volta" type="url" placeholder="https://..." className={`pl-8 ${!form.linkVolta ? 'bg-yellow-50' : 'bg-white'}`} value={form.linkVolta || ""} onChange={(e) => setForm((prev) => ({ ...prev, linkVolta: e.target.value }))} />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="pacote-origem-volta" className="text-xs">Origem</Label>
                              <select
                                  id="pacote-origem-volta"
                                  className={`mt-1 flex h-9 w-full rounded-md border border-input px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 ${!form.origemVolta ? 'bg-yellow-50' : 'bg-white'}`}
                                  value={form.origemVolta || ""}
                                  onChange={(e) => setForm((prev) => ({ ...prev, origemVolta: e.target.value }))}
                              >
                                <option value="">Selecione o aeroporto de origem</option>
                                {obterOpcoesAeroporto(form.origemVolta).map((aeroporto) => (
                                  <option key={aeroporto.value} value={aeroporto.value}>{aeroporto.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label htmlFor="pacote-destino-volta" className="text-xs">Destino</Label>
                              <select
                                  id="pacote-destino-volta"
                                  className={`mt-1 flex h-9 w-full rounded-md border border-input px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 ${!form.destinoVolta ? 'bg-yellow-50' : 'bg-white'}`}
                                  value={form.destinoVolta || ""}
                                  onChange={(e) => setForm((prev) => ({ ...prev, destinoVolta: e.target.value }))}
                              >
                                <option value="">Selecione o aeroporto de destino</option>
                                {obterOpcoesAeroporto(form.destinoVolta).map((aeroporto) => (
                                  <option key={aeroporto.value} value={aeroporto.value}>{aeroporto.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label htmlFor="pacote-duracao-volta" className="text-xs">Duração</Label>
                              <Input id="pacote-duracao-volta" className={`mt-1 ${!form.duracaoVolta ? 'bg-yellow-50' : 'bg-white'}`} placeholder="Ex: 11h 30min" value={form.duracaoVolta || ""} onChange={(e) => setForm((prev) => ({ ...prev, duracaoVolta: e.target.value }))} />
                            </div>
                            <div>
                              <Label htmlFor="pacote-saida-volta" className="text-xs">Horário de Saída</Label>
                              <Input id="pacote-saida-volta" className={`mt-1 ${!form.horaSaidaVolta ? 'bg-yellow-50' : 'bg-white'}`} placeholder="Ex: 18:30" value={form.horaSaidaVolta || ""} onChange={(e) => setForm((prev) => ({ ...prev, horaSaidaVolta: e.target.value }))} />
                            </div>
                            <div>
                              <Label htmlFor="pacote-chegada-volta" className="text-xs">Horário de Chegada</Label>
                              <Input id="pacote-chegada-volta" className={`mt-1 ${!form.horaChegadaVolta ? 'bg-yellow-50' : 'bg-white'}`} placeholder="Ex: 02:30" value={form.horaChegadaVolta || ""} onChange={(e) => setForm((prev) => ({ ...prev, horaChegadaVolta: e.target.value }))} />
                            </div>
                          </div>
                          )}
                        </section>

                        <div className="sm:col-span-2">
                          <Label className="text-xs">Passageiros</Label>
                          <Input className={`mt-1 ${!form.passageiros ? 'bg-yellow-50' : 'bg-white'}`} placeholder="Ex: 2 adultos, 1 criança" value={form.passageiros || ""} onChange={(e) => setForm((prev) => ({ ...prev, passageiros: e.target.value }))} />
                        </div>



                        <div className="sm:col-span-2 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                          <div className="flex cursor-pointer select-none items-center justify-between" onClick={() => setPoliticaCancelamentoMinimizado((prev) => !prev)}>
                            <Label className="cursor-pointer text-xs font-semibold text-gray-700">Política de Alteração e Cancelamento</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-expanded={!politicaCancelamentoMinimizado}
                                aria-controls="campos-politica-cancelamento"
                                onClick={(e) => { e.stopPropagation(); setPoliticaCancelamentoMinimizado((prev) => !prev); }}
                                className="gap-1 text-gray-600 hover:text-gray-900 h-7 px-1.5"
                            >
                              {politicaCancelamentoMinimizado ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                              <span className="sr-only">{politicaCancelamentoMinimizado ? "Expandir política de alteração e cancelamento" : "Recolher política de alteração e cancelamento"}</span>
                            </Button>
                          </div>
                          {!politicaCancelamentoMinimizado && (
                              <Textarea
                                  id="campos-politica-cancelamento"
                                  className={`mt-1 min-h-28 ${!form.politicaAlteracoesCancelamentos ? 'bg-yellow-50' : 'bg-white'}`}
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
                                className={`pl-8 ${!form.foto ? 'bg-yellow-50' : 'bg-white'}`}
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
                                const valorNumerico = parseMoeda(texto);
                                setForm((prev) => ({ ...prev, valor: valorNumerico }));
                              }}
                              onBlur={() => {
                                const valorNumerico = parseMoeda(valorInput);
                                setValorInput(valorNumerico > 0 ? formatarMoeda(valorNumerico) : "");
                                setForm((prev) => ({ ...prev, valor: valorNumerico }));
                              }}
                              className={`mt-1 ${!valorInput ? 'bg-yellow-50' : 'bg-white'}`}
                          />
                        </div>
                      </div>
                    </>
                )}

                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t cursor-pointer select-none" onClick={() => setHospedagemMinimizado((prev) => !prev)}>
                  <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                    <Plus className="h-4 w-4 text-indigo-500" />
                    Hospedagem
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); atualizarDetalhesHospedagem(); }}
                        className="gap-2"
                    >
                      <Sparkles className={`w-4 h-4 ${analisandoIA ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setHospedagemMinimizado((prev) => !prev); }}
                        className="gap-2 text-gray-600 hover:text-gray-900"
                    >
                      {hospedagemMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      {hospedagemMinimizado ? " " : " "}
                    </Button>
                  </div>
                </div>

                {!hospedagemMinimizado && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-4">
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Nome do Hotel</Label>
                        <Input
                            className={`mt-1 ${!form.hospedagemNome ? 'bg-yellow-50' : 'bg-white'}`}
                            placeholder="Ex: Hotel Ibis Lisboa"
                            value={form.hospedagemNome || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemNome: e.target.value }))}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs">Endereço</Label>
                        <Input
                            className={`mt-1 ${!form.hospedagemEndereco ? 'bg-yellow-50' : 'bg-white'}`}
                            placeholder="Ex: Rua Augusta, 123 - Lisboa"
                            value={form.hospedagemEndereco || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemEndereco: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Telefone</Label>
                        <Input
                            type="tel"
                            className={`mt-1 ${!form.hospedagemTelefone ? 'bg-yellow-50' : 'bg-white'}`}
                            placeholder="Ex: +55 11 1234-5678"
                            value={form.hospedagemTelefone || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemTelefone: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">E-mail</Label>
                        <Input
                            type="email"
                            className={`mt-1 ${!form.hospedagemEmail ? 'bg-yellow-50' : 'bg-white'}`}
                            placeholder="Ex: reservas@hotel.com"
                            value={form.hospedagemEmail || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemEmail: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Check-in</Label>
                        <Input
                            type="date"
                            className={`mt-1 ${!form.hospedagemCheckin ? 'bg-yellow-50' : 'bg-white'}`}
                            value={form.hospedagemCheckin || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemCheckin: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Check-out</Label>
                        <Input
                            type="date"
                            className={`mt-1 ${!form.hospedagemCheckout ? 'bg-yellow-50' : 'bg-white'}`}
                            value={form.hospedagemCheckout || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemCheckout: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Horário de Check-in</Label>
                        <Input
                            className={`mt-1 ${!form.hospedagemHorarioCheckin ? 'bg-yellow-50' : 'bg-white'}`}
                            placeholder="Ex: a partir das 14:00"
                            value={form.hospedagemHorarioCheckin || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemHorarioCheckin: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Horário de Check-out</Label>
                        <Input
                            className={`mt-1 ${!form.hospedagemHorarioCheckout ? 'bg-yellow-50' : 'bg-white'}`}
                            placeholder="Ex: até 12:00"
                            value={form.hospedagemHorarioCheckout || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemHorarioCheckout: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Tipo de Quarto</Label>
                        <Input
                            className={`mt-1 ${!form.hospedagemTipoQuarto ? 'bg-yellow-50' : 'bg-white'}`}
                            placeholder="Ex: Duplo Standard"
                            value={form.hospedagemTipoQuarto || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemTipoQuarto: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Regime / Pensão</Label>
                        <Input
                            className={`mt-1 ${!form.hospedagemRegime ? 'bg-yellow-50' : 'bg-white'}`}
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
                            <span className="text-xs">{comodidadesMinimizado ? " " : " "}</span>
                          </Button>
                        </div>
                        {!comodidadesMinimizado && (
                            <Textarea
                                className={`mt-1 min-h-20 ${!form.hospedagemComodidades ? 'bg-yellow-50' : 'bg-white'}`}
                                placeholder="Ex: piscina, Wi-Fi, academia, estacionamento"
                                value={form.hospedagemComodidades || ""}
                                onChange={(e) => setForm((prev) => ({ ...prev, hospedagemComodidades: e.target.value }))}
                            />
                        )}
                      </div>

                      <div>
                        <Label className="text-xs">Noites</Label>
                        <Input
                            className={`mt-1 ${!form.hospedagemNoites ? 'bg-yellow-50' : 'bg-white'}`}
                            placeholder="Ex: 7"
                            value={form.hospedagemNoites || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, hospedagemNoites: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Valor (R$)</Label>
                        <Input
                            className={`mt-1 ${!hospedagemValorInput ? 'bg-yellow-50' : 'bg-white'}`}
                            placeholder="R$ 0,00"
                            value={hospedagemValorInput}
                            onChange={(e) => {
                              const texto = e.target.value;
                              setHospedagemValorInput(texto);
                              const valorNumerico = parseMoeda(texto);
                              setForm((prev) => ({ ...prev, hospedagemValor: valorNumerico }));
                            }}
                            onBlur={() => {
                              const valorNumerico = parseMoeda(hospedagemValorInput);
                              const formatado = valorNumerico > 0 ? formatarMoeda(valorNumerico) : "";
                              setHospedagemValorInput(formatado);
                              setForm((prev) => ({ ...prev, hospedagemValor: valorNumerico }));
                            }}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs">Link do Hotel</Label>
                        <div className="relative mt-1 flex gap-2">
                          <div className="relative flex-1">
                            <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="https://..."
                                className="pl-8"
                                value={hospedagemLinkInput}
                                onChange={(e) => setHospedagemLinkInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionarLinkHospedagem())}
                            />
                          </div>
                          {hospedagemLinkInput && (
                              <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => window.open(hospedagemLinkInput, "_blank", "noopener,noreferrer")}
                                  title="Abrir link"
                                  className="shrink-0 border-gray-300 text-gray-600 hover:bg-gray-50"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                          )}
                          <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={adicionarLinkHospedagem}
                              title="Adicionar link"
                              className="shrink-0 border-green-300 text-green-600 hover:bg-green-50"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={buscandoLinkHotelIA}
                              onClick={buscarLinkHotelIA}
                              title="Buscar link do hotel com IA"
                              className="shrink-0 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                          >
                            {buscandoLinkHotelIA ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {/* Lista de links adicionados */}
                        {(form.hospedagemLinks || []).length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {(form.hospedagemLinks || []).map((url, idx) => (
                                  <div key={idx} className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs">
                                    <Link2 className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 min-w-0 truncate text-indigo-600 hover:text-indigo-700"
                                    >
                                      {url}
                                    </a>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                                        title="Abrir link"
                                        className="h-6 w-6 shrink-0 text-gray-400 hover:text-gray-600"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => removerLinkHospedagem(url)}
                                        className="shrink-0 rounded p-1 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        title="Remover link"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                              ))}
                            </div>
                        )}
                        {/* Fallback: quando não há links na lista mas há um link direto salvo */}
                        {!(form.hospedagemLinks || []).length && form.hospedagemLink && (
                            <div className="mt-2 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs">
                              <Link2 className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                              <a
                                  href={form.hospedagemLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 min-w-0 truncate text-indigo-600 hover:text-indigo-700"
                              >
                                {form.hospedagemLink}
                              </a>
                              <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => window.open(form.hospedagemLink!, "_blank", "noopener,noreferrer")}
                                  title="Abrir link"
                                  className="h-6 w-6 shrink-0 text-gray-400 hover:text-gray-600"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs">Fotos da Hospedagem</Label>
                        <div className="relative mt-1 flex gap-2">
                          <div className="relative flex-1">
                            <Image className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="https://..."
                                className="pl-8"
                                value={hospedagemFotoInput}
                                onChange={(e) => {
                                  setErroFotoHotelIA("");
                                  setHospedagemFotoInput(e.target.value);
                                }}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionarFotoHospedagem())}
                            />
                          </div>
                          {hospedagemFotoInput && (
                              <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => window.open(hospedagemFotoInput, "_blank", "noopener,noreferrer")}
                                  title="Abrir foto"
                                  className="shrink-0 border-gray-300 text-gray-600 hover:bg-gray-50"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                          )}
                          <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={adicionarFotoHospedagem}
                              title="Adicionar foto"
                              className="shrink-0 border-green-300 text-green-600 hover:bg-green-50"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={buscandoFotoHotelIA}
                              onClick={async () => {
                                await buscarFotoHotelIA();
                                // após busca bem-sucedida, adiciona automaticamente à lista
                              }}
                              title="Buscar foto do hotel com IA"
                              className="shrink-0 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                          >
                            {buscandoFotoHotelIA ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {erroFotoHotelIA && (
                            <p className="mt-1 text-xs text-red-500">{erroFotoHotelIA}</p>
                        )}
                        {/* Lista de fotos adicionadas */}
                        {(form.hospedagemFotos || []).length > 0 && (
                            <div className="mt-2 space-y-2">
                              {(form.hospedagemFotos || []).map((url, idx) => (
                                  <div key={idx} className="flex items-center gap-2 rounded-md border border-gray-200 overflow-hidden">
                                    <img src={url} alt={`Foto ${idx + 1}`} className="h-16 w-24 object-cover flex-shrink-0" />
                                    <span className="flex-1 min-w-0 px-2 text-xs text-gray-500 truncate">{url}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                                        title="Abrir foto"
                                        className="shrink-0 text-gray-400 hover:text-gray-600"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removerFotoHospedagem(url)}
                                        title="Remover foto"
                                        className="shrink-0 text-red-400 hover:text-red-600 mr-1"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                              ))}
                            </div>
                        )}
                        {/* Prévia da foto principal para compatibilidade quando não tem array */}
                        {!(form.hospedagemFotos || []).length && form.hospedagemFoto && (
                            <div className="mt-2 overflow-hidden rounded-md border border-gray-200">
                              <img src={form.hospedagemFoto} alt="Prévia da foto da hospedagem" className="h-28 w-full object-cover" />
                            </div>
                        )}
                      </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t cursor-pointer select-none" onClick={() => setSeguroMinimizado((prev) => !prev)}>
                  <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                    <ShieldCheck className="h-4 w-4 text-indigo-500" />
                    Seguro
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); atualizarDetalhesSeguro(); }}
                        className="gap-2"
                        title="Atualizar seguro com dados analisados"
                    >
                      <Sparkles className={`w-4 h-4 ${atualizando === "seguro" ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setSeguroMinimizado((prev) => !prev); }}
                        className="gap-2 text-gray-600 hover:text-gray-900"
                    >
                      {seguroMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {!seguroMinimizado && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-4">
                      <div>
                        <Label className="text-xs">Empresa de Assistência</Label>
                        <Input className="mt-1" placeholder="Ex: Universal Assistance" value={form.seguroAssistencia || ""} onChange={(e) => setForm((prev) => ({ ...prev, seguroAssistencia: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Seguradora</Label>
                        <Input className="mt-1" placeholder="Seguradora garantidora" value={form.seguroSeguradora || ""} onChange={(e) => setForm((prev) => ({ ...prev, seguroSeguradora: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Plano / Produto</Label>
                        <Input className="mt-1" value={form.seguroPlano || ""} onChange={(e) => setForm((prev) => ({ ...prev, seguroPlano: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Apólice / Certificado</Label>
                        <Input className="mt-1" value={form.seguroApoliceCertificado || ""} onChange={(e) => setForm((prev) => ({ ...prev, seguroApoliceCertificado: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Número da Reserva</Label>
                        <Input className="mt-1" value={form.seguroNumeroReserva || ""} onChange={(e) => setForm((prev) => ({ ...prev, seguroNumeroReserva: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Número da Confirmação</Label>
                        <Input className="mt-1" value={form.seguroNumeroConfirmacao || ""} onChange={(e) => setForm((prev) => ({ ...prev, seguroNumeroConfirmacao: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Passageiros / Segurados</Label>
                        <Textarea className="mt-1 min-h-20" value={form.seguroSegurados || ""} onChange={(e) => setForm((prev) => ({ ...prev, seguroSegurados: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Destino</Label>
                        <Input className="mt-1" value={form.seguroDestino || ""} onChange={(e) => setForm((prev) => ({ ...prev, seguroDestino: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Âmbito de Cobertura</Label>
                        <Input className="mt-1" placeholder="Ex: Nacional" value={form.seguroAmbitoCobertura || ""} onChange={(e) => setForm((prev) => ({ ...prev, seguroAmbitoCobertura: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Início da Vigência</Label>
                        <Input type="date" className="mt-1" value={form.seguroVigenciaInicio || ""} onChange={(e) => setForm((prev) => ({ ...prev, seguroVigenciaInicio: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Fim da Vigência</Label>
                        <Input type="date" className="mt-1" value={form.seguroVigenciaFim || ""} onChange={(e) => setForm((prev) => ({ ...prev, seguroVigenciaFim: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Valor</Label>
                        <Input
                            className="mt-1"
                            inputMode="numeric"
                            placeholder="R$ 0,00"
                            value={seguroValorInput}
                            onChange={(e) => {
                              const valorFormatado = formatarMoedaInput(e.target.value);
                              setSeguroValorInput(valorFormatado);
                              setForm((prev) => ({ ...prev, seguroValor: parseMoeda(valorFormatado) }));
                            }}
                            onBlur={() => {
                              const valorNumerico = parseMoeda(seguroValorInput);
                              setSeguroValorInput(valorNumerico > 0 ? formatarMoeda(valorNumerico) : "");
                              setForm((prev) => ({ ...prev, seguroValor: valorNumerico }));
                            }}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Coberturas</Label>
                        <Textarea className="mt-1 min-h-28" placeholder="Coberturas e respectivos limites" value={form.seguroCoberturas || ""} onChange={(e) => setForm((prev) => ({ ...prev, seguroCoberturas: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Observações</Label>
                        <Textarea className="mt-1 min-h-24" value={form.seguroObservacoes || ""} onChange={(e) => setForm((prev) => ({ ...prev, seguroObservacoes: e.target.value }))} />
                      </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t cursor-pointer select-none" onClick={() => setTrasladoMinimizado((prev) => !prev)}>
                  <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                    <Plus className="h-4 w-4 text-indigo-500" />
                    Traslado
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); atualizarDetalhesTraslado(); }}
                        className="gap-2"
                    >
                      <Sparkles className={`w-4 h-4 ${analisandoIA ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setTrasladoMinimizado((prev) => !prev); }}
                        className="gap-2 text-gray-600 hover:text-gray-900"
                    >
                      {trasladoMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      {trasladoMinimizado ? " " : " "}
                    </Button>
                  </div>
                </div>

                {!trasladoMinimizado && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-4">
                      <div>
                        <Label className="text-xs">Tipo de Traslado</Label>
                        <Input
                            className={`mt-1 ${!form.trasladoTipo ? 'bg-yellow-50' : 'bg-white'}`}
                            placeholder="Ex: Aeroporto-Hotel"
                            value={form.trasladoTipo || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, trasladoTipo: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Veículo/Empresa</Label>
                        <Input
                            className={`mt-1 ${!form.trasladoVeiculoEmpresa ? 'bg-yellow-50' : 'bg-white'}`}
                            placeholder="Ex: Shuttle Regular XYZ"
                            value={form.trasladoVeiculoEmpresa || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, trasladoVeiculoEmpresa: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Data do Traslado</Label>
                        <Input
                            type="date"
                            className={`mt-1 ${!form.trasladoData ? 'bg-yellow-50' : 'bg-white'}`}
                            value={form.trasladoData || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, trasladoData: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Horário do Traslado</Label>
                        <Input
                            type="time"
                            className={`mt-1 ${!form.trasladoHorario ? 'bg-yellow-50' : 'bg-white'}`}
                            value={form.trasladoHorario || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, trasladoHorario: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Local de Partida</Label>
                        <Input
                            className={`mt-1 ${!form.trasladoLocalPartida ? 'bg-yellow-50' : 'bg-white'}`}
                            placeholder="Ex: Aeroporto de Lisboa"
                            value={form.trasladoLocalPartida || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, trasladoLocalPartida: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Local de Chegada</Label>
                        <Input
                            className={`mt-1 ${!form.trasladoLocalChegada ? 'bg-yellow-50' : 'bg-white'}`}
                            placeholder="Ex: Hotel Ibis Lisboa"
                            value={form.trasladoLocalChegada || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, trasladoLocalChegada: e.target.value }))}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs">Observações do Traslado</Label>
                        <Textarea
                            className={`mt-1 min-h-20 ${!form.trasladoObservacoes ? 'bg-yellow-50' : 'bg-white'}`}
                            placeholder="Ex: regular, privativo, ponto de encontro"
                            value={form.trasladoObservacoes || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, trasladoObservacoes: e.target.value }))}
                        />
                      </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t cursor-pointer select-none" onClick={() => setIngressoMinimizado((prev) => !prev)}>
                  <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                    <Plus className="h-4 w-4 text-indigo-500" />
                    Ingresso
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); atualizarDetalhesIngresso(); }}
                        className="gap-2"
                    >
                      <Sparkles className={`w-4 h-4 ${analisandoIA ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setIngressoMinimizado((prev) => !prev); }}
                        className="gap-2 text-gray-600 hover:text-gray-900"
                    >
                      {ingressoMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      {ingressoMinimizado ? " " : " "}
                    </Button>
                  </div>
                </div>

                {!ingressoMinimizado && (
                  <div className="mt-4 space-y-4">
                    {/* Lista de atrações/ingressos */}
                    {(form.ingressos && form.ingressos.length > 0 ? form.ingressos : []).map((item, idx) => (
                      <div key={idx} className="border rounded-lg p-3 bg-gray-50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-indigo-700">
                            Atração / Ingresso {form.ingressos!.length > 1 ? `#${idx + 1}` : ""}
                          </span>
                          <AlertDialog
                            open={ingressoParaExcluir === idx}
                            onOpenChange={(open) => !open && setIngressoParaExcluir(null)}
                          >
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setIngressoParaExcluir(idx)}
                                className="rounded p-1 text-red-400 hover:text-red-600 hover:bg-red-50"
                                title="Remover atração"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover atração/ingresso</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {item.nomeAtracao
                                    ? `Tem certeza que deseja remover "${item.nomeAtracao}"?`
                                    : "Tem certeza que deseja remover esta atração/ingresso?"}
                                  {" "}Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setIngressoParaExcluir(null)}>
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() => {
                                    const nova = (form.ingressos || []).filter((_, i) => i !== idx);
                                    const primeiro = nova[0];
                                    setForm((prev) => ({
                                      ...prev,
                                      ingressos: nova,
                                      ingressoNomeAtracao: primeiro?.nomeAtracao ?? "",
                                      ingressoData: primeiro?.data ?? "",
                                      ingressoHorario: primeiro?.horario ?? "",
                                      ingressoQuantidade: primeiro?.quantidade ?? "",
                                      ingressoObservacoes: primeiro?.observacoes ?? "",
                                    }));
                                    setIngressoParaExcluir(null);
                                  }}
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <Label className="text-xs">Nome da Atração/Ingresso</Label>
                            <Input
                              className={`mt-1 ${!item.nomeAtracao ? "bg-yellow-50" : "bg-white"}`}
                              placeholder="Ex: Torre Eiffel - Acesso ao topo"
                              value={item.nomeAtracao}
                              onChange={(e) => {
                                const nova = (form.ingressos || []).map((it, i) =>
                                  i === idx ? { ...it, nomeAtracao: e.target.value } : it
                                );
                                setForm((prev) => ({
                                  ...prev,
                                  ingressos: nova,
                                  ...(idx === 0 ? { ingressoNomeAtracao: e.target.value } : {}),
                                }));
                              }}
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Data do Ingresso</Label>
                            <Input
                              type="date"
                              className={`mt-1 ${!item.data ? "bg-yellow-50" : "bg-white"}`}
                              value={item.data}
                              onChange={(e) => {
                                const nova = (form.ingressos || []).map((it, i) =>
                                  i === idx ? { ...it, data: e.target.value } : it
                                );
                                setForm((prev) => ({
                                  ...prev,
                                  ingressos: nova,
                                  ...(idx === 0 ? { ingressoData: e.target.value } : {}),
                                }));
                              }}
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Horário do Ingresso</Label>
                            <Input
                              type="time"
                              className={`mt-1 ${!item.horario ? "bg-yellow-50" : "bg-white"}`}
                              value={item.horario}
                              onChange={(e) => {
                                const nova = (form.ingressos || []).map((it, i) =>
                                  i === idx ? { ...it, horario: e.target.value } : it
                                );
                                setForm((prev) => ({
                                  ...prev,
                                  ingressos: nova,
                                  ...(idx === 0 ? { ingressoHorario: e.target.value } : {}),
                                }));
                              }}
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Quantidade de Ingressos</Label>
                            <Input
                              className={`mt-1 ${!item.quantidade ? "bg-yellow-50" : "bg-white"}`}
                              placeholder="Ex: 2"
                              value={item.quantidade}
                              onChange={(e) => {
                                const nova = (form.ingressos || []).map((it, i) =>
                                  i === idx ? { ...it, quantidade: e.target.value } : it
                                );
                                setForm((prev) => ({
                                  ...prev,
                                  ingressos: nova,
                                  ...(idx === 0 ? { ingressoQuantidade: e.target.value } : {}),
                                }));
                              }}
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <Label className="text-xs">Observações do Ingresso</Label>
                            <Textarea
                              className={`mt-1 min-h-16 ${!item.observacoes ? "bg-yellow-50" : "bg-white"}`}
                              placeholder="Ex: categoria do ingresso, se inclui guia"
                              value={item.observacoes}
                              onChange={(e) => {
                                const nova = (form.ingressos || []).map((it, i) =>
                                  i === idx ? { ...it, observacoes: e.target.value } : it
                                );
                                setForm((prev) => ({
                                  ...prev,
                                  ingressos: nova,
                                  ...(idx === 0 ? { ingressoObservacoes: e.target.value } : {}),
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Botão para adicionar nova atração manualmente */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-dashed text-indigo-600 hover:text-indigo-800 hover:border-indigo-400"
                      onClick={() => {
                        const novoItem: IngressoItem = { nomeAtracao: "", data: "", horario: "", quantidade: "", observacoes: "" };
                        setForm((prev) => ({ ...prev, ingressos: [...(prev.ingressos || []), novoItem] }));
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Atração / Ingresso
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t cursor-pointer select-none" onClick={() => setResumoMinimizado((prev) => !prev)}>
                  <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    Resumo
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); atualizarResumoPacote(); }}
                        className="gap-2"
                    >
                      <Sparkles className={`w-4 h-4 ${analisandoIA ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setResumoMinimizado((prev) => !prev); }}
                        className="h-8 px-2 text-gray-600"
                    >
                      {resumoMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {!resumoMinimizado && (
                  <div className="mt-3">
                    <Textarea
                        className={`mt-1 min-h-24 ${!form.descricao ? 'bg-yellow-50' : 'bg-white'}`}
                        placeholder="Ex: Voo pela Latam de São Paulo para Paris em 15/07/2026. Hospedagem no Hotel Le Marais, de 15/07/2026 a 20/07/2026 (5 noites). Traslado privativo do aeroporto até o hotel. Ingresso para o Museu do Louvre (2)."
                        value={form.descricao || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
                    />
                  </div>
                )}

                {erro && <p className="mt-3 text-xs text-red-500">{erro}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" onClick={salvarPacote} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {editandoId !== null ? "Salvar voucher" : "Adicionar voucher"}
                  </Button>
                </div>
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
                          {pacote.hospedagemValor && ` - R$ ${pacote.hospedagemValor}`}
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
                    {/* Exibe todos os ingressos do array; fallback para campo legado */}
                    {((pacote.ingressos && pacote.ingressos.length > 0)
                      ? pacote.ingressos
                      : pacote.ingressoNomeAtracao
                        ? [{ nomeAtracao: pacote.ingressoNomeAtracao, quantidade: pacote.ingressoQuantidade || "", data: pacote.ingressoData || "", horario: pacote.ingressoHorario || "", observacoes: "" }]
                        : []
                    ).map((ing, i) => (
                      <p key={i} className="text-xs text-gray-500 mt-0.5">
                        🎟 {ing.nomeAtracao}
                        {ing.quantidade ? ` (${ing.quantidade})` : ""}
                        {ing.data ? ` — ${ing.data}` : ""}
                        {ing.horario ? ` ${ing.horario}` : ""}
                      </p>
                    ))}
                    {pacote.descricao && (
                        <p className="text-xs text-gray-600 mt-2 italic">
                          "{pacote.descricao}"
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
                    <AlertDialog open={voucherParaExcluir === pacote.id} onOpenChange={(open) => !open && setVoucherParaExcluir(null)}>
                      <AlertDialogTrigger asChild>
                        <button
                            type="button"
                            onClick={() => setVoucherParaExcluir(pacote.id)}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50"
                            title="Remover pacote"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja realmente excluir o Voucher {index + 1} ({pacote.operador || "Sem operador"})? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removerPacote(pacote.id)} className="bg-red-600 hover:bg-red-700">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
          ))}
        </div>
      </div>
  );
}
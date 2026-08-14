import { useParams } from "react-router";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Share2, X, Instagram, Mail, MessageCircle, Car, MapPin, Globe,
  Phone, Mail as MailIcon, Calendar, Bed, Star, Coffee,
  ExternalLink, ChevronLeft, ChevronRight, ChevronDown, ChevronUp
} from "lucide-react";
import { JSX, useEffect, useRef, useState } from "react";
import { listarFuncionarios, type Funcionario } from "../data/funcionariosApi";
import { buscarOrcamentoPublico } from "../data/orcamentosApi";
import {
  obterFuncionariosDoCache,
  obterRoteiroDoCache,
  prepararRoteiroSemAnexos,
  ROTEIRO_REFRESH_INTERVAL_MS,
  salvarFuncionariosNoCache,
  salvarRoteiroNoCache,
} from "../data/roteiroCache";
import { gerarResumoPacote } from "./PacotesForm";

const COR_PRINCIPAL = "#0a0534";
const COR_DESTAQUE = "#e07b20";

function RoteiroReferenceIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" aria-hidden="true" fill="currentColor">
      <path d="M25.57,48.61h-1.02c-.48-.2-1-.33-1.43-.65-1.35-1-3.59-3.57-4.81-4.9-4.56-4.99-10.38-12.42-12.04-19.04l-.49-2.7c.03-.64-.04-1.3,0-1.94C6.88,1.93,28.96-5.3,39.99,8.41c9.51,11.82,1.17,24.53-7.25,33.81-1.51,1.66-3.49,3.83-5.18,5.27-.62.53-1.2.87-1.99,1.11ZM32.95,18.77c0-4.38-3.55-7.94-7.93-7.94s-7.93,3.55-7.93,7.94,3.55,7.94,7.93,7.94,7.93-3.55,7.93-7.94Z" />
    </svg>
  );
}

function DayByDayReferenceIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" aria-hidden="true" fill="currentColor">
      <path d="M36.86,5.77c0,1.08,0,2.15,0,3.23,0,1.3-.98,2.31-2.24,2.3-1.24,0-2.21-.99-2.21-2.28,0-2.19,0-4.38,0-6.57,0-1.29.96-2.27,2.21-2.27,1.25,0,2.22.97,2.23,2.25,0,.56,0,1.11,0,1.67,0,.56,0,1.11,0,1.67Z" />
      <path d="M17.58,5.75c0,1.09,0,2.18,0,3.27,0,1.29-.97,2.28-2.21,2.28-1.24,0-2.23-.99-2.24-2.26,0-2.2-.01-4.41,0-6.61,0-1.29.98-2.25,2.23-2.25,1.25,0,2.2.97,2.21,2.27,0,1.1,0,2.2,0,3.3Z" />
      <path d="M10.57,41.65v-6.62h6.63v6.62h-6.63Z" />
      <path d="M10.57,23.91h6.61v6.61h-6.61v-6.61Z" />
      <path d="M28.3,41.65h-6.6v-6.63h6.6v6.63Z" />
      <path d="M39.43,35.02v6.62h-6.62v-6.62h6.62Z" />
      <path d="M21.69,23.91h6.61v6.61h-6.61v-6.61Z" />
      <path d="M39.43,23.91v6.61h-6.62v-6.61h6.62Z" />
      <path d="M11.66,3.91c0,1.11,0,2.21,0,3.31,0,.82-.04,1.64.07,2.44.26,1.87,1.99,3.23,3.83,3.1,1.97-.14,3.48-1.69,3.5-3.64.02-1.59,0-3.19,0-4.78,0-.14,0-.28,0-.45h11.87c0,.17,0,.31,0,.45,0,1.56,0,3.11,0,4.67,0,2.11,1.63,3.76,3.7,3.76,2.05,0,3.7-1.67,3.7-3.76,0-1.56,0-3.11,0-4.67,0-.14,0-.28,0-.41.05-.03.07-.05.1-.05,1.68.01,3.38-.07,5.05.05,2.77.2,4.86,2.71,4.87,5.66,0,4.01,0,8.01,0,12.02,0,7.49,0,14.99,0,22.48,0,2.78-1.77,5.02-4.42,5.59-.39.08-.8.12-1.2.12-11.25,0-22.51,0-33.76,0-.96,0-1.94.05-2.87-.12-2.68-.51-4.46-2.78-4.46-5.58,0-4.6,0-9.2,0-13.81,0-6.88,0-13.77,0-20.65,0-2.75,1.65-4.95,4.22-5.6.42-.11.87-.16,1.31-.17,1.4-.02,2.8,0,4.2,0,.09,0,.18.02.29.03ZM3.88,18.08c0,.18,0,.31,0,.43,0,8.52,0,17.04,0,25.55,0,2.12,1.41,3.52,3.54,3.52,11.73,0,23.47,0,35.2,0,2.08,0,3.5-1.41,3.5-3.48,0-8.53,0-17.06,0-25.59v-.43H3.88Z" />
    </svg>
  );
}

function VooReferenceIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" aria-hidden="true" fill="currentColor">
      <path d="M16.73,46.52l5.55-3.76-1.6-16.3-16.9,6.15.39-5.17,4.92-3.5c0-1.81,0-5.3,1.65-6.47,1.86-1.32,2.94,1.63,3.28,2.99l6.38-4.46c.76-3.29.76-6.75,1.33-10.08.29-1.72,1.03-4.94,3.27-4.94s2.98,3.21,3.27,4.94c.57,3.33.58,6.8,1.33,10.08l6.38,4.46c.34-1.36,1.42-4.31,3.28-2.99,1.66,1.17,1.66,4.66,1.65,6.47l4.92,3.5.39,5.17-16.9-6.15-1.6,16.3,5.55,3.76v2.49h-16.54v-2.49Z" />
    </svg>
  );
}

function HospedagemReferenceIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7.1A4 4 0 0 1 22 14.56V21h-2v-2H4v2H2v-6.44A4 4 0 0 1 4 11.1V4zm2 0v6h5V8a2 2 0 0 0-2-2H6zm7 6h5V4h-5v6zm-7 2a2 2 0 0 0-2 2v3h16v-3a2 2 0 0 0-2-2H6z" />
    </svg>
  );
}

function TransportesReferenceIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM6 6h12v5H6V6z" />
    </svg>
  );
}

function ExperienciasReferenceIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4a2 2 0 0 1 0 4v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 1 0-4z" />
    </svg>
  );
}

function RestaurantesReferenceIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M4 2h1.15v7h.85V2h1.15v7H8V2h1.15v7H10V2h1.15v7.8c0 1.55-.9 2.88-2.15 3.5V22H6.15v-8.7C4.9 12.68 4 11.35 4 9.8V2z" />
      <path d="M17.8 2c1.45 1.1 2.2 3.7 2.2 6.6V22h-2.6v-7.4h-2.2c-.66 0-1.2-.54-1.2-1.2V8.6C14 5.7 15.3 2.85 17.8 2z" />
    </svg>
  );
}

function OrcamentoReferenceIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M6 2h12a1 1 0 0 1 1 1v19l-3-2-3 2-3-2-3 2-3-2V3a1 1 0 0 1 1-1zm3 6h6V6H9v2zm0 4h6v-2H9v2zm0 4h4v-2H9v2z" />
    </svg>
  );
}

function TituloSecao({ titulo, Icone = RoteiroReferenceIcon }: { titulo: string; Icone?: ({ className }: { className?: string }) => JSX.Element }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-semibold text-white sm:text-lg">
      <Icone className="h-7 w-7" />
      {titulo}
    </h2>
  );
}

function gerarSlugCliente(nome: string): string {
  return String(nome || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface Voo {
  id: number;
  companhia: string;
  numero: string;
  tipoTrecho?: "IDA" | "VOLTA";
  conexao?: number | null;
  data: string;
  origem: string;
  destino: string;
  partida: string;
  chegada: string;
  duracao: string;
  documento?: string | null;
  documentoTipo?: "pdf" | "imagem" | null;
}

interface ItemOrc {
  id: number;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  desconto: number;
}

interface Pacote {
  id: number;
  operador: string;
  link: string;
  descricao: string;
  foto?: string | null;
  fotoNome?: string;
  valor?: number;
  // Extended fields from PacotesForm
  ciaAerea?: string;
  origem?: string;
  destino?: string;
  reserva?: string;
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
}

interface Orcamento {
  publicToken: string;
  id: number;
  numero: string;
  cliente: string;
  email: string;
  passageiros?: string[];
  destino?: string;
  agenteViagem?: string;
  status: "Rascunho" | "Enviado" | "Aprovado" | "Rejeitado" | "Cancelado";
  dataCriacao: string;
  dataValidade: string;
  observacoes: string;
  itens: ItemOrc[];
  pacotes?: Pacote[];
  voos?: Voo[];
  hospedagem?: any[];
  roteiro?: string;
  dayByDay?: any[];
  transporte?: any[];
  restaurante?: any[];
  experiencias?: any[];
  seguro?: any[];
}

interface DiaRoteiro {
  id: number;
  titulo?: string;
  data?: string;
  atividades?: Array<{
    id: number;
    hora?: string;
    descricao?: string;
    tipo?: string;
  }>;
}

interface DiaRoteiroExibicao {
  id: number;
  titulo: string;
  data?: string;
  atividades: Array<{
    id: number;
    hora?: string;
    descricao: string;
    tipo?: string;
  }>;
}

interface BlocoRoteiro {
  id: number;
  titulo: string;
  linhas: string[];
}

interface SecaoRoteiroFinal {
  titulo: string;
  linhas: string[];
}

function limparLinhaRoteiro(linha: string): string {
  return String(linha || '')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/^#{1,6}\s*/g, '')
    .trim();
}

function normalizarTextoRoteiro(texto: string): string {
  return String(texto || '')
    .replace(/\r\n/g, '\n')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/(\d+\))\s+/g, '\n$1 ')
    .replace(/\s+(Dia\s+\d+[:\-])/gi, '\n$1')
    .replace(/\s+(Dia a dia sugerido|Resumo inspirador)/gi, '\n\n$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizarFotosHospedagem(hosp: any): string[] {
  const fotosNovas = Array.isArray(hosp?.fotosHospedagem) ? hosp.fotosHospedagem : [];
  const fotoAntiga = typeof hosp?.fotoHospedagem === 'string' && hosp.fotoHospedagem.trim()
    ? [hosp.fotoHospedagem.trim()]
    : [];

  return Array.from(
    new Set(
      [...fotosNovas, ...fotoAntiga]
        .map((foto) => String(foto || '').trim())
        .filter(Boolean)
    )
  );
}

function isTituloNumerado(linha: string): boolean {
  const texto = limparLinhaRoteiro(linha).toLowerCase();
  return /^\d+\)\s+/.test(texto) && (
    texto.includes('título') ||
    texto.includes('resumo') ||
    texto.includes('dia') ||
    texto.includes('destaques') ||
    texto.includes('dicas')
  );
}

function isSubtituloRoteiro(linha: string): boolean {
  const texto = limparLinhaRoteiro(linha).toLowerCase();
  return (
    texto.startsWith('roteiro de ') ||
    texto.startsWith('dia ') ||
    texto.includes('dia a dia') ||
    texto.includes('destaques') ||
    texto.includes('dicas práticas') ||
    texto.includes('resumo') ||
    /:$/.test(texto)
  );
}

function isLinhaDiaRoteiro(linha: string): boolean {
  const texto = limparLinhaRoteiro(linha);
  return /^dia\s+\d+\b/i.test(texto);
}

function getSubtituloClass(linha: string): string {
  const texto = limparLinhaRoteiro(linha).toLowerCase();

  if (isLinhaDiaRoteiro(texto)) return 'text-[#e07b20]';
  if (texto.includes('resumo')) return 'text-[#e07b20]';
  if (texto.includes('dicas práticas')) return 'text-[#e07b20]';

  return 'text-[#0a0534]';
}

function extrairDiasDoRoteiro(texto: string): DiaRoteiroExibicao[] {
  const linhas = normalizarTextoRoteiro(texto)
    .split('\n')
    .map((linha) => String(linha || '').trim());

  const dias: DiaRoteiroExibicao[] = [];
  let diaAtual: DiaRoteiroExibicao | null = null;

  const criarDia = (titulo: string) => {
    diaAtual = {
      id: dias.length + 1,
      titulo,
      atividades: [],
    };

    dias.push(diaAtual);
  };

  const deveIgnorarLinha = (linha: string) => {
    const texto = limparLinhaRoteiro(linha).toLowerCase();
    return texto === 'destaques imperdíveis' || texto === 'dicas práticas';
  };

  const iniciarIgnorandoSecao = (linha: string) => {
    const texto = limparLinhaRoteiro(linha).toLowerCase();
    return texto === 'destaques imperdíveis' || texto === 'dicas práticas';
  };

  let ignorandoSecao = false;

  for (const linha of linhas) {
    const textoLimpo = limparLinhaRoteiro(linha);
    if (!textoLimpo) {
      ignorandoSecao = false;
      continue;
    }

    if (deveIgnorarLinha(textoLimpo)) {
      ignorandoSecao = true;
      continue;
    }

    if (ignorandoSecao) {
      const ehNovoDia = /^dia\s+\d+\b/i.test(textoLimpo) || /^(\d+)\)\s*(.+)$/i.test(textoLimpo);
      const ehNovaSecaoPrincipal = /^(roteiro de |dia a dia sugerido|resumo inspirador)/i.test(textoLimpo);

      if (!ehNovoDia && !ehNovaSecaoPrincipal) {
        continue;
      }

      ignorandoSecao = false;
    }

    if (iniciarIgnorandoSecao(textoLimpo)) {
      ignorandoSecao = true;
      continue;
    }

    const matchDia = textoLimpo.match(/^(dia\s+\d+)(?:\s*[-:–—]\s*(.+))?/i);
    if (matchDia) {
      const titulo = matchDia[2]?.trim()
        ? `${matchDia[1].replace(/\s+/g, ' ').replace(/^dia/i, 'Dia')} - ${matchDia[2].trim()}`
        : matchDia[1].replace(/\s+/g, ' ').replace(/^dia/i, 'Dia');
      criarDia(titulo);
      continue;
    }

    const matchNumerado = textoLimpo.match(/^(\d+)\)\s*(.+)$/);
    if (matchNumerado && /(dia|roteiro|itiner|programa)/i.test(matchNumerado[2])) {
      criarDia(`Dia ${matchNumerado[1]} - ${matchNumerado[2].trim()}`);
      continue;
    }

    if (diaAtual) {
      const descricao = textoLimpo.replace(/^[-*•]\s+/, '').trim();
      if (descricao) {
        diaAtual.atividades.push({
          id: Date.now() + diaAtual.atividades.length,
          descricao,
        });
      }
    }
  }

  return dias;
}

function extrairBlocosRoteiro(texto: string): { cabecalho: string; blocos: BlocoRoteiro[] } {
  const linhas = normalizarTextoRoteiro(texto)
    .split('\n')
    .map((linha) => String(linha || '').trim())
    .filter(Boolean);

  const cabecalho = linhas.find((linha) => !/^dia\s+\d+\b/i.test(linha)) || '';
  const blocos: BlocoRoteiro[] = [];
  let blocoAtual: BlocoRoteiro | null = null;

  for (const linha of linhas) {
    const textoLimpo = limparLinhaRoteiro(linha);
    if (!textoLimpo) continue;

    if (textoLimpo === cabecalho) {
      continue;
    }

    const matchDia = textoLimpo.match(/^(dia\s+\d+)(?:\s*[-:–—]\s*(.+))?/i);
    if (matchDia) {
      const titulo = matchDia[2]?.trim()
        ? `${matchDia[1].replace(/\s+/g, ' ').replace(/^dia/i, 'Dia')} - ${matchDia[2].trim()}`
        : matchDia[1].replace(/\s+/g, ' ').replace(/^dia/i, 'Dia');

      blocoAtual = {
        id: blocos.length + 1,
        titulo,
        linhas: [],
      };

      blocos.push(blocoAtual);
      continue;
    }

    if (!blocoAtual) {
      continue;
    }

    const linhaConteudo = textoLimpo.replace(/^[-*•]\s+/, '').trim();
    if (linhaConteudo) {
      blocoAtual.linhas.push(linhaConteudo);
    }
  }

  return { cabecalho, blocos };
}

function separarSecoesUltimoDia(linhas: string[]): {
  linhasPrincipais: string[];
  secoesFinais: SecaoRoteiroFinal[];
} {
  const linhasPrincipais: string[] = [];
  const secoesFinais: SecaoRoteiroFinal[] = [];
  let secaoAtual: SecaoRoteiroFinal | null = null;

  for (const linhaOriginal of linhas) {
    const linha = limparLinhaRoteiro(linhaOriginal);
    const titulo = linha.toLowerCase();

    if (!linha) {
      continue;
    }

    if (titulo === 'destaques imperdíveis') {
      secaoAtual = { titulo: 'Destaques imperdíveis', linhas: [] };
      secoesFinais.push(secaoAtual);
      continue;
    }

    if (titulo === 'dicas práticas') {
      secaoAtual = secoesFinais.find((secao) => secao.titulo === 'Dicas práticas') || { titulo: 'Dicas práticas', linhas: [] };
      if (!secoesFinais.includes(secaoAtual)) {
        secoesFinais.push(secaoAtual);
      }
      continue;
    }

    if (secaoAtual) {
      secaoAtual.linhas.push(linha);
      continue;
    }

    linhasPrincipais.push(linha);
  }

  return { linhasPrincipais, secoesFinais };
}

function RenderRoteiroTexto({ texto }: { texto: string }) {
  const { cabecalho, blocos } = extrairBlocosRoteiro(texto);
  const linhasSoltas = normalizarTextoRoteiro(texto)
    .split('\n')
    .map((linha) => String(linha || '').trim())
    .filter(Boolean);

  return (
    <div className="rounded-[28px] bg-[#0b0635] px-4 py-4 text-white shadow-[0_14px_36px_rgba(5,2,24,0.35)] sm:px-5 sm:py-5" style={{ fontFamily: "Montserrat, sans-serif" }}>
      {cabecalho && (
        <p className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.18em] text-[#e07b20]">
          {cabecalho}
        </p>
      )}

      {blocos.length > 0 ? (
        <div className="relative pl-5">
          <div className="absolute left-2.5 top-1 bottom-1 w-px bg-white/15" aria-hidden="true" />

          <div className="space-y-5">
            {blocos.map((bloco, index) => {
              const ultimoDia = index === blocos.length - 1;
              const { linhasPrincipais, secoesFinais } = ultimoDia
                ? separarSecoesUltimoDia(bloco.linhas)
                : { linhasPrincipais: bloco.linhas, secoesFinais: [] as SecaoRoteiroFinal[] };

              return (
                <div key={bloco.id} className="relative">
                  <span className="absolute -left-[2px] top-6 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#ff8b1f] bg-[#0b0635] shadow-[0_0_0_4px_rgba(255,139,31,0.15)]" aria-hidden="true" />

                  <div className="rounded-[22px] bg-[#1c1848] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-5 sm:py-5">
                    <p className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-[#ff8b1f]">
                      {bloco.titulo}
                    </p>

                    <div className="mt-2 space-y-2">
                      {linhasPrincipais.map((linha, idx) => (
                        <p key={`${bloco.id}-${idx}`} className={`text-[14px] leading-7 text-white/82 ${idx === 0 ? 'font-semibold text-white' : ''}`}>
                          {linha}
                        </p>
                      ))}
                    </div>
                  </div>

                  {ultimoDia && secoesFinais.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {secoesFinais.map((secao) => (
                        <div key={`${bloco.id}-${secao.titulo}`} className="rounded-[22px] bg-[#1c1848] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-5 sm:py-5">
                          <p className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-[#ff8b1f]">
                            {secao.titulo}
                          </p>
                          <div className="mt-2 space-y-2">
                            {secao.linhas.map((linha, idx) => (
                              <p key={`${secao.titulo}-${idx}`} className={`text-[14px] leading-7 text-white/82 ${idx === 0 ? 'font-semibold text-white' : ''}`}>
                                {linha}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-[22px] bg-[#1c1848] px-4 py-5 text-white/80">
          {linhasSoltas.map((linha, index) => (
            <p key={`roteiro-line-${index}`} className={index === 0 ? 'text-[14px] font-semibold uppercase tracking-[0.18em] text-[#ff8b1f]' : 'mt-2 text-[14px] leading-7 text-white/82'}>
              {linha}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function obterDestinoPrincipal(orc: Orcamento): string {
  const destinoVoo =
    orc.voos?.find((item) => typeof item?.destino === "string" && item.destino.trim())?.destino || "";

  if (destinoVoo) {
    return destinoVoo;
  }

  const destinoPacoteVoo = (orc.pacotes || []).find((p: any) => p?.destinoIda?.trim() || p?.destino?.trim())?.destinoIda || 
                           (orc.pacotes || []).find((p: any) => p?.destino?.trim())?.destino || "";

  if (destinoPacoteVoo) {
    return destinoPacoteVoo;
  }

  const destinoHospedagem =
    orc.hospedagem?.find((item) => typeof item?.destino === "string" && item.destino.trim())?.destino ||
    orc.hospedagem?.find((item) => typeof item?.local === "string" && item.local.trim())?.local ||
    orc.hospedagem?.find((item) => typeof item?.cidade === "string" && item.cidade.trim())?.cidade ||
    "";

  if (destinoHospedagem) {
    return destinoHospedagem;
  }

  const destinoPacoteHospedagem = (orc.pacotes || []).find((p: any) => p?.hospedagemNome?.trim())?.hospedagemNome || "";

  if (destinoPacoteHospedagem) {
    return destinoPacoteHospedagem;
  }

  const destinoTransporte =
    orc.transporte?.find((item) => typeof item?.destino === "string" && item.destino.trim())?.destino || "";

  if (destinoTransporte) {
    return destinoTransporte;
  }

  const destinoTopLevel = typeof orc.destino === "string" ? orc.destino.trim() : "";
  if (destinoTopLevel) {
    return destinoTopLevel;
  }

  // Tenta extrair do texto da descrição do pacote
  const textoPacote = (orc.pacotes || []).map((p: any) => p.descricao || '').join(' ');
  const matchDestino = textoPacote.match(/(?:para|em)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s+[emem]\s+\d{2}\/|\s*\(|\s*\.)/i);
  if (matchDestino) {
    return matchDestino[1].trim();
  }

  return "Destino da viagem";
}

function formatarPeriodo(checkin: string, checkout: string): string {
  if (!checkin || !checkout) return "";

  const inicio = new Date(checkin + 'T00:00:00');
  const fim = new Date(checkout + 'T00:00:00');

  const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
  const formatadorMesAno = new Intl.DateTimeFormat('pt-BR', options);

  const diaInicio = inicio.getUTCDate();
  const diaFim = fim.getUTCDate();

  const mesAnoInicio = formatadorMesAno.format(inicio);
  const mesAnoFim = formatadorMesAno.format(fim);

  if (mesAnoInicio === mesAnoFim) {
    return `${diaInicio} a ${diaFim} de ${mesAnoInicio}`;
  } else {
    const optionsInicio: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    const formatadorInicio = new Intl.DateTimeFormat('pt-BR', optionsInicio);
    return `${formatadorInicio.format(inicio)} a ${diaFim} de ${mesAnoFim}`;
  }
}

function formatarMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataCurta(data?: string | null) {
  if (!data) return "Nao informado";
  const date = new Date(`${data}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Nao informado";
  return date.toLocaleDateString("pt-BR");
}

function formatarDataVooCurta(data?: string | null) {
  if (!data) return "Nao informado";

  const date = new Date(`${data}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Nao informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

function Countdown({ targetDate, checkoutDate }: { targetDate: string; checkoutDate?: string | null }) {
  const calcularDiferenca = (referencia: number) => {
    const alvo = +new Date(targetDate + 'T00:00:00');
    const diff = Math.abs(referencia - alvo);
    return {
      Meses: Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44)),
      Dias: Math.floor((diff / (1000 * 60 * 60 * 24)) % 30.44),
      Horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
      Minutos: Math.floor((diff / 1000 / 60) % 60),
      Segundos: Math.floor((diff / 1000) % 60),
    };
  };

  const [agora, setAgora] = useState(() => +new Date());

  useEffect(() => {
    const timer = setInterval(() => setAgora(+new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const alvo = +new Date(targetDate + 'T00:00:00');
  const jaPassou = alvo < agora;
  const timeLeft = calcularDiferenca(agora);
  const timerComponents = Object.entries(timeLeft);

  if (jaPassou) {
    const checkinFormatado = new Date(targetDate + 'T00:00:00').toLocaleDateString('pt-BR');
    const checkoutFormatado = checkoutDate
      ? new Date(checkoutDate + 'T00:00:00').toLocaleDateString('pt-BR')
      : null;
    return (
      <div className="py-2 text-center">
        <p className="text-sm font-semibold text-white/90">
          Viagem realizada em {checkinFormatado}
          {checkoutFormatado ? ` até ${checkoutFormatado}` : ''}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-center text-sm font-semibold text-white/80">
        Falta para sua viagem:
      </p>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {timerComponents.map(([interval, value]) => (
          <div key={interval} className="min-w-0 text-center">
            <div className="rounded-xl bg-white/12 px-1 py-2 text-lg font-bold text-white shadow-md sm:py-3 sm:text-2xl">
              {String(value).padStart(2, '0')}
            </div>
            <div className="mt-1 truncate text-[10px] font-medium text-white/70 sm:text-xs">{interval}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

export default function RoteiroOrcamento() {
  const { numero } = useParams<{ numero: string }>();
  const [orc, setOrc] = useState<Orcamento | null>(null);
  const [itemAtivo, setItemAtivo] = useState<string>("pacotes");
  const [diaAtivoId, setDiaAtivoId] = useState<number | null>(null);
  const [carrosselHospedagemAtivo, setCarrosselHospedagemAtivo] = useState<Record<number, number>>({});
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [politicaCancelamentoMinimizada, setPoliticaCancelamentoMinimizada] = useState<Record<number, boolean>>({});
  const carrosselHospedagemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    let active = true;

    async function carregarOrcamento() {
      if (!numero) {
        if (active) {
          setOrc(null);
          setErroCarregamento("Número do orçamento não informado.");
          setCarregando(false);
        }
        return;
      }

      setCarregando(true);
      setErroCarregamento(null);

      let carregouDoCache = false;
      const cached = await obterRoteiroDoCache(numero);
      if (cached) {
        if (active) {
          setOrc(cached.value);
          setCarregando(false);
        }
        carregouDoCache = true;
        const cacheAtual = Date.now() - cached.savedAt < ROTEIRO_REFRESH_INTERVAL_MS;
        if (!navigator.onLine || (cacheAtual && cached.complete !== false)) {
          return;
        }
      }

      // Mantém compatibilidade com roteiros abertos antes da adoção do IndexedDB.
      let carregouDoLocal = false;
      const localImediato = localStorage.getItem(`orc_${numero}`);
      if (localImediato) {
        try {
          const parsed = prepararRoteiroSemAnexos(JSON.parse(localImediato));
          localStorage.setItem(`orc_${numero}`, JSON.stringify(parsed));
          await salvarRoteiroNoCache(parsed, false);
          if (active) {
            setOrc(parsed);
            setCarregando(false);
            carregouDoLocal = true;
          }
          // Continua para tentar atualizar via API em background
        } catch {
          // segue para carregar da API
        }
      }

      try {
        const orcamentoApi = await buscarOrcamentoPublico(numero);
        await salvarRoteiroNoCache(orcamentoApi);
        if (active) {
          // @ts-ignore
          setOrc(orcamentoApi);
          setCarregando(false);
        }
        return;
      } catch (error) {
        if (carregouDoCache || carregouDoLocal) {
          return;
        }

        // Tenta pelo identificador exato da URL (pode ser publicToken ou numero)
        const stored = localStorage.getItem(`orc_${numero}`);

        if (stored) {
          try {
            const parsed = prepararRoteiroSemAnexos(JSON.parse(stored));
            localStorage.setItem(`orc_${numero}`, JSON.stringify(parsed));
            await salvarRoteiroNoCache(parsed, false);
            if (active) {
              setOrc(parsed);
              setCarregando(false);
            }
            return;
          } catch {
            // segue para tentativa adicional abaixo
          }
        }

        // Varredura no localStorage: quando a URL usa publicToken, o dado pode ter sido
        // gravado com a chave orc_{numero} pelo gerarRoteiro. Procura a entrada cujo
        // publicToken ou numero coincida com o parâmetro recebido.
        const chaveEncontrada = Object.keys(localStorage).find((chave) => {
          if (!chave.startsWith("orc_")) return false;
          try {
            const candidato = JSON.parse(localStorage.getItem(chave) || "");
            return (
              candidato?.publicToken === numero ||
              String(candidato?.numero) === numero
            );
          } catch {
            return false;
          }
        });

        if (chaveEncontrada) {
          try {
            const parsed = prepararRoteiroSemAnexos(
              JSON.parse(localStorage.getItem(chaveEncontrada) || ""),
            );
            localStorage.setItem(chaveEncontrada, JSON.stringify(parsed));
            await salvarRoteiroNoCache(parsed, false);
            if (active) {
              setOrc(parsed);
              setCarregando(false);
            }
            return;
          } catch {
            // segue para o estado de erro abaixo
          }
        }

        if (active) {
          setOrc(null);
          setErroCarregamento(error instanceof Error ? error.message : "Roteiro não disponível no momento.");
          setCarregando(false);
        }
      }
    }

    carregarOrcamento();

    return () => {
      active = false;
    };
  }, [numero]);

  useEffect(() => {
    let mounted = true;

    async function carregarFuncionarios() {
      const funcionariosCache = await obterFuncionariosDoCache();
      if (mounted && funcionariosCache.length > 0) {
        setFuncionarios(funcionariosCache);
      }

      if (!navigator.onLine) {
        return;
      }

      try {
        const lista = await listarFuncionarios();
        await salvarFuncionariosNoCache(lista);
        if (mounted) {
          setFuncionarios(lista);
        }
      } catch {
        if (mounted && funcionariosCache.length === 0) {
          setFuncionarios([]);
        }
      }
    }

    carregarFuncionarios();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (itemAtivo !== "dia-a-dia") {
      return;
    }

    const dias = (orc?.dayByDay && orc.dayByDay.length > 0)
      ? orc.dayByDay.map((dia: any, idx: number) => ({
          id: dia.id ?? idx + 1,
          titulo: String(dia.titulo || `Dia ${idx + 1}`).trim(),
          data: dia.data,
          atividades: Array.isArray(dia.atividades)
            ? dia.atividades.map((atividade: any, atividadeIdx: number) => ({
                id: atividade.id ?? atividadeIdx + 1,
                hora: atividade.hora,
                descricao: String(atividade.descricao || atividade.atividade || '').trim(),
                tipo: atividade.tipo,
              }))
            : [],
        }))
      : extrairDiasDoRoteiro(orc?.roteiro || '');

    if (dias.length === 0) {
      setDiaAtivoId(null);
      return;
    }

    setDiaAtivoId((current) => (current && dias.some((dia) => dia.id === current) ? current : dias[0].id));
  }, [itemAtivo, orc?.dayByDay, orc?.roteiro]);

  if (carregando) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-600">Carregando roteiro...</p>
        </Card>
      </div>
    );
  }

  if (!orc) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-600">{erroCarregamento || "Roteiro não disponível."}</p>
        </Card>
      </div>
    );
  }

    const moverCarrosselHospedagem = (idx: number, direcao: -1 | 1) => {
      const hospedagem = orc?.hospedagem?.[idx];
      const fotos = normalizarFotosHospedagem(hospedagem);

      if (!fotos.length) {
        return;
      }

      const indiceAtual = carrosselHospedagemAtivo[idx] ?? 0;
      const proximoIndice = Math.max(0, Math.min(fotos.length - 1, indiceAtual + direcao));
      const container = carrosselHospedagemRefs.current[idx];
      const slide = container?.querySelectorAll<HTMLElement>("[data-hospedagem-foto]")[proximoIndice];

      setCarrosselHospedagemAtivo((current) => ({
        ...current,
        [idx]: proximoIndice,
      }));

      slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    };

  const handleShareWhatsApp = () => {
    const identificadorRoteiro = orc.publicToken || orc.numero;
    const urlRoteiro = `${window.location.origin}/roteiro/${identificadorRoteiro}`;
    const destinoTexto = obterDestinoPrincipal(orc);
    const message = `Olá! *${orc.cliente}*\nAqui está o *Roteiro* da sua viagem para *${destinoTexto}*.\n\n${urlRoteiro}\n\nDesejamos uma Ótima Viagem!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const destinoPrincipal = obterDestinoPrincipal(orc);

  // Also check pacotes for flight/city info
  const pacoteComVoo = (orc.pacotes || []).find(
    (p: any) => p?.origemIda?.trim() || p?.destinoIda?.trim() || p?.dataIda?.trim()
  );
  const pacoteComHospedagem = (orc.pacotes || []).find(
    (p: any) => p?.hospedagemNome?.trim() || p?.hospedagemCheckin?.trim() || p?.hospedagemCheckout?.trim()
  );

  const possuiVoo = Boolean(pacoteComVoo);
  const possuiHospedagem = Boolean(orc.hospedagem?.length) || Boolean(pacoteComHospedagem);
  const possuiPlanejamentoBase = possuiVoo || possuiHospedagem;

  const fotoPacoteDestaque =
    (orc.pacotes || []).find((item) => typeof item?.foto === "string" && item.foto.trim())?.foto || "";

  // Data de check-in/checkout: primeiro tenta da hospedagem direta, depois dos pacotes
  const dataCheckinHospedagem = orc.hospedagem && orc.hospedagem.length > 0 ? orc.hospedagem[0].checkin : null;
  const dataCheckoutHospedagem = orc.hospedagem && orc.hospedagem.length > 0 ? orc.hospedagem[0].checkout : null;
  const dataCheckinPacote = pacoteComHospedagem?.hospedagemCheckin || null;
  const dataCheckoutPacote = pacoteComHospedagem?.hospedagemCheckout || null;
  const dataCheckinPrincipal = dataCheckinHospedagem || dataCheckinPacote || null;
  const dataCheckoutPrincipal = dataCheckoutHospedagem || dataCheckoutPacote || null;
  console.log('[RoteiroOrcamento] hospedagem raw:', JSON.stringify(orc.hospedagem?.[0] || null));
  console.log('[RoteiroOrcamento] checkin/checkout:', { dataCheckinHospedagem, dataCheckoutHospedagem, dataCheckinPacote, dataCheckoutPacote, dataCheckinPrincipal, dataCheckoutPrincipal });
  // Fallback: busca data em qualquer pacote (dataIda, dataVolta, hospedagemCheckin)
  const pacoteComData = (orc.pacotes || []).find((p: any) => p?.dataIda?.trim() || p?.dataVolta?.trim() || p?.hospedagemCheckin?.trim());
  const dataPacoteFallback = pacoteComData?.dataIda || pacoteComData?.hospedagemCheckin || pacoteComData?.dataVolta || null;
  // Último fallback: tenta extrair uma data do texto da descrição do pacote
  const dataDescricaoFallback = (() => {
    for (const p of (orc.pacotes || [])) {
      const texto = p.descricao || gerarResumoPacote(p as any) || '';
      // Procura por data no formato brasileiro "23/01/2024"
      const matchBr = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (matchBr) {
        const [, dia, mes, ano] = matchBr;
        return `${ano}-${mes}-${dia}`;
      }
      // Procura por data no formato ISO "2024-01-23"
      const matchIso = texto.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (matchIso) {
        return matchIso[0];
      }
    }
    return null;
  })();
  // Debug: log para verificar qual data está sendo usada
  console.log('[RoteiroOrcamento] debug datas:', {
    dataCheckinPrincipal,
    vooData: orc.voos?.[0]?.data,
    pacoteComVooDataIda: pacoteComVoo?.dataIda,
    dataPacoteFallback,
    dataDescricaoFallback,
    pacotesLength: orc.pacotes?.length,
    primeiroPacote: orc.pacotes?.[0] ? {
      dataIda: orc.pacotes[0].dataIda,
      dataVolta: orc.pacotes[0].dataVolta,
      hospedagemCheckin: orc.pacotes[0].hospedagemCheckin,
      descricao: (orc.pacotes[0].descricao || '').substring(0, 200),
    } : null
  });
  const dataViagemPrincipal = dataCheckinPrincipal || dataCheckoutPrincipal || orc.voos?.[0]?.data || pacoteComVoo?.dataIda || dataPacoteFallback || dataDescricaoFallback || null;
  console.log('[RoteiroOrcamento] dataViagemPrincipal final:', dataViagemPrincipal);
  const listaPassageiros = Array.isArray(orc.passageiros)
    ? orc.passageiros.map((nome) => String(nome || "").trim()).filter(Boolean)
    : [];
  const passageirosTexto = listaPassageiros.length > 0 ? listaPassageiros.join(", ") : "Sem passageiros adicionais";
  const agente = orc.agenteViagem
    ? funcionarios.find((funcionario) => funcionario.name === orc.agenteViagem)
    : null;
  const nomeAgente = agente?.name || orc.agenteViagem;
  const saudacaoAgente = String(agente?.saudacoes || "").trim();
  const iniciaisAgente = nomeAgente
    ?.split(" ")
    .map((nome) => nome[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const diasRoteiroExibicao: DiaRoteiroExibicao[] = (orc.dayByDay && orc.dayByDay.length > 0)
    ? orc.dayByDay.map((dia: any, idx: number) => ({
        id: idx + 1,
        titulo: String(dia.titulo || `Dia ${idx + 1}`).trim(),
        data: dia.data,
        atividades: Array.isArray(dia.atividades)
          ? dia.atividades.map((atividade: any, atividadeIdx: number) => ({
              id: atividadeIdx + 1,
              hora: atividade.hora,
              descricao: String(atividade.descricao || atividade.atividade || '').trim(),
              tipo: atividade.tipo,
            }))
          : [],
      }))
    : extrairDiasDoRoteiro(orc.roteiro || '');
  const diaSelecionado = diasRoteiroExibicao.find((dia) => dia.id === diaAtivoId) || diasRoteiroExibicao[0] || null;
  const itensRoteiro = [
    { id: "pacotes", titulo: "Pacotes", icone: OrcamentoReferenceIcon, classe: "bg-[#0a0534] text-white hover:bg-[#140a4d]", disponivel: Boolean(orc.pacotes?.length) },
    { id: "voos", titulo: "Voos", icone: VooReferenceIcon, classe: "bg-[#0a0534] text-white hover:bg-[#140a4d]", disponivel: Boolean(pacoteComVoo) },
    { id: "hospedagem", titulo: "Hospedagens", icone: HospedagemReferenceIcon, classe: "bg-[#0a0534] text-white hover:bg-[#140a4d]", disponivel: possuiHospedagem },
    { id: "roteiro", titulo: "Roteiro", icone: RoteiroReferenceIcon, classe: "bg-[#0a0534] text-white hover:bg-[#140a4d]", disponivel: Boolean(orc.roteiro) },
    { id: "dia-a-dia", titulo: "Day by Day", icone: DayByDayReferenceIcon, classe: "bg-[#0a0534] text-white hover:bg-[#140a4d]", disponivel: true },
    { id: "transporte", titulo: "Transportes", icone: TransportesReferenceIcon, classe: "bg-[#0a0534] text-white hover:bg-[#140a4d]", disponivel: Boolean(orc.transporte?.length) },
    { id: "restaurantes", titulo: "Restaurantes", icone: RestaurantesReferenceIcon, classe: "bg-[#0a0534] text-white hover:bg-[#140a4d]", disponivel: Boolean(orc.restaurante?.length) },
    { id: "experiencias", titulo: "Experiencias", icone: ExperienciasReferenceIcon, classe: "bg-[#0a0534] text-white hover:bg-[#140a4d]", disponivel: Boolean(orc.experiencias?.length) },
    { id: "seguro", titulo: "Seguro", icone: RoteiroReferenceIcon, classe: "bg-[#0a0534] text-white hover:bg-[#140a4d]", disponivel: Boolean(orc.seguro?.length) },
    { id: "passageiros", titulo: "Passageiros", icone: RoteiroReferenceIcon, classe: "bg-[#0a0534] text-white hover:bg-[#140a4d]", disponivel: Boolean(listaPassageiros.length) },
  ].filter((item) => item.disponivel);

  const navegarParaItem = (id: string) => {
    setItemAtivo(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const abrirVoucherPdf = async (documento: string) => {
    try {
      const documentoNormalizado = documento.startsWith("data:")
        ? documento
        : `data:application/pdf;base64,${documento}`;

      const response = await fetch(documentoNormalizado);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");

      // Revoga a URL depois de um tempo para evitar vazamento de memória.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch {
      window.open(documento, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 max-w-4xl mx-auto min-h-screen bg-[#f0f0f0]" style={{ fontFamily: "Montserrat, sans-serif" }}>
      <div className="flex items-start justify-between mb-8">
        <div className="text-center flex-1 group">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full" style={{ backgroundColor: COR_PRINCIPAL, boxShadow: "0 4px 16px rgba(10,5,52,.25)" }}>
              <RoteiroReferenceIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <h1
              className="text-2xl sm:text-4xl font-semibold tracking-tight"
              style={{ color: COR_PRINCIPAL }}
            >
              Roteiro da Sua Viagem
            </h1>
          </div>
          <p
            className="text-lg sm:text-xl mt-2 font-medium"
            style={{ color: COR_DESTAQUE }}
          >
            {possuiPlanejamentoBase ? `Para ${destinoPrincipal}` : "Ainda não tem voo definido."}
          </p>
          <p className="mt-1 text-sm sm:text-base text-gray-500">
            Check-in: {formatarDataCurta(dataCheckinPrincipal)} | Check-out: {formatarDataCurta(dataCheckoutPrincipal)}
          </p>
        </div>
        <button onClick={() => window.close()} className="p-2 text-[#0a0534] hover:text-[#e07b20] transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {fotoPacoteDestaque && (
        <div className="mb-6 overflow-hidden rounded-xl border border-cyan-100 bg-white shadow-sm">
          <img src={fotoPacoteDestaque} alt="Foto do pacote" className="h-64 w-full object-cover sm:h-80" />
        </div>
      )}

      <Card className="p-4 mb-6 text-center" style={{ backgroundColor: COR_PRINCIPAL, color: "white" }}>
        <h2 className="font-bold mb-3" style={{ color: COR_DESTAQUE }}>Sr(a) {orc.cliente || "Cliente"}</h2>
        {dataViagemPrincipal ? (
          <Countdown targetDate={dataViagemPrincipal} checkoutDate={dataCheckoutPrincipal} />
        ) : (
          <p className="text-sm text-white/70">Data da viagem ainda não definida.</p>
        )}
      </Card>

      {itensRoteiro.length > 0 && (
        <nav aria-label="Itens do roteiro" className="mb-6 print:hidden">
          <p className="mb-3 text-center text-sm font-semibold text-gray-700">Itens do roteiro</p>
          <div className="flex flex-wrap items-start justify-center gap-4 px-1 pt-2 pb-3">
            {itensRoteiro.map(({ id, titulo, icone: Icone, classe }) => (
              <Button
                key={id}
                type="button"
                onClick={() => navegarParaItem(id)}
                title={titulo}
                aria-label={`Ir para ${titulo}`}
                className={`group relative h-auto w-20 shrink-0 border-0 bg-transparent p-0 shadow-none transition-all hover:-translate-y-0.5 ${itemAtivo === id ? "ring-0" : ""}`}
              >
                <span className="mx-auto flex w-full flex-col items-center gap-2">
                  <span className={`flex h-[66px] w-[66px] items-center justify-center rounded-full shadow-sm transition-all ${classe} ${itemAtivo === id ? "ring-2 ring-offset-2 ring-[#e07b20]" : ""}`}>
                    <Icone className="h-9 w-9" />
                  </span>
                  <span className="block text-center text-xs font-semibold text-[#0a0534]">{titulo}</span>
                </span>
              </Button>
            ))}
          </div>
        </nav>
      )}

      {/* PACOTES */}
      {orc.pacotes && orc.pacotes.length > 0 && itemAtivo === "pacotes" && (
        <Card id="pacotes" className="overflow-hidden mb-6 scroll-mt-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
          <div className="p-3" style={{ backgroundColor: COR_PRINCIPAL }}>
            <TituloSecao titulo="Pacotes" Icone={OrcamentoReferenceIcon} />
          </div>
          <div className="bg-[#0b0635] p-4 sm:p-5 space-y-4">
            {orc.pacotes.map((pacote: any, idx: number) => {
              const pacoteId = Number(pacote.id ?? idx);
              const politicaCancelamentoMinimizadaParaPacote = politicaCancelamentoMinimizada[pacoteId] ?? true;

              // Verifica se há campos estruturados preenchidos
              const temEstrutura = pacote.operador || pacote.destino || pacote.origem ||
                pacote.reserva || pacote.informacoesAdicionais ||
                pacote.politicaAlteracoesCancelamentos || pacote.dadosCliente ||
                pacote.link || pacote.urlOperador?.length > 0 || pacote.documentos?.length > 0;

              // Descrição livre usada apenas quando não há campos estruturados
              // OU quando contém texto além do gerado automaticamente pelo gerarResumoPacote
              const descricaoOriginal = (pacote.descricao || "").replace(/AgaxTur\s*/gi, "").trim();
              const resumoGerado = gerarResumoPacote(pacote as any).replace(/AgaxTur\s*/gi, "").trim();
              const descricaoExtra = descricaoOriginal !== resumoGerado ? descricaoOriginal : "";

              return (
                <div key={pacote.id || idx} className="rounded-[22px] bg-[#1c1848] px-4 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-5 sm:py-5 space-y-3">

                  {/* Operador / Destino / Reserva */}
                  {(pacote.operador || pacote.destino || pacote.origem || pacote.reserva) && (
                    <div className="flex flex-wrap gap-x-6 gap-y-2 pb-3 border-b border-white/10">
                      {pacote.operador && (
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40">Operador</p>
                          <p className="mt-0.5 text-sm font-bold text-white">{pacote.operador}</p>
                        </div>
                      )}
                      {(pacote.origem || pacote.destino) && (
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40">Destino</p>
                          <p className="mt-0.5 text-sm font-bold text-white">
                            {pacote.origem && pacote.destino ? `${pacote.origem} → ${pacote.destino}` : pacote.destino || pacote.origem}
                          </p>
                        </div>
                      )}
                      {pacote.reserva && (
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40">Nº Reserva</p>
                          <p className="mt-0.5 text-sm font-mono font-bold text-white">{pacote.reserva}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dados do cliente */}
                  {pacote.dadosCliente && (
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40 mb-1">Dados do Cliente</p>
                      <p className="text-xs text-white/75 leading-5 whitespace-pre-wrap">{pacote.dadosCliente}</p>
                    </div>
                  )}

                  {/* Informações adicionais */}
                  {pacote.informacoesAdicionais && (
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40 mb-1">Informações Adicionais</p>
                      <p className="text-xs text-white/75 leading-5 whitespace-pre-wrap">{pacote.informacoesAdicionais}</p>
                    </div>
                  )}

                  {/* Descrição livre (somente quando diferente do resumo gerado automaticamente) */}
                  {!temEstrutura && descricaoOriginal && (
                    <div className="space-y-1.5">
                      {descricaoOriginal
                        .split('\n')
                        .flatMap((linha: string) => linha.split(/(?<=\.)\s+/))
                        .map((p: string) => p.trim())
                        .filter((p: string) => p.length > 0)
                        .map((paragrafo: string, pIdx: number) => (
                          <div key={pIdx} className="flex items-start gap-2">
                            <span className="mt-2 inline-flex h-2 w-2 shrink-0 rounded-full bg-[#ff8b1f]" aria-hidden="true" />
                            <span className="text-[14px] leading-7 text-white/82">{paragrafo}</span>
                          </div>
                        ))}
                    </div>
                  )}
                  {temEstrutura && descricaoExtra && (
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40 mb-1">Observações</p>
                      <p className="text-xs text-white/75 leading-5 whitespace-pre-wrap">{descricaoExtra}</p>
                    </div>
                  )}

                  {/* Links e documentos */}
                  {(pacote.link || pacote.urlOperador?.length > 0 || pacote.documentos?.length > 0) && (
                    <div className="pt-2 border-t border-white/10 flex flex-col gap-1">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40 mb-1">Arquivos Anexados</p>
                      {pacote.link && (
                        <a href={pacote.link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-indigo-300 hover:text-indigo-100 underline">
                          🔗 {pacote.link}
                        </a>
                      )}
                      {(pacote.urlOperador || []).map((url: string, uIdx: number) => (
                        <a key={uIdx} href={url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-indigo-300 hover:text-indigo-100 underline break-all">
                          🔗 {url}
                        </a>
                      ))}
                      {(pacote.documentos || []).map((doc: any, dIdx: number) => (
                        <button key={dIdx} onClick={() => abrirVoucherPdf(doc.arquivo)}
                          className="text-xs text-indigo-300 hover:text-indigo-100 underline text-left">
                          📎 {doc.nome || `Documento ${dIdx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Política de cancelamento */}
                  {pacote.politicaAlteracoesCancelamentos && (
                    <div className="pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setPoliticaCancelamentoMinimizada((prev) => ({
                          ...prev,
                          [pacoteId]: !(prev[pacoteId] ?? true),
                        }))}
                        className="flex w-full items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.04]"
                        aria-expanded={!politicaCancelamentoMinimizadaParaPacote}
                      >
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/75">Política de Cancelamento</p>
                        {politicaCancelamentoMinimizadaParaPacote ? (
                          <ChevronDown className="h-4 w-4 text-white/70" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-white/70" />
                        )}
                      </button>
                      {!politicaCancelamentoMinimizadaParaPacote && (
                        <div className="mt-2 rounded-md border border-white/10 bg-white/[0.02] p-2.5">
                          {pacote.politicaAlteracoesCancelamentos
                            .split(/\n\s*\n|\n/)
                            .map((paragrafo: string, index: number) => {
                              const texto = paragrafo.trim();
                              if (!texto) return null;
                              return (
                                <p key={`${pacoteId}-${index}`} className="text-xs text-white/80 leading-6 whitespace-pre-wrap mb-2 last:mb-0">
                                  {texto}
                                </p>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* VOOS */}
      {possuiVoo && itemAtivo === "voos" && (
        <Card id="voos" className="overflow-hidden mb-6 scroll-mt-4">
          <div className="p-3" style={{ backgroundColor: COR_PRINCIPAL }}>
            <TituloSecao titulo="Voos" Icone={VooReferenceIcon} />
          </div>
          <div className="p-4 space-y-4">
            {(orc.pacotes || [])
              .filter((p: any) => p?.origemIda?.trim() || p?.destinoIda?.trim() || p?.dataIda?.trim() || p?.origemVolta?.trim() || p?.destinoVolta?.trim() || p?.dataVolta?.trim())
              .map((p: any, idx: number) => (
              <div key={idx} className="overflow-hidden rounded-[26px] bg-white shadow-[0_10px_30px_rgba(10,5,52,0.12)]">
                <div className="px-4 py-4 sm:px-5 sm:py-5">
                  {/* Operador / CIA / Reserva */}
                  {(p.operador || p.ciaAerea || p.reserva) && (
                    <div className="flex flex-wrap gap-4 mb-4 pb-3 border-b border-slate-100">
                      {p.operador && (
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Operador</p>
                          <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{p.operador}</p>
                        </div>
                      )}
                      {p.ciaAerea && (
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">CIA Aérea</p>
                          <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{p.ciaAerea}</p>
                        </div>
                      )}
                      {p.reserva && (
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Nº Reserva</p>
                          <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{p.reserva}</p>
                        </div>
                      )}
                      {p.passageiros && (
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Passageiros</p>
                          <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{p.passageiros}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trecho de Ida */}
                  {(p.origemIda || p.destinoIda || p.dataIda) && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <VooReferenceIcon className="h-5 w-5 text-[#e07b20]" />
                        <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#e07b20]">IDA</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                        {p.origemIda && (
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Origem</p>
                            <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{p.origemIda}</p>
                          </div>
                        )}
                        {p.destinoIda && (
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Destino</p>
                            <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{p.destinoIda}</p>
                          </div>
                        )}
                        {p.dataIda && (
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Data</p>
                            <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{formatarDataVooCurta(p.dataIda)}</p>
                          </div>
                        )}
                        {p.horaSaidaIda && (
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Saída</p>
                            <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{p.horaSaidaIda}</p>
                          </div>
                        )}
                        {p.horaChegadaIda && (
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Chegada</p>
                            <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{p.horaChegadaIda}</p>
                          </div>
                        )}
                        {p.duracaoIda && (
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Duração</p>
                            <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{p.duracaoIda}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Trecho de Volta */}
                  {(p.origemVolta || p.destinoVolta || p.dataVolta) && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex items-center gap-2 mb-3">
                        <VooReferenceIcon className="h-5 w-5 text-[#e07b20] -rotate-180" />
                        <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#e07b20]">VOLTA</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                        {p.origemVolta && (
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Origem</p>
                            <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{p.origemVolta}</p>
                          </div>
                        )}
                        {p.destinoVolta && (
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Destino</p>
                            <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{p.destinoVolta}</p>
                          </div>
                        )}
                        {p.dataVolta && (
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Data</p>
                            <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{formatarDataVooCurta(p.dataVolta)}</p>
                          </div>
                        )}
                        {p.horaSaidaVolta && (
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Saída</p>
                            <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{p.horaSaidaVolta}</p>
                          </div>
                        )}
                        {p.horaChegadaVolta && (
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Chegada</p>
                            <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{p.horaChegadaVolta}</p>
                          </div>
                        )}
                        {p.duracaoVolta && (
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Duração</p>
                            <p className="mt-1 text-sm font-extrabold text-[#0a0534] sm:text-base">{p.duracaoVolta}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Link do voucher */}
                  {p.link && (
                    <div className="mt-4 border-t border-gray-200 pt-3 flex justify-end">
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Abrir voucher do voo
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* HOSPEDAGEM */}
      {possuiHospedagem && itemAtivo === "hospedagem" && (
        <Card id="hospedagem" className="overflow-hidden mb-6 scroll-mt-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
          <div className="p-3" style={{ backgroundColor: COR_PRINCIPAL }}>
            <TituloSecao titulo="Hospedagens" Icone={HospedagemReferenceIcon} />
          </div>
          <div className="bg-[#0b0635] p-4 space-y-6">
            {/* ── Hospedagens da HospedagemForm ── */}
            {(orc.hospedagem || []).map((h: any, idx: number) => {
              const nome        = h.nome || "";
              const local       = h.local || "";
              const endereco    = h.endereco || "";
              const telefone    = h.telefone || "";
              const email       = h.email || "";
              const checkin     = h.checkin || "";
              const checkout    = h.checkout || "";
              const tipoQuarto  = h.tipoQuarto || "";
              const regime      = h.regime || "";
              const comodidades = h.comodidades || (Array.isArray(h.amenidades) ? h.amenidades.join(", ") : "") || "";
              const noites      = h.noites || "";
              const classificacao = Number(h.classificacao) || 0;
              const fotos = normalizarFotosHospedagem(h);
              return (
                <div key={`hf-${idx}`} className="overflow-hidden rounded-[22px] bg-[#1c1848] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  {fotos.length > 0 && (
                    <div className="relative" ref={(el) => { carrosselHospedagemRefs.current[idx] = el; }}>
                      {fotos.length > 1 && (
                        <>
                          <button type="button" onClick={() => moverCarrosselHospedagem(idx, -1)}
                            disabled={(carrosselHospedagemAtivo[idx] ?? 0) === 0} aria-label="Foto anterior"
                            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70 disabled:opacity-30 transition">
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button type="button" onClick={() => moverCarrosselHospedagem(idx, 1)}
                            disabled={(carrosselHospedagemAtivo[idx] ?? 0) >= fotos.length - 1} aria-label="Próxima foto"
                            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70 disabled:opacity-30 transition">
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <div className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {fotos.map((foto: string, fi: number) => (
                          <a key={foto} data-hospedagem-foto href={foto} target="_blank" rel="noreferrer"
                            className="group relative w-full flex-none snap-start snap-always overflow-hidden bg-[#0b0635]">
                            <img src={foto} alt={`Foto ${fi + 1} da hospedagem ${nome}`.trim() || "Foto da hospedagem"}
                              className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:h-72" loading="lazy" />
                            <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                              {fi + 1} / {fotos.length}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="px-5 py-5 space-y-4">
                    <div>
                      <p className="text-[17px] font-bold leading-snug text-white">{nome}</p>
                      {classificacao > 0 && (
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < classificacao ? "fill-[#e07b20] text-[#e07b20]" : "text-white/20"}`} />
                          ))}
                        </div>
                      )}
                    </div>
                    {(checkin || checkout) && (
                      <p className="text-[14px] font-semibold leading-6" style={{ color: COR_DESTAQUE }}>{formatarPeriodo(checkin, checkout)}</p>
                    )}
                    {(checkin || checkout || noites || tipoQuarto) && (
                      <div className="grid grid-cols-2 gap-2">
                        {checkin && (
                          <div className="rounded-xl bg-white/8 px-3 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Check-in</p>
                            <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-white/60 shrink-0" /><p className="text-[13px] font-semibold text-white">{formatarDataCurta(checkin)}</p></div>
                          </div>
                        )}
                        {checkout && (
                          <div className="rounded-xl bg-white/8 px-3 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Check-out</p>
                            <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-white/60 shrink-0" /><p className="text-[13px] font-semibold text-white">{formatarDataCurta(checkout)}</p></div>
                          </div>
                        )}
                        {noites && (
                          <div className="rounded-xl bg-white/8 px-3 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Noites</p>
                            <div className="flex items-center gap-1.5"><Bed className="h-3.5 w-3.5 text-white/60 shrink-0" /><p className="text-[13px] font-semibold text-white">{noites} noite{Number(noites) !== 1 ? "s" : ""}</p></div>
                          </div>
                        )}
                        {tipoQuarto && (
                          <div className="rounded-xl bg-white/8 px-3 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Tipo de quarto</p>
                            <div className="flex items-center gap-1.5"><Bed className="h-3.5 w-3.5 text-white/60 shrink-0" /><p className="text-[13px] font-semibold text-white">{tipoQuarto}</p></div>
                          </div>
                        )}
                      </div>
                    )}
                    {regime && (
                      <div className="flex items-start gap-3 rounded-xl bg-white/8 px-4 py-3">
                        <Coffee className="h-4 w-4 text-white/50 mt-0.5 shrink-0" />
                        <div><p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">Regime</p><p className="text-[13px] font-medium text-white/85">{regime}</p></div>
                      </div>
                    )}
                    {(local || endereco) && (
                      <div className="flex items-start gap-3 rounded-xl bg-white/8 px-4 py-3">
                        <MapPin className="h-4 w-4 text-white/50 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">Endereço</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] text-white/85 flex-1">{local || endereco}</p>
                            <a href={`https://maps.google.com/?q=${encodeURIComponent(local || endereco)}`}
                              target="_blank" rel="noreferrer" aria-label="Abrir no Google Maps"
                              className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Ver no Google Maps">
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#e07b20"/>
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                    {(telefone || email) && (
                      <div className="space-y-2">
                        {telefone && (
                          <div className="flex items-center gap-3 rounded-xl bg-white/8 px-4 py-3">
                            <Phone className="h-4 w-4 text-white/50 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">Telefone</p>
                              <div className="flex items-center gap-2">
                                <a href={`tel:${telefone}`} className="text-[13px] font-medium text-[#e07b20] hover:underline flex-1">{telefone}</a>
                                <a href={`https://wa.me/${telefone.replace(/\D/g, "")}`}
                                  target="_blank" rel="noreferrer" aria-label="Enviar mensagem no WhatsApp"
                                  className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="WhatsApp">
                                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#25D366" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                                  </svg>
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                        {email && (
                          <div className="flex items-center gap-3 rounded-xl bg-white/8 px-4 py-3">
                            <MailIcon className="h-4 w-4 text-white/50 shrink-0" />
                            <div><p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">E-mail</p><a href={`mailto:${email}`} className="text-[13px] font-medium text-[#e07b20] hover:underline break-all">{email}</a></div>
                          </div>
                        )}
                      </div>
                    )}
                    {comodidades && (
                      <div className="rounded-xl bg-white/8 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Comodidades</p>
                        <p className="text-[13px] text-white/82 leading-relaxed">{comodidades}</p>
                      </div>
                    )}
                    {h.politicasCondicoesInformacoesEspeciais && (
                      <div className="rounded-xl bg-white/8 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Políticas e informações</p>
                        <p className="text-[13px] text-white/82 leading-relaxed whitespace-pre-line">{h.politicasCondicoesInformacoesEspeciais}</p>
                      </div>
                    )}
                    {h.voucher && (
                      <button type="button" onClick={() => { const win = window.open(""); if (win && h.voucher) { win.document.write(h.voucherTipo === "pdf" ? `<iframe src="${h.voucher}" style="width:100%;height:100%;border:none;"></iframe>` : `<img src="${h.voucher}" style="max-width:100%;max-height:100vh;display:block;margin:auto;" />`); } }}
                        className="w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-[13px] font-semibold text-white/90 hover:bg-white/15 transition-colors text-center">
                        Abrir Voucher da Hospedagem
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* ── Hospedagens vindas de Pacotes ── */}
            {(orc.pacotes || [])
              .filter((p: any) => p?.hospedagemNome?.trim())
              .map((p: any, idx: number) => {
                const nome        = p.hospedagemNome        || "";
                const endereco    = p.hospedagemEndereco    || "";
                const telefone    = p.hospedagemTelefone    || "";
                const email       = p.hospedagemEmail       || "";
                const checkin     = p.hospedagemCheckin     || "";
                const checkout    = p.hospedagemCheckout    || "";
                const tipoQuarto  = p.hospedagemTipoQuarto  || "";
                const regime      = p.hospedagemRegime      || "";
                const comodidades = p.hospedagemComodidades || "";
                const noites      = p.hospedagemNoites      || "";
                const politicas   = p.hospedagemPoliticasCondicoesInformacoesEspeciais || "";
                const links: string[] = (() => {
                  const l: string[] = [];
                  if (Array.isArray(p.hospedagemLinks)) l.push(...p.hospedagemLinks.filter(Boolean));
                  if (p.hospedagemLink && !l.includes(p.hospedagemLink)) l.push(p.hospedagemLink);
                  return l;
                })();
                const fotos: string[] = (() => {
                  const f: string[] = [];
                  if (Array.isArray(p.hospedagemFotos)) f.push(...p.hospedagemFotos.filter(Boolean));
                  if (p.hospedagemFoto && !f.includes(p.hospedagemFoto)) f.push(p.hospedagemFoto);
                  return f;
                })();
                return (
                  <div key={`pp-${p.id ?? idx}`} className="overflow-hidden rounded-[22px] bg-[#1c1848] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    {fotos.length > 0 && (
                      <img src={fotos[0]} alt={`Foto da hospedagem ${nome}`}
                        className="h-56 w-full object-cover sm:h-72" loading="lazy" />
                    )}
                    <div className="px-5 py-5 space-y-4">
                      <p className="text-[17px] font-bold leading-snug text-white">{nome}</p>
                      {(checkin || checkout) && (
                        <p className="text-[14px] font-semibold leading-6" style={{ color: COR_DESTAQUE }}>{formatarPeriodo(checkin, checkout)}</p>
                      )}
                      {(checkin || checkout || noites || tipoQuarto) && (
                        <div className="grid grid-cols-2 gap-2">
                          {checkin && (
                            <div className="rounded-xl bg-white/8 px-3 py-2.5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Check-in</p>
                              <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-white/60 shrink-0" /><p className="text-[13px] font-semibold text-white">{formatarDataCurta(checkin)}</p></div>
                            </div>
                          )}
                          {checkout && (
                            <div className="rounded-xl bg-white/8 px-3 py-2.5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Check-out</p>
                              <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-white/60 shrink-0" /><p className="text-[13px] font-semibold text-white">{formatarDataCurta(checkout)}</p></div>
                            </div>
                          )}
                          {noites && (
                            <div className="rounded-xl bg-white/8 px-3 py-2.5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Noites</p>
                              <div className="flex items-center gap-1.5"><Bed className="h-3.5 w-3.5 text-white/60 shrink-0" /><p className="text-[13px] font-semibold text-white">{noites} noite{Number(noites) !== 1 ? "s" : ""}</p></div>
                            </div>
                          )}
                          {tipoQuarto && (
                            <div className="rounded-xl bg-white/8 px-3 py-2.5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Tipo de quarto</p>
                              <div className="flex items-center gap-1.5"><Bed className="h-3.5 w-3.5 text-white/60 shrink-0" /><p className="text-[13px] font-semibold text-white">{tipoQuarto}</p></div>
                            </div>
                          )}
                        </div>
                      )}
                      {regime && (
                        <div className="flex items-start gap-3 rounded-xl bg-white/8 px-4 py-3">
                          <Coffee className="h-4 w-4 text-white/50 mt-0.5 shrink-0" />
                          <div><p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">Regime</p><p className="text-[13px] font-medium text-white/85">{regime}</p></div>
                        </div>
                      )}
                      {endereco && (
                        <div className="flex items-start gap-3 rounded-xl bg-white/8 px-4 py-3">
                          <MapPin className="h-4 w-4 text-white/50 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">Endereço</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] text-white/85 flex-1">{endereco}</p>
                              <a href={`https://maps.google.com/?q=${encodeURIComponent(endereco)}`}
                                target="_blank" rel="noreferrer" aria-label="Abrir no Google Maps"
                                className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Ver no Google Maps">
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#e07b20"/>
                                </svg>
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                      {(telefone || email) && (
                        <div className="space-y-2">
                          {telefone && (
                            <div className="flex items-center gap-3 rounded-xl bg-white/8 px-4 py-3">
                              <Phone className="h-4 w-4 text-white/50 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">Telefone</p>
                                <div className="flex items-center gap-2">
                                  <a href={`tel:${telefone}`} className="text-[13px] font-medium text-[#e07b20] hover:underline flex-1">{telefone}</a>
                                  <a href={`https://wa.me/${telefone.replace(/\D/g, "")}`}
                                    target="_blank" rel="noreferrer" aria-label="Enviar mensagem no WhatsApp"
                                    className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="WhatsApp">
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#25D366" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                                    </svg>
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                          {email && (
                            <div className="flex items-center gap-3 rounded-xl bg-white/8 px-4 py-3">
                              <MailIcon className="h-4 w-4 text-white/50 shrink-0" />
                              <div><p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">E-mail</p><a href={`mailto:${email}`} className="text-[13px] font-medium text-[#e07b20] hover:underline break-all">{email}</a></div>
                            </div>
                          )}
                        </div>
                      )}
                      {comodidades && (
                        <div className="rounded-xl bg-white/8 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Comodidades</p>
                          <p className="text-[13px] text-white/82 leading-relaxed">{comodidades}</p>
                        </div>
                      )}
                      {politicas && (
                        <div className="rounded-xl bg-white/8 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Políticas e informações</p>
                          <p className="text-[13px] text-white/82 leading-relaxed whitespace-pre-line">{politicas}</p>
                        </div>
                      )}
                      {links.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Links da operadora</p>
                          {links.map((link, i) => (
                            <a key={i} href={link} target="_blank" rel="noreferrer"
                              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-[13px] font-medium text-[#e07b20] hover:bg-white/15 transition-colors">
                              <ExternalLink className="h-4 w-4 shrink-0" /><span className="truncate">{link}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* ROTEIRO */}
      {orc.roteiro && itemAtivo === "roteiro" && (
        <Card id="roteiro" className="overflow-hidden mb-6 scroll-mt-4 bg-transparent border-0 shadow-none">
          <div className="flex items-center justify-between rounded-t-[24px] bg-white px-4 py-3 shadow-sm">
            <h2 className="text-xl font-extrabold tracking-tight text-[#0a0534] sm:text-2xl">
              Roteiro
            </h2>
            <RoteiroReferenceIcon className="h-8 w-8 text-[#0a0534]" />
          </div>
          <div className="bg-[#0b0635] p-4 sm:p-5">
            <RenderRoteiroTexto texto={orc.roteiro} />
          </div>
        </Card>
      )}

      {/* DAY BY DAY */}
      {itemAtivo === "dia-a-dia" && (
        <Card id="dia-a-dia" className="overflow-hidden mb-6 scroll-mt-4">
          <div className="p-3" style={{ backgroundColor: COR_PRINCIPAL }}>
            <TituloSecao titulo="Day by Day" Icone={DayByDayReferenceIcon} />
          </div>
          <div className="p-4 space-y-4">
            {diasRoteiroExibicao.length > 0 ? (
              <>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {diasRoteiroExibicao.map((dia, idx) => {
                    const ativo = diaSelecionado?.id === dia.id;
                    const tituloDia = `Dia ${idx + 1}`;

                    return (
                      <button
                        key={dia.id}
                        type="button"
                        onClick={() => setDiaAtivoId(dia.id)}
                        aria-pressed={ativo}
                        className={`min-w-[92px] shrink-0 rounded-2xl border px-3 py-3 text-left transition-all ${ativo ? "border-[#e07b20] bg-[#0a0534] text-white shadow-md" : "border-slate-200 bg-white text-slate-700 hover:border-[#e07b20] hover:text-[#0a0534]"}`}
                      >
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">
                          Dia {idx + 1}
                        </span>
                        <span className="mt-1 block text-sm font-bold leading-tight">
                          {tituloDia}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {diaSelecionado && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#0a0534]">
                        {diaSelecionado.titulo || `Dia ${diasRoteiroExibicao.findIndex((dia) => dia.id === diaSelecionado.id) + 1}`}
                      </h3>
                      {diaSelecionado.data && (
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                          {new Date(`${diaSelecionado.data}T00:00:00`).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {(diaSelecionado.atividades || []).map((atividade) => (
                        <div key={atividade.id} className="rounded-xl border border-white bg-white p-3 shadow-sm">
                          <div className="flex items-start gap-2">
                            <span className="mt-2 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[#e07b20]" aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm leading-6 text-slate-700">
                                {atividade.descricao || "Atividade sem descrição."}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {atividade.hora && (
                                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e07b20]">
                                    {atividade.hora}
                                  </span>
                                )}
                                {atividade.tipo && (
                                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                                    {atividade.tipo}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {(diaSelecionado.atividades || []).length === 0 && (
                        <p className="text-sm text-slate-600">
                          Nenhuma atividade cadastrada para este dia.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-600">Nenhum dia encontrado no roteiro deste orçamento.</p>
            )}
          </div>
        </Card>
      )}

      {/* TRANSPORTE */}
      {orc.transporte && orc.transporte.length > 0 && itemAtivo === "transporte" && (
        <Card id="transporte" className="overflow-hidden mb-6 scroll-mt-4">
          <div className="p-3" style={{ backgroundColor: COR_PRINCIPAL }}>
            <TituloSecao titulo="Transportes" Icone={TransportesReferenceIcon} />
          </div>
          <div className="p-4 space-y-3">
            {orc.transporte.map((t: any, idx: number) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{t.tipo}</span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">{t.empresa}</span>
                  {t.diaRoteiro && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Dia {t.diaRoteiro}</span>}
                </div>
                <p className="text-sm text-gray-700 mt-1">{t.origem} → {t.destino}</p>
                {t.dataHoraSaida && (
                  <p className="text-xs text-gray-500 mt-1">
                    Saída: {new Date(t.dataHoraSaida).toLocaleString("pt-BR")}
                    {t.dataHoraChegada && <> | Chegada: {new Date(t.dataHoraChegada).toLocaleString("pt-BR")}</>}
                  </p>
                )}
                {t.codigoReserva && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Reserva: <span className="font-mono font-semibold">{t.codigoReserva}</span>
                  </p>
                )}
                {t.descricao && (
                  <p className="text-xs text-gray-500 mt-0.5 italic">{t.descricao}</p>
                )}
                {t.voucher && (
                  <button
                    onClick={() => {
                      const win = window.open("");
                      if (win && t.voucher) {
                        win.document.write(
                          t.voucherTipo === "pdf"
                            ? `<iframe src="${t.voucher}" style="width:100%;height:100%;border:none;"></iframe>`
                            : `<img src="${t.voucher}" style="max-width:100%;max-height:100vh;display:block;margin:auto;" />`
                        );
                      }
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline mt-1 inline-block"
                  >
                    📎 Ver voucher
                  </button>
                )}
                {t.documentos && t.documentos.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {t.documentos.map((doc: any, dIdx: number) => (
                      <button
                        key={dIdx}
                        onClick={() => abrirVoucherPdf(doc.arquivo)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline text-left"
                      >
                        📎 {doc.nome || `Documento ${dIdx + 1}`}
                      </button>
                    ))}
                  </div>
                )}
                {t.urlOperador && t.urlOperador.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {t.urlOperador.map((url: string, uIdx: number) => (
                      <a
                        key={uIdx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        🔗 {url}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* RESTAURANTE */}
      {orc.restaurante && orc.restaurante.length > 0 && itemAtivo === "restaurantes" && (
        <Card id="restaurantes" className="overflow-hidden mb-6 scroll-mt-4">
          <div className="p-3" style={{ backgroundColor: COR_PRINCIPAL }}>
            <TituloSecao titulo="Restaurantes" Icone={RestaurantesReferenceIcon} />
          </div>
          <div className="p-4 space-y-3">
            {orc.restaurante.map((r: any, idx: number) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{r.nome}</span>
                    {r.tipoCozinha && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">{r.tipoCozinha}</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{r.local}</p>
                  {r.endereco && <p className="text-xs text-gray-500">{r.endereco}</p>}

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {r.data && <span>Data: <span className="font-medium text-gray-700">{formatarDataCurta(r.data)}</span></span>}
                    {r.horario && <span>Horário: <span className="font-medium text-gray-700">{r.horario}</span></span>}
                    {r.qtdPessoas > 0 && <span><span className="font-medium text-gray-700">{r.qtdPessoas}</span> pessoa(s)</span>}
                    {r.preco > 0 && <span className="font-semibold text-indigo-600">{formatarMoeda(r.preco)}</span>}
                  </div>

                  {r.observacoes && <p className="text-xs text-gray-500 mt-1 italic">{r.observacoes}</p>}

                  <div className="mt-2 flex flex-col items-start gap-1.5 text-xs">
                    {r.website && (
                      <a href={r.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        Website
                      </a>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {r.voucher && (
                        <button
                          onClick={() => {
                            const win = window.open("");
                            if (win && r.voucher) {
                              win.document.write(
                                r.voucherTipo === "pdf"
                                  ? `<iframe src="${r.voucher}" style="width:100%;height:100%;border:none;"></iframe>`
                                  : `<img src="${r.voucher}" style="max-width:100%;max-height:100vh;display:block;margin:auto;" />`
                              );
                            }
                          }}
                          className="text-indigo-600 hover:text-indigo-800 underline"
                        >
                          Ver voucher
                        </button>
                      )}
                    </div>
                    {r.urlMaps && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${encodeURIComponent(r.endereco || r.local)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Ver no Google Maps
                      </a>
                    )}
                    {r.endereco && (
                      <a
                        href={`https://m.uber.com/ul/?action=setPickup&pickup=current_location&dropoff[formatted_address]=${encodeURIComponent(r.endereco)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        <Car className="w-3.5 h-3.5" />
                        Chamar Uber
                      </a>
                    )}
                  </div>
                </div>
            ))}
          </div>
        </Card>
      )}

      {/* EXPERIÊNCIAS */}
      {orc.experiencias && orc.experiencias.length > 0 && itemAtivo === "experiencias" && (
        <Card id="experiencias" className="overflow-hidden mb-6 scroll-mt-4">
          <div className="p-3" style={{ backgroundColor: COR_PRINCIPAL }}>
            <TituloSecao titulo="Experiencias" Icone={ExperienciasReferenceIcon} />
          </div>
          <div className="p-4 space-y-3">
            {orc.experiencias.map((e: any, idx: number) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{e.nome}</p>
                <p className="text-sm text-gray-600">{e.descricao}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* SEGURO */}
      {orc.seguro && orc.seguro.length > 0 && itemAtivo === "seguro" && (
        <Card id="seguro" className="overflow-hidden mb-6 scroll-mt-4">
          <div className="p-3" style={{ backgroundColor: COR_PRINCIPAL }}>
            <TituloSecao titulo="Seguro" />
          </div>
          <div className="p-4 space-y-3">
            {orc.seguro.map((s: any, idx: number) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg space-y-1.5">

                {/* Cabeçalho: tipo + seguradora */}
                <div className="flex items-center gap-2 flex-wrap">
                  {s.tipo && <span className="font-semibold text-gray-900 text-sm">{s.tipo}</span>}
                  {s.seguradora && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{s.seguradora}</span>
                  )}
                  {s.areaCobertura && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{s.areaCobertura}</span>
                  )}
                </div>

                {/* Apólice / Certificado */}
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                  {s.apolice && <span>Apólice: <span className="font-mono font-semibold text-gray-700">{s.apolice}</span></span>}
                  {s.nrCertificado && <span>Certificado: <span className="font-mono font-semibold text-gray-700">{s.nrCertificado}</span></span>}
                </div>

                {/* Vigência */}
                {(s.dataInicio || s.dataFim) && (
                  <p className="text-xs text-gray-500">
                    Vigência:{" "}
                    {s.dataInicio ? new Date(s.dataInicio + "T00:00:00").toLocaleDateString("pt-BR") : "?"}
                    {" → "}
                    {s.dataFim ? new Date(s.dataFim + "T00:00:00").toLocaleDateString("pt-BR") : "?"}
                    {s.prazoCarencia && <span className="ml-2 text-gray-400">• Carência: {s.prazoCarencia}</span>}
                  </p>
                )}

                {/* Valores */}
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                  {s.valor > 0 && <span className="font-semibold text-indigo-600">{formatarMoeda(s.valor)}</span>}
                  {s.limiteCobertura && <span>Limite: <span className="font-medium text-gray-700">{s.limiteCobertura}</span></span>}
                  {s.franquia && <span>Franquia: <span className="font-medium text-gray-700">{s.franquia}</span></span>}
                </div>

                {/* Cobertura */}
                {s.cobertura && (
                  <p className="text-xs text-gray-600">
                    <span className="text-gray-400">Cobertura: </span>{s.cobertura}
                  </p>
                )}

                {/* Beneficiários */}
                {s.beneficiarios && (
                  <p className="text-xs text-gray-600">
                    <span className="text-gray-400">Beneficiários: </span>{s.beneficiarios}
                  </p>
                )}

                {/* Contato / Sinistro */}
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                  {s.assistencia24h && <span>Assistência 24h: <span className="font-medium text-gray-700">{s.assistencia24h}</span></span>}
                  {s.telefoneEmergencia && <span>Tel. emergência: <span className="font-medium text-gray-700">{s.telefoneEmergencia}</span></span>}
                  {s.contatoEmergencia && <span>Contato: <span className="font-medium text-gray-700">{s.contatoEmergencia}</span></span>}
                  {s.emailSinistro && (
                    <a href={`mailto:${s.emailSinistro}`} className="text-blue-600 hover:underline">
                      {s.emailSinistro}
                    </a>
                  )}
                  {s.siteSinistro && (
                    <a href={s.siteSinistro.startsWith("http") ? s.siteSinistro : `https://${s.siteSinistro}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline">
                      🔗 {s.siteSinistro}
                    </a>
                  )}
                </div>

                {/* Observações */}
                {s.observacoes && (
                  <p className="text-xs text-gray-500 italic">{s.observacoes}</p>
                )}

                {/* Voucher principal */}
                {s.voucher && (
                  <button
                    onClick={() => abrirVoucherPdf(s.voucher)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline mt-1 inline-block"
                  >
                    📎 {s.voucherNome || "Ver voucher"}
                  </button>
                )}

                {/* Documentos anexados */}
                {s.documentos && s.documentos.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {s.documentos.map((doc: any, dIdx: number) => (
                      <button
                        key={dIdx}
                        onClick={() => abrirVoucherPdf(doc.arquivo)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline text-left"
                      >
                        📎 {doc.nome || `Documento ${dIdx + 1}`}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            ))}
          </div>
        </Card>
      )}

      {listaPassageiros.length > 0 && itemAtivo === "passageiros" && (
        <Card id="passageiros" className="overflow-hidden mb-6 scroll-mt-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
          <div className="p-3" style={{ backgroundColor: COR_PRINCIPAL }}>
            <TituloSecao titulo="Passageiros" />
          </div>
          <div className="bg-[#0b0635] p-4 sm:p-5">
            <div className="rounded-[22px] bg-[#1c1848] px-4 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-5 sm:py-5">
              <p className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-[#ff8b1f]">
                Passageiros
              </p>

              <div className="mt-3 space-y-2 text-[14px] leading-7 text-white/82">
                {listaPassageiros.map((passageiro, index) => (
                  <div key={`${passageiro}-${index}`} className="flex items-start gap-2">
                    <span className="mt-2 inline-flex h-2 w-2 shrink-0 rounded-full bg-[#ff8b1f]" aria-hidden="true" />
                    <span className="font-semibold text-white">{passageiro}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {orc.observacoes && (
        <Card className="overflow-hidden mb-6">
          <div className="p-3" style={{ backgroundColor: COR_PRINCIPAL }}>
            <TituloSecao titulo="Observacoes" />
          </div>
          <p className="text-sm text-gray-600 whitespace-pre-wrap p-4">{orc.observacoes}</p>
        </Card>
      )}

      <div className="flex gap-2 print:hidden">
        <Button onClick={() => window.print()} className="flex-1">Imprimir</Button>
        <Button onClick={handleShareWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
          <Share2 className="w-4 h-4 mr-2" /> WhatsApp
        </Button>
      </div>

      <footer className="mt-10 border-t border-gray-200 pt-6">
        {nomeAgente && (
          <div className="mb-5 max-w-2xl">
            <div className="flex items-center gap-4">
              {agente?.photo ? (
                <img src={agente.photo} alt={`Foto de ${nomeAgente}`} className="h-16 w-16 rounded-full object-cover ring-2 ring-purple-100" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-bold text-white ring-2 ring-purple-100">
                  {iniciaisAgente}
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900">{nomeAgente}</p>
                <p className="mt-1 text-sm font-medium text-purple-700">Especialista em viagens personalizadas</p>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
              {saudacaoAgente || "Planejo viagens personalizadas com atenção aos mínimos detalhes, unindo praticidade, conforto e segurança. Meu compromisso é transformar seus planos em experiências únicas, com suporte dedicado do início ao fim."}
            </p>
          </div>
        )}
        <div className="mb-5 flex items-center gap-4 print:hidden">
          <a href="https://wa.me/5511942000321" target="_blank" rel="noreferrer" title="WhatsApp" aria-label="WhatsApp" className="text-green-500 transition-transform hover:scale-110 hover:text-green-600">
            <MessageCircle className="h-5 w-5" />
          </a>
          <a href="https://www.instagram.com/321go.portaldomorumbi" target="_blank" rel="noreferrer" title="Instagram" aria-label="Instagram" className="text-pink-500 transition-transform hover:scale-110 hover:text-pink-600">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="mailto:portaldomorumbi@321go.com.br" title="E-mail" aria-label="E-mail" className="text-red-500 transition-transform hover:scale-110 hover:text-red-600">
            <Mail className="h-5 w-5" />
          </a>
        </div>
        <p className="text-xs text-gray-500">© 2026 321Go Portal do Morumbi. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

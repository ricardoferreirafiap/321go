import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Users,
  UserPlus,
  DollarSign,
  UserX,
  ClipboardList,
  Plane,
  PhoneOff,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";

interface CotacaoDolar {
  bid: string;
  ask: string;
  high: string;
  low: string;
  pctChange: string;
  timestamp: string;
}

function DolarWidget() {
  const [expandido, setExpandido] = useState(false);
  // Cotação comercial
  const [cotacao, setCotacao] = useState<CotacaoDolar | null>(null);
  // Cotação turismo
  const [cotacaoTurismo, setCotacaoTurismo] = useState<CotacaoDolar | null>(null);
  const [loadingCotacao, setLoadingCotacao] = useState(true);
  const [erroCotacao, setErroCotacao] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  async function buscarCotacao() {
    setLoadingCotacao(true);
    setErroCotacao(null);
    try {
      const [resComercial, resTurismo] = await Promise.all([
        fetch("https://economia.awesomeapi.com.br/last/USD-BRL"),
        fetch("https://economia.awesomeapi.com.br/last/USD-BRLT"),
      ]);
      if (!resComercial.ok) throw new Error("Falha ao buscar cotação");
      const dataComercial = await resComercial.json();
      setCotacao(dataComercial.USDBRL as CotacaoDolar);
      if (resTurismo.ok) {
        const dataTurismo = await resTurismo.json();
        setCotacaoTurismo(dataTurismo.USDBRLT as CotacaoDolar);
      }
      setUltimaAtualizacao(new Date());
    } catch {
      setErroCotacao("Não foi possível carregar a cotação do dólar.");
    } finally {
      setLoadingCotacao(false);
    }
  }

  useEffect(() => {
    buscarCotacao();
    const intervalo = setInterval(buscarCotacao, 5 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);

  const variacao = cotacao ? parseFloat(cotacao.pctChange) : 0;
  const positivo = variacao >= 0;

  const fmtBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  const fmtBRLStr = (val: string) => fmtBRL(parseFloat(val));

  return (
    <Card className="border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
      <CardContent className="py-2 px-4">
        {/* Barra de título sempre visível */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Dólar Americano (USD / BRL)</span>
            {/* Resumo quando minimizado */}
            {!expandido && cotacao && !loadingCotacao && (
              <span className="ml-3 flex items-center gap-3 text-sm">
                <span className="font-bold text-green-700 dark:text-green-400">{fmtBRLStr(cotacao.bid)}</span>
                <span className={`flex items-center gap-0.5 font-semibold ${positivo ? "text-red-500" : "text-green-600"}`}>
                  {positivo ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {positivo ? "+" : ""}{variacao.toFixed(2)}%
                </span>
                {cotacaoTurismo && (
                  <span className="text-xs text-muted-foreground">
                    Turismo: <span className="font-semibold text-green-700">{fmtBRLStr(cotacaoTurismo.ask)}</span>
                  </span>
                )}
              </span>
            )}
            {!expandido && loadingCotacao && (
              <span className="ml-3 flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" /> Carregando...
              </span>
            )}
          </div>
          <button
            onClick={() => setExpandido((v) => !v)}
            title={expandido ? "Minimizar" : "Expandir"}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-green-200 bg-white hover:bg-green-50 transition-colors text-green-600 text-xs font-bold shadow-sm"
          >
            {expandido ? "?" : "?"}
          </button>
        </div>

        {/* Corpo expandido */}
        {expandido && (
          <div className="mt-3 space-y-4">
            {loadingCotacao ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : erroCotacao ? (
              <p className="text-sm text-red-500">{erroCotacao}</p>
            ) : cotacao ? (
              <>
                {/* -- Linha de cotações -- */}
                <div className="flex flex-wrap items-start gap-6">
                  {/* Compra comercial */}
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Compra</span>
                    <span className="text-xl font-bold text-green-700 dark:text-green-400">
                      {fmtBRLStr(cotacao.bid)}
                    </span>
                  </div>

                  {/* Separador visual */}
                  <div className="hidden sm:block w-px self-stretch bg-green-200" />

                  {/* Dólar Turismo — destaque */}
                  {cotacaoTurismo && (
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-green-700">Turismo — Compra c/ cartão</span>
                      <span className="text-xl font-bold text-green-800 dark:text-green-300">
                        {fmtBRLStr(cotacaoTurismo.ask)}
                      </span>
                      <span className="text-xs text-muted-foreground">taxa aplicada no cartão internacional</span>
                    </div>
                  )}

                  {/* Variação */}
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Variação hoje</span>
                    <span className={`flex items-center gap-1 text-sm font-semibold ${positivo ? "text-red-500" : "text-green-600"}`}>
                      {positivo ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {positivo ? "+" : ""}{variacao.toFixed(2)}%
                    </span>
                  </div>

                  {/* Máx / Mín */}
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Máx / Mín</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {fmtBRLStr(cotacao.high)} / {fmtBRLStr(cotacao.low)}
                    </span>
                  </div>

                  {/* Atualização */}
                  <div className="flex flex-col items-start sm:items-end gap-1 sm:ml-auto">
                    {ultimaAtualizacao && (
                      <span className="text-xs text-muted-foreground">
                        Atualizado às {ultimaAtualizacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    <button
                      onClick={buscarCotacao}
                      className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Atualizar
                    </button>
                  </div>
                </div>
              </>
            ) : null}

            {/* Conversor de Moedas — no final do quadro Dólar */}
            <div className="mt-4 border-t border-green-200 pt-4">
              <ConversorMoedas />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
const MOEDAS = [
  { code: "BRL", label: "Real Brasileiro", flag: "????" },
  { code: "USD", label: "Dólar Americano", flag: "????" },
  { code: "EUR", label: "Euro", flag: "????" },
  { code: "GBP", label: "Libra Esterlina", flag: "????" },
  { code: "ARS", label: "Peso Argentino", flag: "????" },
  { code: "CAD", label: "Dólar Canadense", flag: "????" },
  { code: "AUD", label: "Dólar Australiano", flag: "????" },
  { code: "JPY", label: "Iene Japonês", flag: "????" },
  { code: "CHF", label: "Franco Suíço", flag: "????" },
  { code: "CNY", label: "Yuan Chinês", flag: "????" },
  { code: "MXN", label: "Peso Mexicano", flag: "????" },
  { code: "CLP", label: "Peso Chileno", flag: "????" },
];

function ConversorMoedas() {
  const [expandido, setExpandido] = useState(false);
  const [valor, setValor] = useState<string>("");
  const [de, setDe] = useState<string>("USD");
  const [para, setPara] = useState<string>("BRL");
  const [resultado, setResultado] = useState<number | null>(null);
  const [taxa, setTaxa] = useState<number | null>(null);
  const [taxaTurismo, setTaxaTurismo] = useState<number | null>(null);
  const [loadingConv, setLoadingConv] = useState(false);
  const [erroConv, setErroConv] = useState<string | null>(null);
  const [ultimaConv, setUltimaConv] = useState<Date | null>(null);

  // IOF por forma de pagamento
  const IOF = { credito: 5.38, debito: 1.1, dinheiro: 0 };

  const formatMoeda = (val: number, currency: string) => {
    try {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(val);
    } catch {
      return `${val.toFixed(2)} ${currency}`;
    }
  };

  async function converter() {
    const num = parseFloat(valor.replace(",", "."));
    if (isNaN(num) || num <= 0) { setErroConv("Valor inválido."); return; }
    if (de === para) {
      setTaxa(1); setTaxaTurismo(null); setResultado(num); setUltimaConv(new Date()); setErroConv(null); return;
    }
    setLoadingConv(true);
    setErroConv(null);
    try {
      // Busca cotação comercial + turismo em paralelo (turismo só para USD?BRL)
      const isUsdToBrl = de === "USD" && para === "BRL";
      const fetches: Promise<Response>[] = [
        fetch(`https://economia.awesomeapi.com.br/last/${de}-${para}`),
      ];
      if (isUsdToBrl) fetches.push(fetch("https://economia.awesomeapi.com.br/last/USD-BRLT"));

      const respostas = await Promise.all(fetches);
      if (!respostas[0].ok) throw new Error("Par não disponível");
      const dados = await respostas[0].json();
      const cotacaoAtual = dados[`${de}${para}`];
      if (!cotacaoAtual) throw new Error("Cotação não encontrada");
      const bid = parseFloat(cotacaoAtual.bid);
      setTaxa(bid);
      setResultado(num * bid);
      setUltimaConv(new Date());

      if (isUsdToBrl && respostas[1]?.ok) {
        const dadosTurismo = await respostas[1].json();
        const t = parseFloat(dadosTurismo?.USDBRLT?.ask ?? "0");
        setTaxaTurismo(t > 0 ? t : null);
      } else {
        setTaxaTurismo(null);
      }
    } catch (e) {
      setErroConv(e instanceof Error ? e.message : "Erro.");
      setResultado(null); setTaxa(null); setTaxaTurismo(null);
    } finally {
      setLoadingConv(false);
    }
  }

  useEffect(() => {
    if (valor && valor !== "" && valor !== "0") {
      const timer = setTimeout(() => converter(), 400);
      return () => clearTimeout(timer);
    } else {
      setResultado(null); setTaxa(null); setTaxaTurismo(null);
    }
  }, [valor, de, para]);

  function trocarMoedas() {
    setDe(para); setPara(de); setResultado(null); setTaxa(null); setTaxaTurismo(null);
  }

  const moedasOptions = MOEDAS.map((m) => (
    <option key={m.code} value={m.code}>{m.flag} {m.code}</option>
  ));

  const moedasOrigemLabel = MOEDAS.find((m) => m.code === de);
  const moedasDestinoLabel = MOEDAS.find((m) => m.code === para);

  // Cálculos de IOF — só exibidos quando o resultado existe e a moeda destino é BRL
  const num = parseFloat(valor.replace(",", "."));
  const mostrarIof = resultado !== null && para === "BRL" && !isNaN(num) && num > 0;
  const baseIof = taxaTurismo ?? taxa; // usa turismo se disponível

  const calcComIof = (iofPct: number) =>
    baseIof ? num * baseIof * (1 + iofPct / 100) : null;

  const semIof       = baseIof ? num * baseIof : null;
  const comCredito   = calcComIof(IOF.credito);
  const comDebito    = calcComIof(IOF.debito);
  const comDinheiro  = semIof; // sem IOF

  return (
    <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardContent className="py-2 px-4">
        {/* Barra sempre visível — título + toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Conversor de Moedas</span>
            {/* Resumo quando minimizado */}
            {!expandido && resultado !== null && !loadingConv && !erroConv && (
              <span className="ml-3 text-sm font-semibold text-blue-700 dark:text-blue-400">
                {valor} {moedasOrigemLabel?.flag} {de} = {formatMoeda(resultado, para)} {moedasDestinoLabel?.flag}
              </span>
            )}
            {!expandido && loadingConv && (
              <span className="ml-3 flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" /> Calculando...
              </span>
            )}
          </div>
          <button
            onClick={() => setExpandido((v) => !v)}
            title={expandido ? "Minimizar" : "Expandir"}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-white hover:bg-blue-50 transition-colors text-blue-600 text-xs font-bold shadow-sm"
          >
            {expandido ? "?" : "?"}
          </button>
        </div>

        {/* Corpo expandido */}
        {expandido && (
          <div className="mt-2 space-y-3">
            {/* -- Linha de inputs -- */}
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Valor"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="h-8 w-28 shrink-0 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <select
                value={de}
                onChange={(e) => setDe(e.target.value)}
                className="h-8 w-28 shrink-0 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {moedasOptions}
              </select>
              <button
                onClick={trocarMoedas}
                title="Trocar moedas"
                className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full border border-blue-200 bg-white hover:bg-blue-50 transition-colors shadow-sm text-blue-500 font-bold"
              >
                ?
              </button>
              <select
                value={para}
                onChange={(e) => setPara(e.target.value)}
                className="h-8 w-28 shrink-0 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {moedasOptions}
              </select>
              <span className="text-muted-foreground shrink-0">=</span>
              <div className="flex items-center gap-2 shrink-0">
                {loadingConv ? (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Calculando...
                  </span>
                ) : erroConv ? (
                  <span className="text-sm text-red-500">{erroConv}</span>
                ) : resultado !== null ? (
                  <span className="text-base font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                    {formatMoeda(resultado, para)}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
              {taxa !== null && !loadingConv && !erroConv && (
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  (1 {de} = {taxa.toFixed(4)} {para}
                  {ultimaConv ? ` · ${ultimaConv.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""})
                </span>
              )}
            </div>

            {/* -- Breakdown de IOF — aparece apenas quando há resultado em BRL -- */}
            {mostrarIof && semIof !== null && (
              <div className="rounded-lg border border-blue-200 bg-white/70 px-3 py-2">
                <p className="mb-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">
                  Custo total por forma de pagamento
                  {taxaTurismo && (
                    <span className="ml-2 font-normal text-blue-500 normal-case">
                      (base: dólar turismo {formatMoeda(taxaTurismo, "BRL")}/USD)
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Cartão de Crédito */}
                  <div className="flex flex-col rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
                    <span className="text-xs text-muted-foreground">?? Cartão de Crédito</span>
                    <span className="text-base font-bold text-blue-800">
                      {comCredito !== null ? formatMoeda(comCredito, "BRL") : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      IOF {IOF.credito}% · +{comCredito !== null ? formatMoeda(comCredito - semIof, "BRL") : "—"}
                    </span>
                  </div>

                  {/* Cartão de Débito / Pré-pago */}
                  <div className="flex flex-col rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2">
                    <span className="text-xs text-muted-foreground">?? Débito / Pré-pago</span>
                    <span className="text-base font-bold text-indigo-800">
                      {comDebito !== null ? formatMoeda(comDebito, "BRL") : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      IOF {IOF.debito}% · +{comDebito !== null ? formatMoeda(comDebito - semIof, "BRL") : "—"}
                    </span>
                  </div>

                  {/* Dinheiro / Espécie */}
                  <div className="flex flex-col rounded-md border border-green-100 bg-green-50 px-3 py-2">
                    <span className="text-xs text-muted-foreground">?? Dinheiro / Espécie</span>
                    <span className="text-base font-bold text-green-800">
                      {comDinheiro !== null ? formatMoeda(comDinheiro, "BRL") : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Sem IOF · taxa turismo
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Valores estimados com base na cotação turismo. O banco pode aplicar tarifas adicionais.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { listarLeads, type Lead } from "../data/leadsApi";
import { listarLancamentosFinanceiros, type LancamentoFinanceiro } from "../data/financeiroApi";
import { listarOrcamentos, type Orcamento } from "../data/orcamentosApi";

const periodFilters = ["Hoje", "Mês", "Mês Passado", "3m", "6m", "12m", "Tudo", "Personalizado"];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const MESES_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type CardKey =
  | "totalLeads"
  | "leadsNovo"
  | "leadsEmContato"
  | "leadsQualificado"
  | "leadsVendido"
  | "crmNovoLead"
  | "crmQualificacao"
  | "crmReuniao"
  | "crmFollowUps"
  | "crmFinalizados"
  | "orcamentosTotal"
  | "orcamentosRascunho"
  | "orcamentosAprovado"
  | "viagensAndamento"
  | "viagensFinalizadas"
  | "finReceitas"
  | "finDespesas"
  | "finComissao"
  | "finSaldo"
  | "receitaRoteiros"
  // legado (usado nos gráficos)
  | "leadsPeriodo"
  | "fechamentos"
  | "churnInativos"
  | "semFollowUp";

type BarPoint = { name: string; value: number };
type PiePoint = { name: string; value: number };

interface CardChartConfig {
  key: CardKey;
  title: string;
  value: string;
  icon: JSX.Element;
  barTitle: string;
  pieTitle: string;
  barData: BarPoint[];
  barName: string;
  pieData: PiePoint[];
}

function parseDate(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function resolverDataInicialPorFiltro(activeFilter: string, hoje: Date): { inicio: Date | null; fim: Date } {
  const fim = new Date(hoje);
  fim.setHours(23, 59, 59, 999);

  if (activeFilter === "Hoje") {
    const inicio = new Date(hoje);
    inicio.setHours(0, 0, 0, 0);
    return { inicio, fim };
  }

  if (activeFilter === "Mês") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    inicio.setHours(0, 0, 0, 0);
    return { inicio, fim };
  }

  if (activeFilter === "Mês Passado") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    inicio.setHours(0, 0, 0, 0);
    const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    fimMesPassado.setHours(23, 59, 59, 999);
    return { inicio, fim: fimMesPassado };
  }

  if (activeFilter === "3m") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
    inicio.setHours(0, 0, 0, 0);
    return { inicio, fim };
  }

  if (activeFilter === "6m") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
    inicio.setHours(0, 0, 0, 0);
    return { inicio, fim };
  }

  if (activeFilter === "12m") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1);
    inicio.setHours(0, 0, 0, 0);
    return { inicio, fim };
  }

  // "Tudo" e "Personalizado" retornam inicio null (tratado externamente)
  return { inicio: null, fim };
}

function montarSerieMeses(startDate: Date, endDate: Date, leads: Lead[]) {
  const months: { key: string; name: string; leads: number }[] = [];
  const map = new Map<string, number>();

  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const limite = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= limite) {
    const ano = cursor.getFullYear();
    const mes = cursor.getMonth();
    const key = `${ano}-${String(mes + 1).padStart(2, "0")}`;
    months.push({ key, name: MESES_LABEL[mes], leads: 0 });
    map.set(key, 0);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  leads.forEach((lead) => {
    const date = parseDate(lead.criadoEm);
    if (!date) return;
    if (date < startDate || date > endDate) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) return;
    map.set(key, (map.get(key) || 0) + 1);
  });

  return months.map((month) => ({
    name: month.name,
    leads: map.get(month.key) || 0,
  }));
}

function montarSerieMesesContagem(startDate: Date, endDate: Date, datas: Date[]) {
  const months: { key: string; name: string }[] = [];
  const map = new Map<string, number>();

  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const limite = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= limite) {
    const ano = cursor.getFullYear();
    const mes = cursor.getMonth();
    const key = `${ano}-${String(mes + 1).padStart(2, "0")}`;
    months.push({ key, name: MESES_LABEL[mes] });
    map.set(key, 0);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  datas.forEach((date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) return;
    map.set(key, (map.get(key) || 0) + 1);
  });

  return months.map((month) => ({
    name: month.name,
    value: map.get(month.key) || 0,
  }));
}

function montarSerieMesesValor(startDate: Date, endDate: Date, itens: Array<{ data: Date; valor: number }>) {
  const months: { key: string; name: string }[] = [];
  const map = new Map<string, number>();

  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const limite = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= limite) {
    const ano = cursor.getFullYear();
    const mes = cursor.getMonth();
    const key = `${ano}-${String(mes + 1).padStart(2, "0")}`;
    months.push({ key, name: MESES_LABEL[mes] });
    map.set(key, 0);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  itens.forEach((item) => {
    const key = `${item.data.getFullYear()}-${String(item.data.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) return;
    map.set(key, (map.get(key) || 0) + item.valor);
  });

  return months.map((month) => ({
    name: month.name,
    value: map.get(month.key) || 0,
  }));
}

function normalizarDataStr(valor: any): string | null {
  if (!valor || typeof valor !== "string") return null;
  const d = new Date(`${valor}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : valor.slice(0, 10);
}

function extrairDatasViagem(orc: Orcamento): { checkin: string | null; checkout: string | null } {
  const datas: string[] = [];

  for (const pacote of (orc.pacotes ?? []) as any[]) {
    const ci = normalizarDataStr(pacote.hospedagemCheckin) ?? normalizarDataStr(pacote.dataIda);
    const co = normalizarDataStr(pacote.hospedagemCheckout) ?? normalizarDataStr(pacote.dataVolta);
    if (ci) datas.push(ci);
    if (co) datas.push(co);
  }

  for (const hosp of (orc.hospedagem ?? []) as any[]) {
    const ci = normalizarDataStr(hosp.checkin) ?? normalizarDataStr(hosp.checkinHotel) ?? normalizarDataStr(hosp.dataCheckin);
    const co = normalizarDataStr(hosp.checkout) ?? normalizarDataStr(hosp.checkoutHotel) ?? normalizarDataStr(hosp.dataCheckout);
    if (ci) datas.push(ci);
    if (co) datas.push(co);
  }

  const voos = (orc.voos ?? []) as any[];
  const vooIda = voos.find((v: any) => v.tipoTrecho === "IDA" || voos.indexOf(v) === 0);
  const vooVolta = voos.find((v: any) => v.tipoTrecho === "VOLTA" || (voos.indexOf(v) === voos.length - 1 && voos.length > 1));
  const ciVoo = normalizarDataStr(vooIda?.data);
  const coVoo = normalizarDataStr(vooVolta?.data);
  if (ciVoo) datas.push(ciVoo);
  if (coVoo) datas.push(coVoo);

  if (!datas.length) return { checkin: null, checkout: null };
  datas.sort();
  return { checkin: datas[0], checkout: datas[datas.length - 1] };
}

export default function LeadDashboard() {
  const [expandidoVisaoGeral, setExpandidoVisaoGeral] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Mês");
  const [customDataInicio, setCustomDataInicio] = useState("");
  const [customDataFim, setCustomDataFim] = useState("");
  const [activeCard, setActiveCard] = useState<CardKey>("totalLeads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDashboard() {
      setError(null);
      try {
        const [listaLeads, listaLancamentos, listaOrcamentos] = await Promise.all([
          listarLeads(),
          listarLancamentosFinanceiros(),
          listarOrcamentos(),
        ]);

        setLeads(listaLeads);
        setLancamentos(listaLancamentos);
        setOrcamentos(listaOrcamentos);
      } catch (erroCarregamento) {
        setError(erroCarregamento instanceof Error ? erroCarregamento.message : "Erro ao carregar dados da visão geral.");
      } finally {
        setLoading(false);
      }
    }

    carregarDashboard();
  }, []);

  const dadosDashboard = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    const { inicio: inicioFiltroBase, fim: fimFiltroBase } = resolverDataInicialPorFiltro(activeFilter, hoje);

    // Para filtro personalizado, usa as datas digitadas; caso incompleto cai no comportamento de "Tudo"
    const inicioFiltro: Date | null =
      activeFilter === "Personalizado" && customDataInicio
        ? (() => { const d = new Date(`${customDataInicio}T00:00:00`); return Number.isNaN(d.getTime()) ? null : d; })()
        : inicioFiltroBase;

    const fimFiltro: Date =
      activeFilter === "Personalizado" && customDataFim
        ? (() => { const d = new Date(`${customDataFim}T23:59:59:999`); return Number.isNaN(d.getTime()) ? fimFiltroBase : d; })()
        : fimFiltroBase;

    const leadsNoPeriodo = leads.filter((lead) => {
      const dataLead = parseDate(lead.criadoEm);
      if (!dataLead) return false;
      if (!inicioFiltro) return dataLead <= fimFiltro;
      return dataLead >= inicioFiltro && dataLead <= fimFiltro;
    });

    const inicioGrafico = inicioFiltro || (() => {
      if (!leads.length) {
        return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      }
      const datasValidas = leads
        .map((lead) => parseDate(lead.criadoEm))
        .filter((data): data is Date => data !== null)
        .sort((a, b) => a.getTime() - b.getTime());
      if (!datasValidas.length) {
        return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      }
      const menorData = datasValidas[0];
      return new Date(menorData.getFullYear(), menorData.getMonth(), 1);
    })();

    const leadsPorPeriodoData = montarSerieMeses(inicioGrafico, fimFiltro, leads);

    const leadsValidos = leads
      .map((lead) => ({
        ...lead,
        criadoDate: parseDate(lead.criadoEm),
      }))
      .filter((lead): lead is Lead & { criadoDate: Date } => lead.criadoDate !== null);

    const lancamentosValidos = lancamentos
      .map((item) => ({
        ...item,
        dataDate: parseDate(item.data),
      }))
      .filter((item): item is LancamentoFinanceiro & { dataDate: Date } => item.dataDate !== null);

    const orcamentosValidos = orcamentos
      .map((orc) => ({
        ...orc,
        dataCriacaoDate: parseDate(orc.dataCriacao),
      }))
      .filter((orc): orc is Orcamento & { dataCriacaoDate: Date } => orc.dataCriacaoDate !== null);

    // Filtra todos os dados pelo período selecionado
    const leadsValidosPeriodo = leadsValidos.filter((lead) =>
      (!inicioFiltro || lead.criadoDate >= inicioFiltro) && lead.criadoDate <= fimFiltro
    );
    const lancamentosValidosPeriodo = lancamentosValidos.filter((item) =>
      (!inicioFiltro || item.dataDate >= inicioFiltro) && item.dataDate <= fimFiltro
    );
    const orcamentosValidosPeriodo = orcamentosValidos.filter((orc) =>
      (!inicioFiltro || orc.dataCriacaoDate >= inicioFiltro) && orc.dataCriacaoDate <= fimFiltro
    );
    const orcamentosAprovadosValidos = orcamentosValidosPeriodo.filter((orc) => orc.status === "Aprovado");

    const statusLeadsMap = new Map<string, number>();
    leadsValidosPeriodo.forEach((lead) => {
      statusLeadsMap.set(lead.status, (statusLeadsMap.get(lead.status) || 0) + 1);
    });
    const statusLeadsData = Array.from(statusLeadsMap.entries()).map(([name, value]) => ({ name, value }));

    const fechamentos = leadsValidosPeriodo.filter((lead) => lead.status === "Vendido").length;
    const churnInativos = leadsValidosPeriodo.filter((lead) => lead.status === "Perdido").length;
    const semFollowUp = leadsValidosPeriodo.filter((lead) => lead.status === "Novo").length;
    const followUpsCrm = leadsValidosPeriodo.filter((lead) => lead.statusCrm === "Follow-ups").length;
    const taxaChurn = leadsValidosPeriodo.length > 0 ? ((churnInativos / leadsValidosPeriodo.length) * 100).toFixed(1) : "0";

    const receitasVisiveis = lancamentosValidosPeriodo.filter((item) => item.tipo === "receita" && !item.oculto);
    const despesasVisiveis = lancamentosValidosPeriodo.filter((item) => item.tipo === "despesa" && !item.oculto);

    const receitaRoteiros = receitasVisiveis.reduce((acc, item) => acc + Number(item.valor || 0), 0);
    const viagensEmAndamento = orcamentosAprovadosValidos.length;
    const viagensFinalizadas = orcamentosValidosPeriodo.filter((orc) => orc.statusViagem === "Finalizada").length;

    const statusNoPeriodoMap = new Map<string, number>();
    leadsNoPeriodo.forEach((lead) => {
      statusNoPeriodoMap.set(lead.status, (statusNoPeriodoMap.get(lead.status) || 0) + 1);
    });

    const fechamentosLeads = leadsValidosPeriodo.filter((lead) => lead.status === "Vendido");
    const churnLeads = leadsValidosPeriodo.filter((lead) => lead.status === "Perdido");
    const followUpPendenteLeads = leadsValidosPeriodo.filter((lead) => lead.status === "Novo");

    const viagensAndamentoData = montarSerieMesesContagem(
      inicioGrafico,
      fimFiltro,
      orcamentosAprovadosValidos.map((orc) => orc.dataCriacaoDate)
    );

    // Cálculos financeiros usados no chartByCard e nos grupos de cards
    const comissaoPeriodo = receitasVisiveis
      .filter((item) => item.comissaoValor !== null)
      .reduce((acc, item) => acc + (item.comissaoValor ?? 0), 0);
    const qtdComissoes = receitasVisiveis.filter((item) => item.comissaoValor !== null).length;
    const mediaComissao = qtdComissoes > 0 ? comissaoPeriodo / qtdComissoes : 0;
    const mediaComissaoPerc = qtdComissoes > 0
      ? receitasVisiveis
          .filter((item) => item.comissaoPercentual !== null)
          .reduce((acc, item) => acc + (item.comissaoPercentual ?? 0), 0) /
        receitasVisiveis.filter((item) => item.comissaoPercentual !== null).length
      : 0;
    const despesasPeriodo = despesasVisiveis.reduce((acc, item) => acc + Number(item.valor || 0), 0);
    const saldoPeriodo = comissaoPeriodo - despesasPeriodo;

    // Contagens por status CRM
    const crmNovoLead    = leadsValidosPeriodo.filter((l) => l.statusCrm === "Novo Lead").length;
    const crmQualif      = leadsValidosPeriodo.filter((l) => l.statusCrm === "Qualificação").length;
    const crmReuniao     = leadsValidosPeriodo.filter((l) => l.statusCrm === "Reunião").length;
    const crmFollowUps   = leadsValidosPeriodo.filter((l) => l.statusCrm === "Follow-ups").length;
    const crmFinalizados = leadsValidosPeriodo.filter((l) => l.statusCrm === "Finalizados").length;

    // Contagens por status orçamento
    const orcRascunho  = orcamentosValidosPeriodo.filter((o) => o.status === "Rascunho").length;
    const orcAprovado  = orcamentosValidosPeriodo.filter((o) => o.status === "Aprovado").length;

    const chartByCard: Record<CardKey, Omit<CardChartConfig, "key" | "title" | "value" | "icon">> = {
      totalLeads: {
        barTitle: "Leads por Período",
        pieTitle: "Status dos Leads",
        barData: leadsPorPeriodoData.map((item) => ({ name: item.name, value: item.leads })),
        barName: "Leads",
        pieData: statusLeadsData,
      },
      leadsNovo: {
        barTitle: "Leads Novos por Mês",
        pieTitle: "Leads Novos",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, leadsValidosPeriodo.filter((l) => l.status === "Novo").map((l) => l.criadoDate)),
        barName: "Novo",
        pieData: [{ name: "Novo", value: leadsValidosPeriodo.filter((l) => l.status === "Novo").length }],
      },
      leadsEmContato: {
        barTitle: "Leads Em Contato por Mês",
        pieTitle: "Leads Em Contato",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, leadsValidosPeriodo.filter((l) => l.status === "Em Contato").map((l) => l.criadoDate)),
        barName: "Em Contato",
        pieData: [{ name: "Em Contato", value: leadsValidosPeriodo.filter((l) => l.status === "Em Contato").length }],
      },
      leadsQualificado: {
        barTitle: "Leads Qualificados por Mês",
        pieTitle: "Leads Qualificados",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, leadsValidosPeriodo.filter((l) => l.status === "Qualificado").map((l) => l.criadoDate)),
        barName: "Qualificado",
        pieData: [{ name: "Qualificado", value: leadsValidosPeriodo.filter((l) => l.status === "Qualificado").length }],
      },
      leadsVendido: {
        barTitle: "Fechamentos por Mês",
        pieTitle: "Fechamentos por Atendente",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, fechamentosLeads.map((lead) => lead.criadoDate)),
        barName: "Vendido",
        pieData: (() => {
          const map = new Map<string, number>();
          fechamentosLeads.forEach((lead) => { const nome = lead.atendente || "Sem atendente"; map.set(nome, (map.get(nome) || 0) + 1); });
          return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
        })(),
      },
      crmNovoLead: {
        barTitle: "CRM — Novo Lead por Mês",
        pieTitle: "Novo Lead",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, leadsValidosPeriodo.filter((l) => l.statusCrm === "Novo Lead").map((l) => l.criadoDate)),
        barName: "Novo Lead",
        pieData: [{ name: "Novo Lead", value: leadsValidosPeriodo.filter((l) => l.statusCrm === "Novo Lead").length }],
      },
      crmQualificacao: {
        barTitle: "CRM — Qualificação por Mês",
        pieTitle: "Qualificação",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, leadsValidosPeriodo.filter((l) => l.statusCrm === "Qualificação").map((l) => l.criadoDate)),
        barName: "Qualificação",
        pieData: [{ name: "Qualificação", value: leadsValidosPeriodo.filter((l) => l.statusCrm === "Qualificação").length }],
      },
      crmReuniao: {
        barTitle: "CRM — Reunião por Mês",
        pieTitle: "Reunião",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, leadsValidosPeriodo.filter((l) => l.statusCrm === "Reunião").map((l) => l.criadoDate)),
        barName: "Reunião",
        pieData: [{ name: "Reunião", value: leadsValidosPeriodo.filter((l) => l.statusCrm === "Reunião").length }],
      },
      crmFollowUps: {
        barTitle: "CRM — Follow-ups por Mês",
        pieTitle: "Follow-ups",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, leadsValidosPeriodo.filter((l) => l.statusCrm === "Follow-ups").map((l) => l.criadoDate)),
        barName: "Follow-ups",
        pieData: [{ name: "Follow-ups", value: leadsValidosPeriodo.filter((l) => l.statusCrm === "Follow-ups").length }],
      },
      crmFinalizados: {
        barTitle: "CRM — Finalizados por Mês",
        pieTitle: "Finalizados",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, leadsValidosPeriodo.filter((l) => l.statusCrm === "Finalizados").map((l) => l.criadoDate)),
        barName: "Finalizados",
        pieData: [{ name: "Finalizados", value: leadsValidosPeriodo.filter((l) => l.statusCrm === "Finalizados").length }],
      },
      orcamentosTotal: {
        barTitle: "Orçamentos por Mês",
        pieTitle: "Status dos Orçamentos",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, orcamentosValidosPeriodo.map((o) => o.dataCriacaoDate)),
        barName: "Orçamentos",
        pieData: (() => {
          const map = new Map<string, number>();
          orcamentosValidosPeriodo.forEach((o) => map.set(o.status, (map.get(o.status) || 0) + 1));
          return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
        })(),
      },
      orcamentosRascunho: {
        barTitle: "Rascunhos por Mês",
        pieTitle: "Rascunhos",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, orcamentosValidosPeriodo.filter((o) => o.status === "Rascunho").map((o) => o.dataCriacaoDate)),
        barName: "Rascunho",
        pieData: [{ name: "Rascunho", value: orcamentosValidosPeriodo.filter((o) => o.status === "Rascunho").length }],
      },
      orcamentosAprovado: {
        barTitle: "Aprovados por Mês",
        pieTitle: "Aprovados",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, orcamentosAprovadosValidos.map((o) => o.dataCriacaoDate)),
        barName: "Aprovado",
        pieData: [{ name: "Aprovado", value: orcamentosAprovadosValidos.length }],
      },
      finReceitas: {
        barTitle: "Receitas por Mês",
        pieTitle: "Composição Financeira",
        barData: montarSerieMesesValor(inicioGrafico, fimFiltro, receitasVisiveis.map((item) => ({ data: item.dataDate, valor: Number(item.valor || 0) }))),
        barName: "Receita (R$)",
        pieData: [
          { name: "Receitas", value: receitasVisiveis.reduce((acc, item) => acc + Number(item.valor || 0), 0) },
          { name: "Despesas", value: despesasVisiveis.reduce((acc, item) => acc + Number(item.valor || 0), 0) },
        ],
      },
      finDespesas: {
        barTitle: "Despesas por Mês",
        pieTitle: "Despesas",
        barData: montarSerieMesesValor(inicioGrafico, fimFiltro, despesasVisiveis.map((item) => ({ data: item.dataDate, valor: Number(item.valor || 0) }))),
        barName: "Despesa (R$)",
        pieData: [{ name: "Despesas", value: despesasPeriodo }],
      },
      finComissao: {
        barTitle: "Comissão por Mês",
        pieTitle: "Comissão",
        barData: montarSerieMesesValor(inicioGrafico, fimFiltro, receitasVisiveis.filter((i) => i.comissaoValor !== null).map((item) => ({ data: item.dataDate, valor: item.comissaoValor ?? 0 }))),
        barName: "Comissão (R$)",
        pieData: [{ name: "Comissão", value: comissaoPeriodo }],
      },
      finSaldo: {
        barTitle: "Saldo (Comissão - Despesas)",
        pieTitle: "Saldo",
        barData: [],
        barName: "Saldo",
        pieData: [
          { name: "Comissão", value: comissaoPeriodo },
          { name: "Despesas", value: despesasPeriodo },
        ],
      },
      receitaRoteiros: {
        barTitle: "Receita de Roteiros por Mês",
        pieTitle: "Composição Financeira",
        barData: montarSerieMesesValor(inicioGrafico, fimFiltro, receitasVisiveis.map((item) => ({ data: item.dataDate, valor: Number(item.valor || 0) }))),
        barName: "Receita (R$)",
        pieData: [
          { name: "Receitas", value: receitasVisiveis.reduce((acc, item) => acc + Number(item.valor || 0), 0) },
          { name: "Despesas", value: despesasVisiveis.reduce((acc, item) => acc + Number(item.valor || 0), 0) },
        ],
      },
      // legado
      leadsPeriodo: {
        barTitle: "Leads no Filtro por Mês",
        pieTitle: "Status no Período Selecionado",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, leadsNoPeriodo.map((lead) => parseDate(lead.criadoEm)).filter((data): data is Date => data !== null)),
        barName: "Leads no período",
        pieData: Array.from(statusNoPeriodoMap.entries()).map(([name, value]) => ({ name, value })),
      },
      fechamentos: {
        barTitle: "Fechamentos por Mês",
        pieTitle: "Fechamentos por Atendente",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, fechamentosLeads.map((lead) => lead.criadoDate)),
        barName: "Fechamentos",
        pieData: (() => {
          const map = new Map<string, number>();
          fechamentosLeads.forEach((lead) => { const nome = lead.atendente || "Sem atendente"; map.set(nome, (map.get(nome) || 0) + 1); });
          return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
        })(),
      },
      churnInativos: {
        barTitle: "Churn por Mês",
        pieTitle: "Churn por Atendente",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, churnLeads.map((lead) => lead.criadoDate)),
        barName: "Churn",
        pieData: (() => {
          const map = new Map<string, number>();
          churnLeads.forEach((lead) => { const nome = lead.atendente || "Sem atendente"; map.set(nome, (map.get(nome) || 0) + 1); });
          return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
        })(),
      },
      semFollowUp: {
        barTitle: "Leads Sem Follow-up por Mês",
        pieTitle: "Follow-up dos Leads",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, followUpPendenteLeads.map((lead) => lead.criadoDate)),
        barName: "Sem follow-up",
        pieData: [
          { name: "Sem follow-up", value: followUpPendenteLeads.length },
          { name: "Com follow-up", value: Math.max(leadsValidosPeriodo.length - followUpPendenteLeads.length, 0) },
        ],
      },
      viagensAndamento: {
        barTitle: "Viagens em Andamento (Orçamentos Aprovados) por Mês",
        pieTitle: "Status das Vendas",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, orcamentosAprovadosValidos.map((orc) => orc.dataCriacaoDate)),
        barName: "Vendas aprovadas",
        pieData: [
          { name: "Vendas aprovadas", value: orcamentosAprovadosValidos.length },
          { name: "Outras vendas", value: Math.max(orcamentosValidosPeriodo.length - orcamentosAprovadosValidos.length, 0) },
        ],
      },
      viagensFinalizadas: {
        barTitle: "Viagens Finalizadas por Mês",
        pieTitle: "Situação das Vendas",
        barData: montarSerieMesesContagem(inicioGrafico, fimFiltro, orcamentosValidosPeriodo.filter((orc) => orc.statusViagem === "Finalizada").map((orc) => orc.dataCriacaoDate)),
        barName: "Finalizadas",
        pieData: [
          { name: "Finalizadas", value: viagensFinalizadas },
          { name: "Em andamento", value: orcamentosAprovadosValidos.length },
        ],
      },
    };

    type GrupoCard = {
      titulo: string;
      cor: string;
      corTitulo: string;
      cards: { key: CardKey; title: string; value: string; subtitle?: string; icon: JSX.Element }[];
    };

    const gruposCards: GrupoCard[] = [
      {
        titulo: "Leads",
        cor: "border-blue-200 bg-blue-50/40",
        corTitulo: "text-blue-700",
        cards: [
          { key: "totalLeads"      as const, title: "Total",       value: String(leadsValidosPeriodo.length),                                        icon: <Users      className="h-4 w-4 text-blue-500" /> },
          { key: "leadsNovo"       as const, title: "Novo",        value: String(leadsValidosPeriodo.filter((l) => l.status === "Novo").length),      icon: <UserPlus   className="h-4 w-4 text-sky-500" /> },
          { key: "leadsEmContato"  as const, title: "Em Contato",  value: String(leadsValidosPeriodo.filter((l) => l.status === "Em Contato").length),icon: <PhoneOff   className="h-4 w-4 text-indigo-500" /> },
          { key: "leadsQualificado"as const, title: "Qualificado", value: String(leadsValidosPeriodo.filter((l) => l.status === "Qualificado").length),icon: <ClipboardList className="h-4 w-4 text-purple-500" /> },
          { key: "leadsVendido"    as const, title: "Vendido",     value: String(fechamentos),                                                        icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
        ],
      },
      {
        titulo: "CRM",
        cor: "border-violet-200 bg-violet-50/40",
        corTitulo: "text-violet-700",
        cards: [
          { key: "crmNovoLead"   as const, title: "Novo Lead",    value: String(crmNovoLead),    icon: <UserPlus     className="h-4 w-4 text-violet-500" /> },
          { key: "crmQualificacao"as const, title: "Qualificação", value: String(crmQualif),      icon: <ClipboardList className="h-4 w-4 text-violet-500" /> },
          { key: "crmReuniao"    as const, title: "Reunião",      value: String(crmReuniao),     icon: <Users        className="h-4 w-4 text-violet-500" /> },
          { key: "crmFollowUps"  as const, title: "Follow-ups",   value: String(crmFollowUps),   icon: <PhoneOff     className="h-4 w-4 text-orange-500" /> },
          { key: "crmFinalizados"as const, title: "Finalizados",  value: String(crmFinalizados), icon: <CheckCircle2 className="h-4 w-4 text-violet-500" /> },
        ],
      },
      {
        titulo: "Orçamentos",
        cor: "border-sky-200 bg-sky-50/40",
        corTitulo: "text-sky-700",
        cards: [
          { key: "orcamentosTotal"    as const, title: "Total",        value: String(orcamentosValidosPeriodo.length), icon: <ClipboardList className="h-4 w-4 text-sky-500" /> },
          { key: "orcamentosRascunho" as const, title: "Rascunho",     value: String(orcRascunho),                     icon: <UserX         className="h-4 w-4 text-gray-500" /> },
          { key: "orcamentosAprovado" as const, title: "Aprovado",     value: String(orcAprovado),                     icon: <CheckCircle2  className="h-4 w-4 text-green-500" /> },
          { key: "viagensAndamento"   as const, title: "Em Andamento", value: String(viagensEmAndamento),               icon: <Plane         className="h-4 w-4 text-sky-500" /> },
          { key: "viagensFinalizadas" as const, title: "Finalizadas",  value: String(viagensFinalizadas),               icon: <CheckCircle2  className="h-4 w-4 text-teal-500" /> },
        ],
      },
      {
        titulo: "Financeiro",
        cor: "border-emerald-200 bg-emerald-50/40",
        corTitulo: "text-emerald-700",
        cards: [
          { key: "finReceitas"   as const, title: "Receitas",  value: formatarMoeda(receitaRoteiros),    icon: <TrendingUp   className="h-4 w-4 text-green-500" /> },
          { key: "finDespesas"   as const, title: "Despesas",  value: formatarMoeda(despesasPeriodo),    icon: <TrendingDown className="h-4 w-4 text-red-500" /> },
          { key: "finComissao"   as const, title: "Comissão",  value: formatarMoeda(comissaoPeriodo),    icon: <DollarSign   className="h-4 w-4 text-blue-500" /> },
          { key: "finSaldo"      as const, title: "Saldo",     value: formatarMoeda(saldoPeriodo),       icon: <DollarSign   className="h-4 w-4 text-emerald-500" /> },
          { key: "receitaRoteiros"as const, title: "Média Comissão", value: formatarMoeda(mediaComissao), subtitle: mediaComissaoPerc > 0 ? `${mediaComissaoPerc.toFixed(1)}% médio` : undefined, icon: <TrendingUp className="h-4 w-4 text-purple-500" /> },
        ],
      },
    ];

    return {
      cardData: gruposCards.flatMap((g) => g.cards),
      gruposCards,
      chartByCard,
    };
  }, [activeFilter, customDataInicio, customDataFim, leads, lancamentos, orcamentos]);

  const activeChart = useMemo(() => {
    return dadosDashboard.chartByCard[activeCard];
  }, [dadosDashboard.chartByCard, activeCard]);

  const tableData = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    const { inicio: inicioFiltro, fim: fimFiltro } = resolverDataInicialPorFiltro(activeFilter, hoje);

    const inicioEfetivo: Date | null =
      activeFilter === "Personalizado" && customDataInicio
        ? (() => { const d = new Date(`${customDataInicio}T00:00:00`); return Number.isNaN(d.getTime()) ? null : d; })()
        : inicioFiltro;
    const fimEfetivo: Date =
      activeFilter === "Personalizado" && customDataFim
        ? (() => { const d = new Date(`${customDataFim}T23:59:59`); return Number.isNaN(d.getTime()) ? fimFiltro : d; })()
        : fimFiltro;

    const dentroDoFiltro = (dataStr: string) => {
      const d = parseDate(dataStr);
      if (!d) return false;
      if (!inicioEfetivo) return d <= fimEfetivo;
      return d >= inicioEfetivo && d <= fimEfetivo;
    };

    switch (activeCard) {
      case "totalLeads":
        return {
          columns: ["ID", "Cliente", "Status", "Atendente", "Data Criação"],
          rows: leads.filter((lead) => dentroDoFiltro(lead.criadoEm)).map((lead) => [
            lead.id.toString(),
            lead.cliente,
            lead.status,
            lead.atendente || "-",
            new Date(lead.criadoEm).toLocaleDateString("pt-BR"),
          ]),
        };

      case "leadsPeriodo": {
        const leadsNoPeriodo = leads.filter((lead) => dentroDoFiltro(lead.criadoEm));
        return {
          columns: ["ID", "Cliente", "Status", "Atendente", "Data Criação"],
          rows: leadsNoPeriodo.map((lead) => [
            lead.id.toString(),
            lead.cliente,
            lead.status,
            lead.atendente || "-",
            new Date(lead.criadoEm).toLocaleDateString("pt-BR"),
          ]),
        };
      }

      case "fechamentos": {
        const fechamentos = leads.filter((lead) => lead.status === "Vendido" && dentroDoFiltro(lead.criadoEm));
        const receitas = lancamentos.filter((item) => item.tipo === "receita" && !item.oculto && dentroDoFiltro(item.data));
        const despesas = lancamentos.filter((item) => item.tipo === "despesa" && !item.oculto && dentroDoFiltro(item.data));
        return {
          columns: ["Tipo", "Quantidade", "Descrição"],
          rows: [
            ["Fechamentos", fechamentos.length.toString(), "Leads com status Vendido"],
            ["Receitas", receitas.length.toString(), "Lançamentos financeiros de receita"],
            ["Despesas", despesas.length.toString(), "Lançamentos financeiros de despesa"],
          ],
        };
      }

      case "churnInativos": {
        const churn = leads.filter((lead) => lead.status === "Perdido" && dentroDoFiltro(lead.criadoEm));
        const totalPeriodo = leads.filter((lead) => dentroDoFiltro(lead.criadoEm)).length;
        return {
          columns: ["Tipo", "Quantidade", "Descrição"],
          rows: [
            ["Churn Inativos", churn.length.toString(), "Leads com status Perdido"],
            ["Taxa de Churn", `${totalPeriodo > 0 ? ((churn.length / totalPeriodo) * 100).toFixed(1) : 0}%`, "Percentual em relação ao total de leads no período"],
          ],
        };
      }

      case "receitaRoteiros": {
        const receitas = lancamentos.filter((item) => item.tipo === "receita" && !item.oculto && dentroDoFiltro(item.data));
        return {
          columns: ["ID", "Descrição", "Valor", "Comissão", "Data"],
          rows: receitas.map((item) => [
            item.id.toString(),
            item.descricao,
            formatarMoeda(Number(item.valor || 0)),
            item.comissaoValor !== null ? formatarMoeda(item.comissaoValor) : "-",
            new Date(item.data).toLocaleDateString("pt-BR"),
          ]),
        };
      }

      case "finReceitas": {
        const receitas = lancamentos.filter((item) => item.tipo === "receita" && !item.oculto && dentroDoFiltro(item.data));
        return {
          columns: ["ID", "Descrição", "Valor", "Data", "Cliente"],
          rows: receitas.map((item) => [
            item.id.toString(),
            item.descricao,
            formatarMoeda(Number(item.valor || 0)),
            new Date(item.data).toLocaleDateString("pt-BR"),
            item.cliente || "-",
          ]),
        };
      }

      case "finDespesas": {
        const despesas = lancamentos.filter((item) => item.tipo === "despesa" && !item.oculto && dentroDoFiltro(item.data));
        return {
          columns: ["ID", "Descrição", "Valor", "Data"],
          rows: despesas.map((item) => [
            item.id.toString(),
            item.descricao,
            formatarMoeda(Number(item.valor || 0)),
            new Date(item.data).toLocaleDateString("pt-BR"),
          ]),
        };
      }

      case "finComissao": {
        const comissoes = lancamentos.filter((item) => item.tipo === "receita" && !item.oculto && item.comissaoValor !== null && dentroDoFiltro(item.data));
        return {
          columns: ["ID", "Descrição", "Valor Receita", "Comissão", "% Comissão", "Data"],
          rows: comissoes.map((item) => [
            item.id.toString(),
            item.descricao,
            formatarMoeda(Number(item.valor || 0)),
            formatarMoeda(item.comissaoValor ?? 0),
            item.comissaoPercentual !== null ? `${item.comissaoPercentual}%` : "-",
            new Date(item.data).toLocaleDateString("pt-BR"),
          ]),
        };
      }

      case "finSaldo": {
        const receitas = lancamentos.filter((item) => item.tipo === "receita" && !item.oculto && dentroDoFiltro(item.data));
        const despesas = lancamentos.filter((item) => item.tipo === "despesa" && !item.oculto && dentroDoFiltro(item.data));
        const totalComissao = receitas.filter((i) => i.comissaoValor !== null).reduce((acc, i) => acc + (i.comissaoValor ?? 0), 0);
        const totalDespesas = despesas.reduce((acc, i) => acc + Number(i.valor || 0), 0);
        return {
          columns: ["Tipo", "Valor"],
          rows: [
            ["Total Comissões", formatarMoeda(totalComissao)],
            ["Total Despesas", formatarMoeda(totalDespesas)],
            ["Saldo (Comissão - Despesas)", formatarMoeda(totalComissao - totalDespesas)],
          ],
        };
      }
case "leadsNovo":
      case "leadsEmContato":
      case "leadsQualificado":
      case "leadsVendido": {
        const statusMap: Record<string, string> = {
          totalLeads: "",
          leadsNovo: "Novo",
          leadsEmContato: "Em Contato",
          leadsQualificado: "Qualificado",
          leadsVendido: "Vendido",
        };
        const statusFiltro = statusMap[activeCard];
        const lista = leads.filter((lead) =>
          dentroDoFiltro(lead.criadoEm) && (statusFiltro === "" || lead.status === statusFiltro)
        );
        return {
          columns: ["ID", "Nome", "Status", "Atendente", "Data Criação"],
          rows: lista.map((lead) => [
            lead.id.toString(),
            lead.nome,
            lead.status,
            lead.atendente || "-",
            new Date(lead.criadoEm).toLocaleDateString("pt-BR"),
          ]),
        };
      }

      case "crmNovoLead":
      case "crmQualificacao":
      case "crmReuniao":
      case "crmFollowUps":
      case "crmFinalizados": {
        const crmMap: Record<string, string> = {
          crmNovoLead: "Novo Lead",
          crmQualificacao: "Qualificação",
          crmReuniao: "Reunião",
          crmFollowUps: "Follow-ups",
          crmFinalizados: "Finalizados",
        };
        const statusCrm = crmMap[activeCard];
        const lista = leads.filter((lead) => lead.statusCrm === statusCrm && dentroDoFiltro(lead.criadoEm));
        return {
          columns: ["ID", "Nome", "Status Lead", "Status CRM", "Atendente", "Data Criação"],
          rows: lista.map((lead) => [
            lead.id.toString(),
            lead.nome,
            lead.status,
            lead.statusCrm,
            lead.atendente || "-",
            new Date(lead.criadoEm).toLocaleDateString("pt-BR"),
          ]),
        };
      }

      case "orcamentosTotal":
      case "orcamentosRascunho":
      case "orcamentosAprovado": {
        const statusMap: Record<string, string> = {
          orcamentosTotal: "",
          orcamentosRascunho: "Rascunho",
          orcamentosAprovado: "Aprovado",
        };
        const statusFiltro = statusMap[activeCard];
        const lista = orcamentos.filter((orc) =>
          dentroDoFiltro(orc.dataCriacao) && (statusFiltro === "" || orc.status === statusFiltro)
        );
        return {
          columns: ["Número", "Cliente", "Destino", "Status", "Data Criação"],
          rows: lista.map((orc) => [
            orc.numero,
            orc.cliente,
            orc.destino || "-",
            orc.status,
            new Date(orc.dataCriacao).toLocaleDateString("pt-BR"),
          ]),
        };
      }

      case "viagensAndamento": {
        const orcamentosAprovados = orcamentos.filter((orc) => orc.status === "Aprovado" && dentroDoFiltro(orc.dataCriacao));
        return {
          columns: ["Número", "Cliente", "Destino", "Status", "Data Criação"],
          rows: orcamentosAprovados.map((orc) => [
            orc.numero,
            orc.cliente,
            orc.destino || "-",
            orc.status,
            new Date(orc.dataCriacao).toLocaleDateString("pt-BR"),
          ]),
        };
      }

      case "semFollowUp": {
        const semFollowUp = leads.filter((lead) => lead.status === "Novo" && dentroDoFiltro(lead.criadoEm)).length;
        const followUpsCrm = leads.filter((lead) => lead.statusCrm === "Follow-ups" && dentroDoFiltro(lead.criadoEm)).length;
        return {
          columns: ["Tipo", "Quantidade", "Descrição"],
          rows: [
            ["Sem Follow-up", semFollowUp.toString(), "Leads com status Novo"],
            ["Follow-ups CRM", followUpsCrm.toString(), "Leads com statusCrm Follow-ups"],
          ],
        };
      }

      case "viagensFinalizadas": {
        const finalizadas = orcamentos.filter((orc) => orc.statusViagem === "Finalizada" && dentroDoFiltro(orc.dataCriacao));
        return {
          columns: ["Número", "Cliente", "Destino", "Check-in", "Check-out"],
          rows: finalizadas.map((orc) => {
            const { checkin, checkout } = extrairDatasViagem(orc);
            const fmt = (d: string | null) =>
              d ? new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR") : "-";
            return [
              orc.numero,
              orc.cliente,
              orc.destino || "-",
              fmt(checkin),
              fmt(checkout),
            ];
          }),
        };
      }

      default:
        return {
          columns: [],
          rows: [],
        };
    }
  }, [activeCard, activeFilter, customDataInicio, customDataFim, leads, lancamentos, orcamentos]);

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      {/* Cotação do Dólar */}
      <DolarWidget />

      {/* Visão Geral — card colapsável */}
      <Card className="border border-gray-200">
        <CardContent className="py-2 px-4">
          {/* Barra de título */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">Visão Geral</h2>
              {/* Filtros de período sempre visíveis */}
              <div className="flex flex-wrap items-center gap-1">
                {periodFilters.map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                    className="h-7 px-2 text-xs sm:px-3 sm:text-sm"
                  >
                    {filter}
                  </Button>
                ))}
              </div>
              {/* Inputs de data para filtro personalizado */}
              {activeFilter === "Personalizado" && (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-500 whitespace-nowrap">De:</label>
                    <input
                      type="date"
                      value={customDataInicio}
                      onChange={(e) => setCustomDataInicio(e.target.value)}
                      className="h-7 rounded border border-gray-300 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Até:</label>
                    <input
                      type="date"
                      value={customDataFim}
                      onChange={(e) => setCustomDataFim(e.target.value)}
                      className="h-7 rounded border border-gray-300 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setExpandidoVisaoGeral((v) => !v)}
              title={expandidoVisaoGeral ? "Minimizar" : "Expandir"}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-600 text-xs font-bold shadow-sm"
            >
              {expandidoVisaoGeral ? "?" : "?"}
            </button>
          </div>

          {/* Conteúdo expandido */}
          {expandidoVisaoGeral && (
            <div className="mt-4 space-y-5">
              {/* Grupos de Cards por categoria */}
              {dadosDashboard.gruposCards.map((grupo) => (
                <div key={grupo.titulo}>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${grupo.corTitulo}`}>
                    {grupo.titulo}
                  </h3>
                  <div className={`grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 rounded-xl border p-2 ${grupo.cor}`}>
                    {grupo.cards.map((card) => (
                      <Card
                        key={card.key}
                        className={`cursor-pointer transition-all ${activeCard === card.key ? "ring-2 ring-blue-500 bg-blue-50/50" : "hover:shadow-md"}`}
                        onClick={() => setActiveCard(card.key)}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
                          <CardTitle className="text-xs font-medium leading-tight text-muted-foreground">
                            {card.title}
                          </CardTitle>
                          {card.icon}
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                          <div className="text-base sm:text-xl font-bold truncate">
                            {loading ? "..." : card.value}
                          </div>
                          {!loading && card.subtitle && (
                            <div className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}

              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6 text-sm text-red-700">
                    {error}
                  </CardContent>
                </Card>
              )}

              {/* Seção de Gráficos */}
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <Card className="col-span-1 lg:col-span-4">
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-base">{activeChart.barTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={activeChart.barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#3b82f6" name={activeChart.barName} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="col-span-1 lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-base">{activeChart.pieTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={activeChart.pieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                          {activeChart.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de Dados */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes - {dadosDashboard.cardData.find(c => c.key === activeCard)?.title || "Dados"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {tableData.columns.map((column, index) => (
                            <TableHead key={index}>{column}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableData.rows.length > 0 ? (
                          tableData.rows.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex}>{cell}</TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={tableData.columns.length} className="text-center text-gray-500 py-4">
                              Nenhum dado disponível
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


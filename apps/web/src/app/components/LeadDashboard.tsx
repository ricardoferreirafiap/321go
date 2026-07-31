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
  const [expandido, setExpandido] = useState(true);
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
            {expandido ? "▲" : "▼"}
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
                {/* ── Linha de cotações ── */}
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
                  <div className="ml-auto flex flex-col items-end gap-1">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
const MOEDAS = [
  { code: "BRL", label: "Real Brasileiro", flag: "🇧🇷" },
  { code: "USD", label: "Dólar Americano", flag: "🇺🇸" },
  { code: "EUR", label: "Euro", flag: "🇪🇺" },
  { code: "GBP", label: "Libra Esterlina", flag: "🇬🇧" },
  { code: "ARS", label: "Peso Argentino", flag: "🇦🇷" },
  { code: "CAD", label: "Dólar Canadense", flag: "🇨🇦" },
  { code: "AUD", label: "Dólar Australiano", flag: "🇦🇺" },
  { code: "JPY", label: "Iene Japonês", flag: "🇯🇵" },
  { code: "CHF", label: "Franco Suíço", flag: "🇨🇭" },
  { code: "CNY", label: "Yuan Chinês", flag: "🇨🇳" },
  { code: "MXN", label: "Peso Mexicano", flag: "🇲🇽" },
  { code: "CLP", label: "Peso Chileno", flag: "🇨🇱" },
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
      // Busca cotação comercial + turismo em paralelo (turismo só para USD→BRL)
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
            {expandido ? "▲" : "▼"}
          </button>
        </div>

        {/* Corpo expandido */}
        {expandido && (
          <div className="mt-2 space-y-3">
            {/* ── Linha de inputs ── */}
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
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
                ⇄
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

            {/* ── Breakdown de IOF — aparece apenas quando há resultado em BRL ── */}
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
                    <span className="text-xs text-muted-foreground">💳 Cartão de Crédito</span>
                    <span className="text-base font-bold text-blue-800">
                      {comCredito !== null ? formatMoeda(comCredito, "BRL") : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      IOF {IOF.credito}% · +{comCredito !== null ? formatMoeda(comCredito - semIof, "BRL") : "—"}
                    </span>
                  </div>

                  {/* Cartão de Débito / Pré-pago */}
                  <div className="flex flex-col rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2">
                    <span className="text-xs text-muted-foreground">💳 Débito / Pré-pago</span>
                    <span className="text-base font-bold text-indigo-800">
                      {comDebito !== null ? formatMoeda(comDebito, "BRL") : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      IOF {IOF.debito}% · +{comDebito !== null ? formatMoeda(comDebito - semIof, "BRL") : "—"}
                    </span>
                  </div>

                  {/* Dinheiro / Espécie */}
                  <div className="flex flex-col rounded-md border border-green-100 bg-green-50 px-3 py-2">
                    <span className="text-xs text-muted-foreground">💵 Dinheiro / Espécie</span>
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

const periodFilters = ["Mês", "3m", "6m", "12m", "Tudo"];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const MESES_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type CardKey =
  | "totalLeads"
  | "leadsPeriodo"
  | "fechamentos"
  | "churnInativos"
  | "receitaRoteiros"
  | "viagensAndamento"
  | "semFollowUp"
  | "viagensFinalizadas";

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

function resolverDataInicialPorFiltro(activeFilter: string, hoje: Date) {
  const dataBase = new Date(hoje);

  if (activeFilter === "Mês") {
    dataBase.setDate(1);
    dataBase.setHours(0, 0, 0, 0);
    return dataBase;
  }

  if (activeFilter === "3m") {
    dataBase.setMonth(dataBase.getMonth() - 2);
  } else if (activeFilter === "6m") {
    dataBase.setMonth(dataBase.getMonth() - 5);
  } else if (activeFilter === "12m") {
    dataBase.setMonth(dataBase.getMonth() - 11);
  } else {
    return null;
  }

  dataBase.setDate(1);
  dataBase.setHours(0, 0, 0, 0);
  return dataBase;
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

export default function LeadDashboard() {
  const [expandidoVisaoGeral, setExpandidoVisaoGeral] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Mês");
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

    const inicioFiltro = resolverDataInicialPorFiltro(activeFilter, hoje);

    const leadsNoPeriodo = leads.filter((lead) => {
      const dataLead = parseDate(lead.criadoEm);
      if (!dataLead) return false;
      if (!inicioFiltro) return true;
      return dataLead >= inicioFiltro && dataLead <= hoje;
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

    const leadsPorPeriodoData = montarSerieMeses(inicioGrafico, hoje, leads);

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

    const orcamentosAprovadosValidos = orcamentosValidos.filter((orc) => orc.status === "Aprovado");

    const statusLeadsMap = new Map<string, number>();
    leads.forEach((lead) => {
      statusLeadsMap.set(lead.status, (statusLeadsMap.get(lead.status) || 0) + 1);
    });

    const statusLeadsData = Array.from(statusLeadsMap.entries()).map(([name, value]) => ({ name, value }));

    const fechamentos = leads.filter((lead) => lead.status === "Vendido").length;
    const churnInativos = leads.filter((lead) => lead.status === "Perdido").length;
    const semFollowUp = leads.filter((lead) => lead.status === "Novo").length;
    const followUpsCrm = leads.filter((lead) => lead.statusCrm === "Follow-ups").length;
    const taxaChurn = leads.length > 0 ? ((churnInativos / leads.length) * 100).toFixed(1) : "0";

    const receitaRoteiros = lancamentos
      .filter((item) => item.tipo === "receita" && !item.oculto)
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const orcamentosAprovados = orcamentos.filter((orc) => orc.status === "Aprovado");
    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);
    
    const viagensEmAndamento = orcamentosAprovados.length;
    const viagensFinalizadas = 0;

    const statusNoPeriodoMap = new Map<string, number>();
    leadsNoPeriodo.forEach((lead) => {
      statusNoPeriodoMap.set(lead.status, (statusNoPeriodoMap.get(lead.status) || 0) + 1);
    });

    const fechamentosLeads = leadsValidos.filter((lead) => lead.status === "Vendido");
    const churnLeads = leadsValidos.filter((lead) => lead.status === "Perdido");
    const followUpPendenteLeads = leadsValidos.filter((lead) => lead.status === "Novo");

    const receitasVisiveis = lancamentosValidos.filter((item) => item.tipo === "receita" && !item.oculto);
    const despesasVisiveis = lancamentosValidos.filter((item) => item.tipo === "despesa" && !item.oculto);

    const viagensAndamentoData = montarSerieMesesContagem(
      inicioGrafico,
      hoje,
      orcamentosAprovadosValidos.map((orc) => orc.dataCriacaoDate)
    );

    const chartByCard: Record<CardKey, Omit<CardChartConfig, "key" | "title" | "value" | "icon">> = {
      totalLeads: {
        barTitle: "Leads por Período",
        pieTitle: "Status dos Leads",
        barData: leadsPorPeriodoData.map((item) => ({ name: item.name, value: item.leads })),
        barName: "Leads",
        pieData: statusLeadsData,
      },
      leadsPeriodo: {
        barTitle: "Leads no Filtro por Mês",
        pieTitle: "Status no Período Selecionado",
        barData: montarSerieMesesContagem(
          inicioFiltro || inicioGrafico,
          hoje,
          leadsNoPeriodo
            .map((lead) => parseDate(lead.criadoEm))
            .filter((data): data is Date => data !== null)
        ),
        barName: "Leads no período",
        pieData: Array.from(statusNoPeriodoMap.entries()).map(([name, value]) => ({ name, value })),
      },
      fechamentos: {
        barTitle: "Fechamentos por Mês",
        pieTitle: "Fechamentos por Atendente",
        barData: montarSerieMesesContagem(
          inicioGrafico,
          hoje,
          fechamentosLeads.map((lead) => lead.criadoDate)
        ),
        barName: "Fechamentos",
        pieData: (() => {
          const map = new Map<string, number>();
          fechamentosLeads.forEach((lead) => {
            const nome = lead.atendente || "Sem atendente";
            map.set(nome, (map.get(nome) || 0) + 1);
          });
          return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
        })(),
      },
      churnInativos: {
        barTitle: "Churn por Mês",
        pieTitle: "Churn por Atendente",
        barData: montarSerieMesesContagem(
          inicioGrafico,
          hoje,
          churnLeads.map((lead) => lead.criadoDate)
        ),
        barName: "Churn",
        pieData: (() => {
          const map = new Map<string, number>();
          churnLeads.forEach((lead) => {
            const nome = lead.atendente || "Sem atendente";
            map.set(nome, (map.get(nome) || 0) + 1);
          });
          return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
        })(),
      },
      receitaRoteiros: {
        barTitle: "Receita de Roteiros por Mês",
        pieTitle: "Composição Financeira",
        barData: montarSerieMesesValor(
          inicioGrafico,
          hoje,
          receitasVisiveis.map((item) => ({ data: item.dataDate, valor: Number(item.valor || 0) }))
        ),
        barName: "Receita (R$)",
        pieData: [
          {
            name: "Receitas",
            value: receitasVisiveis.reduce((acc, item) => acc + Number(item.valor || 0), 0),
          },
          {
            name: "Despesas",
            value: despesasVisiveis.reduce((acc, item) => acc + Number(item.valor || 0), 0),
          },
        ],
      },
      viagensAndamento: {
        barTitle: "Viagens em Andamento (Orçamentos Aprovados) por Mês",
        pieTitle: "Status das Vendas",
        barData: viagensAndamentoData,
        barName: "Vendas aprovadas",
        pieData: [
          { name: "Vendas aprovadas", value: orcamentosAprovadosValidos.length },
          { name: "Outras vendas", value: Math.max(orcamentosValidos.length - orcamentosAprovadosValidos.length, 0) },
        ],
      },
      semFollowUp: {
        barTitle: "Leads Sem Follow-up por Mês",
        pieTitle: "Follow-up dos Leads",
        barData: montarSerieMesesContagem(
          inicioGrafico,
          hoje,
          followUpPendenteLeads.map((lead) => lead.criadoDate)
        ),
        barName: "Sem follow-up",
        pieData: [
          { name: "Sem follow-up", value: followUpPendenteLeads.length },
          { name: "Com follow-up", value: Math.max(leads.length - followUpPendenteLeads.length, 0) },
        ],
      },
      viagensFinalizadas: {
        barTitle: "Viagens Finalizadas por Mês",
        pieTitle: "Situação das Vendas",
        barData: montarSerieMesesContagem(
          inicioGrafico,
          hoje,
          []
        ),
        barName: "Finalizadas",
        pieData: [
          { name: "Finalizadas", value: 0 },
          { name: "Em andamento", value: orcamentosAprovadosValidos.length },
        ],
      },
    };

    return {
      cardData: [
        { key: "totalLeads" as const, title: "Total de Leads", value: String(leads.length), icon: <Users className="h-4 w-4 text-blue-500" /> },
        { key: "leadsPeriodo" as const, title: "Lead no Período", value: String(leadsNoPeriodo.length), icon: <UserPlus className="h-4 w-4 text-green-500" /> },
        { key: "fechamentos" as const, title: "Fechamentos", value: `${fechamentos} • R: ${receitasVisiveis.length} D: ${despesasVisiveis.length}`, icon: <DollarSign className="h-4 w-4 text-emerald-500" /> },
        { key: "churnInativos" as const, title: "Churn Inativos", value: `${churnInativos} (${taxaChurn}%)`, icon: <UserX className="h-4 w-4 text-red-500" /> },
        { key: "receitaRoteiros" as const, title: "Receita Roteiros", value: formatarMoeda(receitaRoteiros), icon: <ClipboardList className="h-4 w-4 text-purple-500" /> },
        { key: "viagensAndamento" as const, title: "Viagens em Andamento", value: String(viagensEmAndamento), icon: <Plane className="h-4 w-4 text-sky-500" /> },
        { key: "semFollowUp" as const, title: "Sem Follow-up", value: `${semFollowUp} • CRM: ${followUpsCrm}`, icon: <PhoneOff className="h-4 w-4 text-orange-500" /> },
        { key: "viagensFinalizadas" as const, title: "Viagens Finalizadas", value: String(viagensFinalizadas), icon: <CheckCircle2 className="h-4 w-4 text-teal-500" /> },
      ],
      chartByCard,
    };
  }, [activeFilter, leads, lancamentos, orcamentos]);

  const activeChart = useMemo(() => {
    return dadosDashboard.chartByCard[activeCard];
  }, [dadosDashboard.chartByCard, activeCard]);

  const tableData = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    const inicioFiltro = resolverDataInicialPorFiltro(activeFilter, hoje);

    switch (activeCard) {
      case "totalLeads":
        return {
          columns: ["ID", "Cliente", "Status", "Atendente", "Data Criação"],
          rows: leads.map((lead) => [
            lead.id.toString(),
            lead.cliente,
            lead.status,
            lead.atendente || "-",
            new Date(lead.criadoEm).toLocaleDateString("pt-BR"),
          ]),
        };

      case "leadsPeriodo": {
        const leadsNoPeriodo = leads.filter((lead) => {
          const dataLead = parseDate(lead.criadoEm);
          if (!dataLead) return false;
          if (!inicioFiltro) return true;
          return dataLead >= inicioFiltro && dataLead <= hoje;
        });
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
        const fechamentos = leads.filter((lead) => lead.status === "Vendido");
        const receitas = lancamentos.filter((item) => item.tipo === "receita" && !item.oculto);
        const despesas = lancamentos.filter((item) => item.tipo === "despesa" && !item.oculto);
        
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
        const churn = leads.filter((lead) => lead.status === "Perdido");
        return {
          columns: ["Tipo", "Quantidade", "Descrição"],
          rows: [
            ["Churn Inativos", churn.length.toString(), "Leads com status Perdido"],
            ["Taxa de Churn", `${churn.length > 0 ? ((churn.length / leads.length) * 100).toFixed(1) : 0}%`, "Percentual em relação ao total de leads"],
          ],
        };
      }

      case "receitaRoteiros": {
        const receitas = lancamentos.filter((item) => item.tipo === "receita" && !item.oculto);
        return {
          columns: ["ID", "Descrição", "Valor", "Data", "Tipo"],
          rows: receitas.map((item) => [
            item.id.toString(),
            item.descricao,
            formatarMoeda(Number(item.valor || 0)),
            new Date(item.data).toLocaleDateString("pt-BR"),
            item.tipo,
          ]),
        };
      }

      case "viagensAndamento": {
        const orcamentosAprovados = orcamentos.filter((orc) => orc.status === "Aprovado");
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
        const semFollowUp = leads.filter((lead) => lead.status === "Novo").length;
        const followUpsCrm = leads.filter((lead) => lead.statusCrm === "Follow-ups").length;
        return {
          columns: ["Tipo", "Quantidade", "Descrição"],
          rows: [
            ["Sem Follow-up", semFollowUp.toString(), "Leads com status Novo"],
            ["Follow-ups CRM", followUpsCrm.toString(), "Leads com statusCrm Follow-ups"],
          ],
        };
      }

      case "viagensFinalizadas":
        return {
          columns: ["Mensagem"],
          rows: [["Nenhuma viagem finalizada registrada. As viagens finalizadas serão exibidas aqui quando disponíveis."]],
        };

      default:
        return {
          columns: [],
          rows: [],
        };
    }
  }, [activeCard, activeFilter, leads, lancamentos, orcamentos]);

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      {/* Cotação do Dólar */}
      <DolarWidget />

      {/* Conversor de Moedas */}
      <ConversorMoedas />

      {/* Visão Geral — card colapsável */}
      <Card className="border border-gray-200">
        <CardContent className="py-2 px-4">
          {/* Barra de título */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold tracking-tight">Visão Geral</h2>
              {/* Filtros de período sempre visíveis */}
              <div className="flex items-center space-x-2">
                {periodFilters.map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setExpandidoVisaoGeral((v) => !v)}
              title={expandidoVisaoGeral ? "Minimizar" : "Expandir"}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-600 text-xs font-bold shadow-sm"
            >
              {expandidoVisaoGeral ? "▲" : "▼"}
            </button>
          </div>

          {/* Conteúdo expandido */}
          {expandidoVisaoGeral && (
            <div className="mt-4 space-y-4">
              {/* Cards de Métricas */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {dadosDashboard.cardData.map((card) => (
                  <Card
                    key={card.title}
                    className={`cursor-pointer transition-all ${activeCard === card.key ? "ring-2 ring-blue-500 bg-blue-50/50" : "hover:shadow-md"}`}
                    onClick={() => setActiveCard(card.key)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {card.title}
                      </CardTitle>
                      {card.icon}
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loading ? "..." : card.value}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6 text-sm text-red-700">
                    {error}
                  </CardContent>
                </Card>
              )}

              {/* Seção de Gráficos */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>{activeChart.barTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={activeChart.barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#3b82f6" name={activeChart.barName} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>{activeChart.pieTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie data={activeChart.pieData} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
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

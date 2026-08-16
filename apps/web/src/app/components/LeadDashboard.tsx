import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { listarLancamentosFinanceiros, type LancamentoFinanceiro } from "../data/financeiroApi";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

const FILTROS_PERIODO = ["Hoje", "Mês", "Mês Passado", "3m", "6m", "12m", "Tudo", "Personalizado"];
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const CORES_GRAFICO = ["#10b981", "#ef4444", "#3b82f6", "#8b5cf6"];

type CardFinanceiro = "receitas" | "despesas" | "comissao" | "saldo" | "mediaComissao";

interface DadosGrafico {
  tituloBarras: string;
  tituloPizza: string;
  nomeBarras: string;
  barras: Array<{ name: string; value: number }>;
  pizza: Array<{ name: string; value: number }>;
}

interface CardResumo {
  key: CardFinanceiro;
  titulo: string;
  valor: string;
  subtitulo?: string;
  icone: ReactNode;
}

function parseData(valor: string) {
  if (!valor) return null;
  const data = new Date(`${valor.slice(0, 10)}T00:00:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function obterPeriodo(filtro: string, hoje: Date): { inicio: Date | null; fim: Date } {
  const fim = new Date(hoje);
  fim.setHours(23, 59, 59, 999);

  if (filtro === "Hoje") {
    const inicio = new Date(hoje);
    inicio.setHours(0, 0, 0, 0);
    return { inicio, fim };
  }

  if (filtro === "Mês") {
    return { inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1), fim };
  }

  if (filtro === "Mês Passado") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    fimMesPassado.setHours(23, 59, 59, 999);
    return { inicio, fim: fimMesPassado };
  }

  const mesesPorFiltro: Record<string, number> = { "3m": 2, "6m": 5, "12m": 11 };
  if (filtro in mesesPorFiltro) {
    return {
      inicio: new Date(hoje.getFullYear(), hoje.getMonth() - mesesPorFiltro[filtro], 1),
      fim,
    };
  }

  return { inicio: null, fim };
}

function montarSerieMensal(
  inicio: Date,
  fim: Date,
  itens: Array<{ data: Date; valor: number }>,
) {
  const meses: Array<{ chave: string; name: string }> = [];
  const valores = new Map<string, number>();
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  const limite = new Date(fim.getFullYear(), fim.getMonth(), 1);

  while (cursor <= limite) {
    const chave = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    meses.push({ chave, name: MESES[cursor.getMonth()] });
    valores.set(chave, 0);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const item of itens) {
    const chave = `${item.data.getFullYear()}-${String(item.data.getMonth() + 1).padStart(2, "0")}`;
    if (valores.has(chave)) {
      valores.set(chave, (valores.get(chave) || 0) + item.valor);
    }
  }

  return meses.map((mes) => ({ name: mes.name, value: valores.get(mes.chave) || 0 }));
}

export default function LeadDashboard() {
  const [filtroAtivo, setFiltroAtivo] = useState("Mês");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [cardAtivo, setCardAtivo] = useState<CardFinanceiro>("receitas");
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarFinanceiro() {
      setErro(null);
      try {
        setLancamentos(await listarLancamentosFinanceiros());
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro ao carregar os dados financeiros.");
      } finally {
        setCarregando(false);
      }
    }

    carregarFinanceiro();
  }, []);

  const periodo = useMemo(() => {
    const hoje = new Date();
    const periodoBase = obterPeriodo(filtroAtivo, hoje);
    const inicioPersonalizado = filtroAtivo === "Personalizado" ? parseData(dataInicio) : null;
    const fimPersonalizado = filtroAtivo === "Personalizado" ? parseData(dataFim) : null;

    if (fimPersonalizado) fimPersonalizado.setHours(23, 59, 59, 999);
    return {
      inicio: filtroAtivo === "Personalizado" ? inicioPersonalizado : periodoBase.inicio,
      fim: fimPersonalizado || periodoBase.fim,
    };
  }, [dataFim, dataInicio, filtroAtivo]);

  const dashboard = useMemo(() => {
    const lancamentosNoPeriodo = lancamentos
      .map((item) => ({ ...item, dataDate: parseData(item.data) }))
      .filter(
        (item): item is LancamentoFinanceiro & { dataDate: Date } =>
          item.dataDate !== null &&
          (!periodo.inicio || item.dataDate >= periodo.inicio) &&
          item.dataDate <= periodo.fim,
      );
    const receitas = lancamentosNoPeriodo.filter((item) => item.tipo === "receita" && !item.oculto);
    const despesas = lancamentosNoPeriodo.filter((item) => item.tipo === "despesa" && !item.oculto);
    const totalReceitas = receitas.reduce((total, item) => total + Number(item.valor || 0), 0);
    const totalDespesas = despesas.reduce((total, item) => total + Number(item.valor || 0), 0);
    const totalComissao = receitas.reduce((total, item) => total + (item.comissaoValor ?? 0), 0);
    const comissoes = receitas.filter((item) => item.comissaoValor !== null);
    const percentuais = receitas.filter((item) => item.comissaoPercentual !== null);
    const mediaComissao = comissoes.length > 0 ? totalComissao / comissoes.length : 0;
    const mediaPercentual = percentuais.length > 0
      ? percentuais.reduce((total, item) => total + (item.comissaoPercentual ?? 0), 0) / percentuais.length
      : 0;
    const saldo = totalComissao - totalDespesas;

    const datasDisponiveis = lancamentosNoPeriodo.map((item) => item.dataDate);
    const inicioGrafico = periodo.inicio ||
      (datasDisponiveis.length > 0
        ? new Date(Math.min(...datasDisponiveis.map((data) => data.getTime())))
        : new Date(periodo.fim.getFullYear(), periodo.fim.getMonth(), 1));
    const serieReceitas = montarSerieMensal(
      inicioGrafico,
      periodo.fim,
      receitas.map((item) => ({ data: item.dataDate, valor: Number(item.valor || 0) })),
    );
    const serieDespesas = montarSerieMensal(
      inicioGrafico,
      periodo.fim,
      despesas.map((item) => ({ data: item.dataDate, valor: Number(item.valor || 0) })),
    );
    const serieComissao = montarSerieMensal(
      inicioGrafico,
      periodo.fim,
      receitas.map((item) => ({ data: item.dataDate, valor: item.comissaoValor ?? 0 })),
    );
    const serieSaldo = serieComissao.map((item, index) => ({
      name: item.name,
      value: item.value - (serieDespesas[index]?.value || 0),
    }));

    const cards: CardResumo[] = [
      {
        key: "receitas",
        titulo: "Receitas",
        valor: moeda(totalReceitas),
        icone: <TrendingUp className="h-5 w-5 text-emerald-600" />,
      },
      {
        key: "despesas",
        titulo: "Despesas",
        valor: moeda(totalDespesas),
        icone: <TrendingDown className="h-5 w-5 text-red-500" />,
      },
      {
        key: "comissao",
        titulo: "Comissão",
        valor: moeda(totalComissao),
        icone: <DollarSign className="h-5 w-5 text-blue-500" />,
      },
      {
        key: "saldo",
        titulo: "Saldo",
        valor: moeda(saldo),
        icone: <DollarSign className="h-5 w-5 text-emerald-600" />,
      },
      {
        key: "mediaComissao",
        titulo: "Média de comissão",
        valor: moeda(mediaComissao),
        subtitulo: mediaPercentual > 0 ? `${mediaPercentual.toFixed(1)}% médio` : undefined,
        icone: <TrendingUp className="h-5 w-5 text-purple-500" />,
      },
    ];

    const graficos: Record<CardFinanceiro, DadosGrafico> = {
      receitas: {
        tituloBarras: "Receitas por mês",
        tituloPizza: "Composição financeira",
        nomeBarras: "Receitas (R$)",
        barras: serieReceitas,
        pizza: [
          { name: "Receitas", value: totalReceitas },
          { name: "Despesas", value: totalDespesas },
        ],
      },
      despesas: {
        tituloBarras: "Despesas por mês",
        tituloPizza: "Despesas no período",
        nomeBarras: "Despesas (R$)",
        barras: serieDespesas,
        pizza: [{ name: "Despesas", value: totalDespesas }],
      },
      comissao: {
        tituloBarras: "Comissão por mês",
        tituloPizza: "Comissão no período",
        nomeBarras: "Comissão (R$)",
        barras: serieComissao,
        pizza: [{ name: "Comissão", value: totalComissao }],
      },
      saldo: {
        tituloBarras: "Saldo por mês",
        tituloPizza: "Composição do saldo",
        nomeBarras: "Saldo (R$)",
        barras: serieSaldo,
        pizza: [
          { name: "Comissão", value: totalComissao },
          { name: "Despesas", value: totalDespesas },
        ],
      },
      mediaComissao: {
        tituloBarras: "Comissão por mês",
        tituloPizza: "Média de comissão",
        nomeBarras: "Comissão (R$)",
        barras: serieComissao,
        pizza: [{ name: "Média", value: mediaComissao }],
      },
    };

    return { cards, graficos, receitas, despesas };
  }, [lancamentos, periodo]);

  const tabela = useMemo(() => {
    if (cardAtivo === "saldo") {
      const totalComissao = dashboard.receitas.reduce((total, item) => total + (item.comissaoValor ?? 0), 0);
      const totalDespesas = dashboard.despesas.reduce((total, item) => total + Number(item.valor || 0), 0);
      return {
        colunas: ["Tipo", "Valor"],
        linhas: [
          ["Total de comissões", moeda(totalComissao)],
          ["Total de despesas", moeda(totalDespesas)],
          ["Saldo", moeda(totalComissao - totalDespesas)],
        ],
      };
    }

    if (cardAtivo === "despesas") {
      return {
        colunas: ["ID", "Descrição", "Valor", "Data"],
        linhas: dashboard.despesas.map((item) => [
          String(item.id),
          item.descricao,
          moeda(Number(item.valor || 0)),
          item.dataDate.toLocaleDateString("pt-BR"),
        ]),
      };
    }

    const somenteComissao = cardAtivo === "comissao" || cardAtivo === "mediaComissao";
    const receitas = somenteComissao
      ? dashboard.receitas.filter((item) => item.comissaoValor !== null)
      : dashboard.receitas;
    return {
      colunas: ["ID", "Descrição", "Receita", "Comissão", "Data", "Cliente"],
      linhas: receitas.map((item) => [
        String(item.id),
        item.descricao,
        moeda(Number(item.valor || 0)),
        item.comissaoValor !== null ? moeda(item.comissaoValor) : "-",
        item.dataDate.toLocaleDateString("pt-BR"),
        item.cliente || "-",
      ]),
    };
  }, [cardAtivo, dashboard.despesas, dashboard.receitas]);

  const graficoAtivo = dashboard.graficos[cardAtivo];
  const tituloAtivo = dashboard.cards.find((card) => card.key === cardAtivo)?.titulo || "Financeiro";

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 sm:p-8">
      <Card className="border border-emerald-200 bg-emerald-50/30">
        <CardHeader className="gap-4 pb-3">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <CardTitle className="text-xl text-emerald-800 sm:text-2xl">Financeiro</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Visão consolidada de receitas, despesas e comissões.</p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {FILTROS_PERIODO.map((filtro) => (
                <Button
                  key={filtro}
                  variant={filtroAtivo === filtro ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltroAtivo(filtro)}
                  className="h-8 px-2 text-xs sm:px-3"
                >
                  {filtro}
                </Button>
              ))}
            </div>
          </div>
          {filtroAtivo === "Personalizado" && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                De:
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(event) => setDataInicio(event.target.value)}
                  className="h-8 rounded border border-gray-300 bg-white px-2"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600">
                Até:
                <input
                  type="date"
                  value={dataFim}
                  onChange={(event) => setDataFim(event.target.value)}
                  className="h-8 rounded border border-gray-300 bg-white px-2"
                />
              </label>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {dashboard.cards.map((card) => (
              <Card
                key={card.key}
                className={`cursor-pointer bg-white transition-all ${
                  cardAtivo === card.key ? "ring-2 ring-emerald-500" : "hover:shadow-md"
                }`}
                onClick={() => setCardAtivo(card.key)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.titulo}</CardTitle>
                  {card.icone}
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="truncate text-xl font-bold">{carregando ? "..." : card.valor}</div>
                  {!carregando && card.subtitulo && (
                    <p className="mt-1 text-xs text-muted-foreground">{card.subtitulo}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {erro && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">{erro}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">{graficoAtivo.tituloBarras}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={graficoAtivo.barras}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => moeda(Number(value))} />
                <Legend />
                <Bar dataKey="value" fill="#10b981" name={graficoAtivo.nomeBarras} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{graficoAtivo.tituloPizza}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={graficoAtivo.pizza} dataKey="value" nameKey="name" outerRadius={105}>
                  {graficoAtivo.pizza.map((item, index) => (
                    <Cell key={item.name} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => moeda(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhes — {tituloAtivo}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {tabela.colunas.map((coluna) => <TableHead key={coluna}>{coluna}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tabela.linhas.length > 0 ? (
                  tabela.linhas.map((linha, indice) => (
                    <TableRow key={indice}>
                      {linha.map((celula, indiceCelula) => <TableCell key={indiceCelula}>{celula}</TableCell>)}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={tabela.colunas.length} className="py-6 text-center text-gray-500">
                      Nenhum dado financeiro disponível no período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

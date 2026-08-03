import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Download, TrendingUp, UserCheck, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { exportPDF } from "../utils/pdfExport";
import { listarClientes, type Cliente } from "../data/clientesApi";
import { listarOrcamentos, type Orcamento } from "../data/orcamentosApi";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

type PeriodoFiltro = "ultimos-30" | "ultimos-90" | "ultimo-ano";

function parseData(data: string) {
  if (!data) return null;
  const parsed = new Date(`${data}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

function inicioPeriodo(periodo: PeriodoFiltro) {
  const hoje = new Date();
  const inicio = new Date(hoje);

  if (periodo === "ultimos-30") {
    inicio.setDate(hoje.getDate() - 30);
  } else if (periodo === "ultimos-90") {
    inicio.setDate(hoje.getDate() - 90);
  } else {
    inicio.setFullYear(hoje.getFullYear() - 1);
  }

  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

function calcularValorOrcamento(orcamento: Orcamento) {
  const totalItens = (orcamento.itens || []).reduce((acc, item) => {
    const subtotal = Number(item.quantidade || 0) * Number(item.valorUnitario || 0);
    const desconto = subtotal * (Number(item.desconto || 0) / 100);
    return acc + (subtotal - desconto);
  }, 0);

  const totalHospedagem = (orcamento.hospedagem || []).reduce((acc, item: any) => acc + (Number(item?.preco) || 0), 0);
  const totalTransporte = (orcamento.transporte || []).reduce((acc, item: any) => acc + (Number(item?.valor) || 0), 0);
  const totalRestaurante = (orcamento.restaurante || []).reduce((acc, item: any) => acc + (Number(item?.preco) || 0), 0);
  const totalExperiencias = (orcamento.experiencias || []).reduce((acc, item: any) => acc + (Number(item?.preco) || 0), 0);
  const totalSeguro = (orcamento.seguro || []).reduce((acc, item: any) => acc + (Number(item?.valor) || 0), 0);

  return totalItens + totalHospedagem + totalTransporte + totalRestaurante + totalExperiencias + totalSeguro;
}

export default function RelatorioClientes() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("ultimos-90");
  const [estado, setEstado] = useState("todos");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      setErro(null);
      try {
        const [listaClientes, listaOrcamentos] = await Promise.all([listarClientes(), listarOrcamentos()]);
        if (ativo) {
          setClientes(listaClientes);
          setOrcamentos(listaOrcamentos);
        }
      } catch (error) {
        if (ativo) {
          setErro(error instanceof Error ? error.message : "Erro ao carregar relatório de clientes.");
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarDados();

    return () => {
      ativo = false;
    };
  }, []);

  const estados = useMemo(() => {
    const lista = new Set(clientes.map((cliente) => cliente.estado).filter(Boolean));
    return Array.from(lista).sort((a, b) => a.localeCompare(b));
  }, [clientes]);

  const dados = useMemo(() => {
    const inicio = inicioPeriodo(periodo);

    const clientesFiltrados = estado === "todos" ? clientes : clientes.filter((cliente) => cliente.estado === estado);

    const clientesAtivos = clientesFiltrados.filter((cliente) => cliente.status === "Ativo").length;
    const taxaAtivos = clientesFiltrados.length ? (clientesAtivos / clientesFiltrados.length) * 100 : 0;

    const orcamentosPeriodo = orcamentos.filter((orcamento) => {
      if (estado !== "todos") {
        const clienteRelacionado = clientes.find((cliente) => cliente.nomeCompleto === orcamento.cliente);
        if (clienteRelacionado?.estado !== estado) {
          return false;
        }
      }
      const data = parseData(orcamento.dataCriacao);
      return data ? data >= inicio : false;
    });

    const porEstadoMap = new Map<string, number>();
    clientesFiltrados.forEach((cliente) => {
      const uf = cliente.estado || "Sem UF";
      porEstadoMap.set(uf, (porEstadoMap.get(uf) || 0) + 1);
    });

    const clientesPorEstado = Array.from(porEstadoMap.entries())
      .map(([regiao, quantidade]) => ({ regiao, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 6);

    const statusChart = [
      { name: "Ativo", value: clientesFiltrados.filter((cliente) => cliente.status === "Ativo").length },
      { name: "Inativo", value: clientesFiltrados.filter((cliente) => cliente.status === "Inativo").length },
    ].filter((item) => item.value > 0);

    const valorPorClienteMap = new Map<string, { nome: string; valor: number; pedidos: number; status: string }>();
    orcamentosPeriodo.forEach((orcamento) => {
      const valor = calcularValorOrcamento(orcamento);
      const clienteSistema = clientes.find((cliente) => cliente.nomeCompleto === orcamento.cliente);
      const atual = valorPorClienteMap.get(orcamento.cliente) || {
        nome: orcamento.cliente,
        valor: 0,
        pedidos: 0,
        status: clienteSistema?.status || "Inativo",
      };

      atual.valor += valor;
      atual.pedidos += 1;
      valorPorClienteMap.set(orcamento.cliente, atual);
    });

    const topClientes = Array.from(valorPorClienteMap.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);

    const novosClientes = new Set(orcamentosPeriodo.map((orcamento) => orcamento.cliente)).size;

    return {
      totalClientes: clientesFiltrados.length,
      clientesAtivos,
      novosClientes,
      taxaAtivos,
      clientesPorEstado,
      statusChart,
      topClientes,
    };
  }, [clientes, estado, orcamentos, periodo]);

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/relatorios")}
            className="h-9 sm:h-10 w-9 sm:w-10 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Relatório de Clientes</h1>
            <p className="text-xs sm:text-sm text-gray-600">Dados reais do cadastro de clientes e orçamentos</p>
          </div>
        </div>
        <Button
          className="gap-2 text-sm sm:text-base py-2 h-9 sm:h-10 w-full sm:w-auto"
          onClick={() => exportPDF("relatorio-clientes-container", "Relatorio-Clientes.pdf")}
        >
          <Download className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">Exportar PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </div>

      <div id="relatorio-clientes-container">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="flex-1 sm:max-w-xs">
            <label className="text-xs sm:text-sm font-medium text-gray-700 block mb-2">Período</label>
            <Select value={periodo} onValueChange={(value) => setPeriodo(value as PeriodoFiltro)}>
              <SelectTrigger className="h-9 sm:h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ultimos-30">Últimos 30 dias</SelectItem>
                <SelectItem value="ultimos-90">Últimos 90 dias</SelectItem>
                <SelectItem value="ultimo-ano">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 sm:max-w-xs">
            <label className="text-xs sm:text-sm font-medium text-gray-700 block mb-2">UF</label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger className="h-9 sm:h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {estados.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {erro && (
          <Card className="p-4 mb-4 sm:mb-6 border-red-200 bg-red-50 text-red-700 text-sm">
            {erro}
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">Total de Clientes</p>
                <h3 className="text-lg sm:text-2xl font-bold">{dados.totalClientes}</h3>
              </div>
              <Users className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">Clientes Ativos</p>
                <h3 className="text-lg sm:text-2xl font-bold">{dados.clientesAtivos}</h3>
              </div>
              <UserCheck className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-3 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">Clientes com orçamento</p>
            <h3 className="text-lg sm:text-2xl font-bold">{dados.novosClientes}</h3>
            <p className="text-xs sm:text-sm text-gray-600">no período filtrado</p>
          </Card>

          <Card className="p-3 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">Taxa de Ativos</p>
            <h3 className="text-lg sm:text-2xl font-bold">{dados.taxaAtivos.toFixed(1)}%</h3>
            <div className="flex items-center gap-2 text-green-600 mt-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs sm:text-sm">status ativo no cadastro</span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <Card className="p-3 sm:p-6">
            <h3 className="font-semibold text-sm sm:text-lg mb-4">Clientes por UF</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dados.clientesPorEstado}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="regiao" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-3 sm:p-6">
            <h3 className="font-semibold text-sm sm:text-lg mb-4">Status de Clientes</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={dados.statusChart} dataKey="value" nameKey="name" outerRadius={90} label>
                  {dados.statusChart.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-3 sm:p-6">
          <h3 className="font-semibold text-sm sm:text-lg mb-4">Top Clientes por Valor de Orçamento</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700">Cliente</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700">Valor Total</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700">Pedidos</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {dados.topClientes.map((cliente) => (
                  <tr key={cliente.nome} className="border-b hover:bg-gray-50">
                    <td className="py-2 sm:py-3 px-2 sm:px-4">{cliente.nome}</td>
                    <td className="text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold">{formatarMoeda(cliente.valor)}</td>
                    <td className="text-right py-2 sm:py-3 px-2 sm:px-4">{cliente.pedidos}</td>
                    <td className="text-right py-2 sm:py-3 px-2 sm:px-4">
                      <Badge
                        variant={cliente.status === "Ativo" ? "default" : "secondary"}
                        className={cliente.status === "Ativo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {cliente.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {carregando && <p className="text-sm text-gray-500 mt-4">Carregando dados...</p>}
    </div>
  );
}

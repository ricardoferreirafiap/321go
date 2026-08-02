import { useEffect, useMemo, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, X, Pencil, Eye, EyeOff } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  atualizarLancamentoFinanceiro,
  criarLancamentoFinanceiro,
  listarLancamentosFinanceiros,
  type LancamentoFinanceiro,
  type TipoLancamento,
} from "../data/financeiroApi";
import { listarOrcamentos, type Orcamento } from "../data/orcamentosApi";

function calcularTotalItem(item: { quantidade: number; valorUnitario: number; desconto: number }) {
  const subtotal = Number(item.quantidade || 0) * Number(item.valorUnitario || 0);
  const desconto = subtotal * (Number(item.desconto || 0) / 100);
  return subtotal - desconto;
}

function calcularTotalOrcamento(orcamento: Orcamento) {
  const totalItens = (orcamento.itens || []).reduce((acc, item) => acc + calcularTotalItem(item), 0);
  const totalHospedagem = (orcamento.hospedagem || []).reduce((acc, item: any) => acc + (Number(item?.preco) || 0), 0);
  const totalTransporte = (orcamento.transporte || []).reduce((acc, item: any) => acc + (Number(item?.valor) || 0), 0);
  const totalRestaurante = (orcamento.restaurante || []).reduce((acc, item: any) => acc + (Number(item?.preco) || 0), 0);
  const totalExperiencias = (orcamento.experiencias || []).reduce((acc, item: any) => acc + (Number(item?.preco) || 0), 0);
  const totalSeguro = (orcamento.seguro || []).reduce((acc, item: any) => acc + (Number(item?.valor) || 0), 0);

  return totalItens + totalHospedagem + totalTransporte + totalRestaurante + totalExperiencias + totalSeguro;
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data: string) {
  if (!data) return "";
  const date = new Date(`${data}T00:00:00`);
  return date.toLocaleDateString("pt-BR");
}

function parseNumeroInput(valor: string) {
  const valorNormalizado = valor.replace(",", ".").trim();
  if (!valorNormalizado) return null;

  const numero = Number(valorNormalizado);
  return Number.isFinite(numero) ? numero : null;
}

function formatarNumeroInput(valor: number, casasDecimais = 2) {
  return Number(valor.toFixed(casasDecimais)).toString();
}

type OrigemComissao = "percentual" | "valor" | null;

function sincronizarComissaoComValor(
  valorBaseTexto: string,
  origem: OrigemComissao,
  percentualTexto: string,
  valorComissaoTexto: string
) {
  const valorBase = parseNumeroInput(valorBaseTexto);
  const percentual = parseNumeroInput(percentualTexto);
  const valorComissao = parseNumeroInput(valorComissaoTexto);

  if (!valorBase || valorBase <= 0) {
    return {
      percentualComissao: origem === "valor" ? "" : percentualTexto,
      valorComissao: origem === "percentual" ? "" : valorComissaoTexto,
    };
  }

  if (origem === "percentual") {
    return {
      percentualComissao: percentualTexto,
      valorComissao: percentual === null ? "" : formatarNumeroInput((valorBase * percentual) / 100),
    };
  }

  if (origem === "valor") {
    return {
      percentualComissao: valorComissao === null ? "" : formatarNumeroInput((valorComissao / valorBase) * 100),
      valorComissao: valorComissaoTexto,
    };
  }

  if (percentual !== null) {
    return {
      percentualComissao: percentualTexto,
      valorComissao: formatarNumeroInput((valorBase * percentual) / 100),
    };
  }

  if (valorComissao !== null) {
    return {
      percentualComissao: formatarNumeroInput((valorComissao / valorBase) * 100),
      valorComissao: valorComissaoTexto,
    };
  }

  return {
    percentualComissao: percentualTexto,
    valorComissao: valorComissaoTexto,
  };
}

export default function Financeiro() {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [orcamentosAprovados, setOrcamentosAprovados] = useState<Orcamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoLancamento>("receita");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [percentualComissao, setPercentualComissao] = useState("");
  const [valorComissao, setValorComissao] = useState("");
  const [origemComissao, setOrigemComissao] = useState<OrigemComissao>(null);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [orcamentoBusca, setOrcamentoBusca] = useState("");
  const [orcamentoId, setOrcamentoId] = useState<number | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoOculto, setEditandoOculto] = useState(false);
  const [orcamentoPago, setOrcamentoPago] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [parcelas, setParcelas] = useState("1");

  const camposPreenchidosPorOrcamento = tipo === "receita";
  const habilitarDadosPagamento = orcamentoPago;

  useEffect(() => {
    async function carregarDados() {
      setErro(null);
      try {
        const [listaFinanceiro, listaOrcamentos] = await Promise.all([
          listarLancamentosFinanceiros(),
          listarOrcamentos(),
        ]);

        setLancamentos(listaFinanceiro);
        setOrcamentosAprovados(listaOrcamentos.filter((orcamento) => orcamento.status === "Aprovado"));
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro ao carregar dados do financeiro.");
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, []);

  const resumo = useMemo(() => {
    const receitas = lancamentos
      .filter((item) => item.tipo === "receita" && !item.oculto)
      .reduce((acc, item) => acc + item.valor, 0);
    const despesas = lancamentos
      .filter((item) => item.tipo === "despesa" && !item.oculto)
      .reduce((acc, item) => acc + item.valor, 0);
    const lucro = receitas - despesas;

    return {
      receitas,
      despesas,
      lucro,
      saldo: lucro,
    };
  }, [lancamentos]);

  const ultimosLancamentos = useMemo(() => {
    return [...lancamentos]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 8);
  }, [lancamentos]);

  const financialData = [
    {
      icon: DollarSign,
      title: "Receitas",
      value: formatarMoeda(resumo.receitas),
      subtitle: `${lancamentos.filter((item) => item.tipo === "receita" && !item.oculto).length} lançamento(s)`,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: TrendingDown,
      title: "Despesas",
      value: formatarMoeda(resumo.despesas),
      subtitle: `${lancamentos.filter((item) => item.tipo === "despesa" && !item.oculto).length} lançamento(s)`,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      icon: TrendingUp,
      title: "Lucro",
      value: formatarMoeda(resumo.lucro),
      subtitle: resumo.lucro >= 0 ? "Resultado positivo" : "Resultado negativo",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: Wallet,
      title: "Saldo",
      value: formatarMoeda(resumo.saldo),
      subtitle: "Saldo acumulado",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  function limparFormulario() {
    setTipo("receita");
    setDescricao("");
    setValor("");
    setPercentualComissao("");
    setValorComissao("");
    setOrigemComissao(null);
    setData(new Date().toISOString().slice(0, 10));
    setOrcamentoBusca("");
    setOrcamentoId(null);
    setEditandoOculto(false);
    setOrcamentoPago(false);
    setFormaPagamento("");
    setParcelas("1");
  }

  function abrirModal() {
    limparFormulario();
    setEditandoId(null);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  function selecionarOrcamento(valorDigitado: string) {
    setOrcamentoBusca(valorDigitado);

    const encontrado = orcamentosAprovados.find(
      (orcamento) => `${orcamento.numero} - ${orcamento.cliente}` === valorDigitado
    );

    if (!encontrado) {
      setOrcamentoId(null);
      setDescricao("");
      setValor("");
      setPercentualComissao("");
      setValorComissao("");
      setOrigemComissao(null);
      setData("");
      return;
    }

    const totalOrcamento = calcularTotalOrcamento(encontrado);
    const novoValor = totalOrcamento.toFixed(2);
    const comissaoSincronizada = sincronizarComissaoComValor(novoValor, origemComissao, percentualComissao, valorComissao);
    setOrcamentoId(encontrado.id);
    setDescricao(`Receita do orçamento #${encontrado.numero} - ${encontrado.cliente}`);
    setValor(novoValor);
    setPercentualComissao(comissaoSincronizada.percentualComissao);
    setValorComissao(comissaoSincronizada.valorComissao);
    setData(encontrado.dataCriacao || new Date().toISOString().slice(0, 10));
  }

  function onChangeTipo(novoTipo: TipoLancamento) {
    setTipo(novoTipo);

    if (novoTipo === "despesa") {
      setOrcamentoBusca("");
      setOrcamentoId(null);
      setDescricao("");
      setValor("");
      setPercentualComissao("");
      setValorComissao("");
      setOrigemComissao(null);
      setData(new Date().toISOString().slice(0, 10));
    } else {
      setDescricao("");
      setValor("");
      setPercentualComissao("");
      setValorComissao("");
      setOrigemComissao(null);
      setData("");
    }
  }

  function abrirModalEdicao(lancamento: LancamentoFinanceiro) {
    setEditandoId(lancamento.id);
    setTipo(lancamento.tipo);
    setDescricao(lancamento.descricao);
    setValor(String(lancamento.valor));
    setPercentualComissao(
      lancamento.comissaoPercentual === null ? "" : formatarNumeroInput(lancamento.comissaoPercentual)
    );
    setValorComissao(lancamento.comissaoValor === null ? "" : formatarNumeroInput(lancamento.comissaoValor));
    setOrigemComissao(
      lancamento.comissaoPercentual !== null ? "percentual" : lancamento.comissaoValor !== null ? "valor" : null
    );
    setData(lancamento.data);
    setEditandoOculto(lancamento.oculto);
    setOrcamentoPago(lancamento.orcamentoPago);
    setFormaPagamento(lancamento.formaPagamento || "");
    setParcelas(String(lancamento.parcelas || 1));

    if (lancamento.tipo === "receita" && lancamento.orcamentoId) {
      const relacionado = orcamentosAprovados.find((orcamento) => orcamento.id === lancamento.orcamentoId);
      if (relacionado) {
        setOrcamentoBusca(`${relacionado.numero} - ${relacionado.cliente}`);
      } else {
        setOrcamentoBusca("");
      }
      setOrcamentoId(lancamento.orcamentoId);
    } else {
      setOrcamentoBusca("");
      setOrcamentoId(null);
    }

    setModalAberto(true);
  }

  async function alternarOcultarLancamento(lancamento: LancamentoFinanceiro) {
    setErro(null);
    try {
      const atualizado = await atualizarLancamentoFinanceiro(lancamento.id, {
        tipo: lancamento.tipo,
        descricao: lancamento.descricao,
        valor: lancamento.valor,
        comissaoPercentual: lancamento.comissaoPercentual,
        comissaoValor: lancamento.comissaoValor,
        data: lancamento.data,
        oculto: !lancamento.oculto,
        orcamentoPago: lancamento.orcamentoPago,
        formaPagamento: lancamento.formaPagamento,
        parcelas: lancamento.parcelas,
        orcamentoId: lancamento.orcamentoId,
      });

      setLancamentos((prev) => prev.map((item) => (item.id === lancamento.id ? atualizado : item)));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao atualizar visibilidade do lançamento.");
    }
  }

  function onChangeValor(novoValor: string) {
    setValor(novoValor);

    const comissaoSincronizada = sincronizarComissaoComValor(
      novoValor,
      origemComissao,
      percentualComissao,
      valorComissao
    );

    setPercentualComissao(comissaoSincronizada.percentualComissao);
    setValorComissao(comissaoSincronizada.valorComissao);
  }

  function onChangePercentualComissao(novoPercentual: string) {
    setOrigemComissao("percentual");
    setPercentualComissao(novoPercentual);

    const comissaoSincronizada = sincronizarComissaoComValor(valor, "percentual", novoPercentual, valorComissao);
    setValorComissao(comissaoSincronizada.valorComissao);
  }

  function onChangeValorComissao(novoValorComissao: string) {
    setOrigemComissao("valor");
    setValorComissao(novoValorComissao);

    const comissaoSincronizada = sincronizarComissaoComValor(valor, "valor", percentualComissao, novoValorComissao);
    setPercentualComissao(comissaoSincronizada.percentualComissao);
  }

  async function salvarLancamento() {
    if (tipo === "receita" && !orcamentoId) {
      setErro("Selecione um orçamento aprovado para lançar a receita.");
      return;
    }

    const valorNumerico = Number(valor.replace(",", "."));
    const percentualComissaoNumerico = parseNumeroInput(percentualComissao);
    const valorComissaoNumerico = parseNumeroInput(valorComissao);
    const parcelasNumero = Number(parcelas);
    if (!descricao.trim() || !valorNumerico || !data) {
      return;
    }

    if (habilitarDadosPagamento && !formaPagamento.trim()) {
      setErro("Selecione a forma de pagamento para receita com orçamento quitado.");
      return;
    }

    if (habilitarDadosPagamento && (!Number.isInteger(parcelasNumero) || parcelasNumero <= 0)) {
      setErro("Informe uma quantidade de parcelas válida.");
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const payload = {
        tipo,
        descricao: descricao.trim(),
        valor: Math.abs(valorNumerico),
        comissaoPercentual: percentualComissaoNumerico === null ? null : Math.abs(percentualComissaoNumerico),
        comissaoValor: valorComissaoNumerico === null ? null : Math.abs(valorComissaoNumerico),
        data,
        oculto: editandoId ? editandoOculto : false,
        orcamentoPago,
        formaPagamento: habilitarDadosPagamento ? formaPagamento.trim() : "",
        parcelas: habilitarDadosPagamento ? parcelasNumero : null,
        orcamentoId,
      };

      if (editandoId) {
        const atualizado = await atualizarLancamentoFinanceiro(editandoId, payload);
        setLancamentos((prev) => prev.map((item) => (item.id === editandoId ? atualizado : item)));
      } else {
        const novoLancamento = await criarLancamentoFinanceiro(payload);
        setLancamentos((prev) => [novoLancamento, ...prev]);
      }

      fecharModal();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar lançamento.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="mb-2">Financeiro</h1>
          <p className="text-gray-600">Visão geral das finanças</p>
        </div>
        <Button onClick={abrirModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4" />
          Criar receita/despesa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {financialData.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{item.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              <p className="mt-2 text-xs text-gray-500">{item.subtitle}</p>
            </Card>
          );
        })}
      </div>

      {erro && <p className="mb-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      {/* Módulos financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Financial modules - Orçamentos moved to top menu */}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Últimas Transações</h3>
        {carregando ? (
          <p className="text-sm text-gray-500">Carregando transações...</p>
        ) : ultimosLancamentos.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma transação cadastrada.</p>
        ) : (
          <div className="space-y-4">
            {ultimosLancamentos.map((transaction) => {
              const positivo = transaction.tipo === "receita";
              return (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className={transaction.oculto ? "opacity-50" : ""}>
                    <p className="font-medium text-gray-900">{transaction.descricao}</p>
                    <p className="text-sm text-gray-500">{formatarData(transaction.data)}</p>
                    {transaction.oculto && (
                      <p className="text-xs text-amber-600 mt-1">Transação oculta (não entra na soma)</p>
                    )}
                    {transaction.orcamentoNumero && (
                      <p className="text-xs text-gray-500 mt-1">
                        Orçamento #{transaction.orcamentoNumero} - {transaction.cliente}
                      </p>
                    )}
                  </div>
                  <p className={`font-semibold ${positivo ? "text-green-600" : "text-red-600"}`}>
                    {positivo ? "+ " : "- "}
                    {formatarMoeda(transaction.valor)}
                  </p>
                  <div className="ml-3 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => abrirModalEdicao(transaction)}
                      title="Editar transação"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-gray-800"
                      onClick={() => alternarOcultarLancamento(transaction)}
                      title={transaction.oculto ? "Reexibir transação" : "Ocultar transação"}
                    >
                      {transaction.oculto ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={fecharModal} />
          <div className="relative z-10 w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editandoId ? "Editar lançamento" : "Novo lançamento"}</h2>
              <button
                onClick={fecharModal}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="tipo-lancamento">Tipo</Label>
                <select
                  id="tipo-lancamento"
                  value={tipo}
                  onChange={(e) => onChangeTipo(e.target.value as TipoLancamento)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>

              <div>
                <Label htmlFor="descricao-lancamento">Descrição</Label>
                <Input
                  id="descricao-lancamento"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex.: Pagamento de cliente"
                  className="mt-1"
                  disabled={camposPreenchidosPorOrcamento}
                />
              </div>

              <div>
                <Label htmlFor="orcamento-lancamento">Orçamento aprovado</Label>
                <Input
                  id="orcamento-lancamento"
                  list="orcamentos-aprovados"
                  value={orcamentoBusca}
                  onChange={(e) => selecionarOrcamento(e.target.value)}
                  placeholder="Buscar orçamento aprovado por número ou cliente"
                  className="mt-1"
                  disabled={tipo !== "receita"}
                />
                <datalist id="orcamentos-aprovados">
                  {orcamentosAprovados.map((orcamento) => (
                    <option key={orcamento.id} value={`${orcamento.numero} - ${orcamento.cliente}`} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="valor-lancamento">Valor</Label>
                  <Input
                    id="valor-lancamento"
                    type="number"
                    min="0"
                    step="0.01"
                    value={valor}
                    onChange={(e) => onChangeValor(e.target.value)}
                    placeholder="0,00"
                    className="mt-1"
                    disabled={camposPreenchidosPorOrcamento}
                  />
                </div>

                <div>
                  <Label htmlFor="percentual-comissao">Porcentagem da comissão</Label>
                  <Input
                    id="percentual-comissao"
                    type="number"
                    min="0"
                    step="0.01"
                    value={percentualComissao}
                    onChange={(e) => onChangePercentualComissao(e.target.value)}
                    placeholder="0,00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="valor-comissao">Valor da comissão</Label>
                  <Input
                    id="valor-comissao"
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorComissao}
                    onChange={(e) => onChangeValorComissao(e.target.value)}
                    placeholder="0,00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="data-lancamento">Data</Label>
                  <Input
                    id="data-lancamento"
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="mt-1"
                    disabled={camposPreenchidosPorOrcamento}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="orcamento-pago">Quitado</Label>
                  <select
                    id="orcamento-pago"
                    value={orcamentoPago ? "sim" : "nao"}
                    onChange={(e) => {
                      const pago = e.target.value === "sim";
                      setOrcamentoPago(pago);
                      if (!pago) {
                        setFormaPagamento("");
                        setParcelas("1");
                      }
                    }}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="forma-pagamento">Forma de pagamento</Label>
                  <select
                    id="forma-pagamento"
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    disabled={!habilitarDadosPagamento}
                  >
                    <option value="">Selecione</option>
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão de crédito</option>
                    <option value="cartao_debito">Cartão de débito</option>
                    <option value="boleto">Boleto</option>
                    <option value="transferencia">Transferência</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="parcelas">Parcelado em</Label>
                  <Input
                    id="parcelas"
                    type="number"
                    min="1"
                    step="1"
                    value={parcelas}
                    onChange={(e) => setParcelas(e.target.value)}
                    placeholder="Ex.: 1"
                    className="mt-1"
                    disabled={!habilitarDadosPagamento}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={fecharModal}>Cancelar</Button>
              <Button onClick={salvarLancamento} disabled={salvando}>{salvando ? "Salvando..." : editandoId ? "Atualizar" : "Salvar"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

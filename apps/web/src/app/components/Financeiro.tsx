import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, X, Pencil, Eye, EyeOff, ChevronDown, ChevronUp, Search } from "lucide-react";
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

/**
 * Converte string com máscara BRL (ex: "R$ 1.234,56") para número.
 * Também aceita formato simples "1234.56" ou "1234,56".
 */
function parseMoedaInput(valor: string): number | null {
  if (!valor) return null;
  // Remove "R$", espaços e pontos de milhar, substitui vírgula decimal por ponto
  const limpo = valor
    .replace(/R\$\s*/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  if (!limpo) return null;
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * Formata um número como moeda BRL para exibição nos inputs (sem o símbolo "R$").
 * Usa vírgula como separador decimal e ponto como separador de milhar, ex: "1.234,56".
 */
function formatarMoedaInput(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Handler para inputs de moeda: aceita dígitos e vírgula/ponto,
 * armazena como string formatada BRL (ex: "1.234,56").
 */
function aplicarMascaraMoeda(texto: string): string {
  // Remove tudo que não for dígito
  const apenasDigitos = texto.replace(/\D/g, "");
  if (!apenasDigitos) return "";
  // Interpreta como centavos
  const centavos = parseInt(apenasDigitos, 10);
  const reais = centavos / 100;
  return formatarMoedaInput(reais);
}

type OrigemComissao = "percentual" | "valor" | null;

function sincronizarComissaoComValor(
  valorBaseTexto: string,
  origem: OrigemComissao,
  percentualTexto: string,
  valorComissaoTexto: string
) {
  // Campos de valor usam máscara BRL; percentual usa formato numérico simples
  const valorBase = parseMoedaInput(valorBaseTexto);
  const percentual = parseNumeroInput(percentualTexto);
  const valorComissao = parseMoedaInput(valorComissaoTexto);

  if (!valorBase || valorBase <= 0) {
    return {
      percentualComissao: origem === "valor" ? "" : percentualTexto,
      valorComissao: origem === "percentual" ? "" : valorComissaoTexto,
    };
  }

  if (origem === "percentual") {
    return {
      percentualComissao: percentualTexto,
      valorComissao: percentual === null ? "" : formatarMoedaInput((valorBase * percentual) / 100),
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
      valorComissao: formatarMoedaInput((valorBase * percentual) / 100),
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
  const navigate = useNavigate();
  const location = useLocation();
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [orcamentosAprovados, setOrcamentosAprovados] = useState<Orcamento[]>([]);
  const [todosOrcamentos, setTodosOrcamentos] = useState<Orcamento[]>([]);
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
  const [orcamentoIdOriginalEdicao, setOrcamentoIdOriginalEdicao] = useState<number | null>(null);
  const [orcamentoBuscaOriginalEdicao, setOrcamentoBuscaOriginalEdicao] = useState<string>("");
  const [editandoOculto, setEditandoOculto] = useState(false);
  const [orcamentoPago, setOrcamentoPago] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [parcelas, setParcelas] = useState("1");

  const habilitarDadosPagamento = orcamentoPago;

  // Filtros da tabela de transações
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "receita" | "despesa">("todos");
  const [filtroDataDe, setFiltroDataDe] = useState("");
  const [filtroDataAte, setFiltroDataAte] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState<"todos" | "hoje" | "semana" | "mes" | "3meses" | "6meses" | "ano" | "personalizado">("todos");
  const [tabelaMinimizada, setTabelaMinimizada] = useState(false);
  const [resumoMinimizado, setResumoMinimizado] = useState(false);

  const camposPreenchidosPorOrcamento = tipo === "receita";

  useEffect(() => {
    async function carregarDados() {
      setErro(null);
      try {
        const [listaFinanceiro, listaOrcamentos] = await Promise.all([
          listarLancamentosFinanceiros(),
          listarOrcamentos(),
        ]);

        setLancamentos(listaFinanceiro);
        setTodosOrcamentos(listaOrcamentos);
        setOrcamentosAprovados(listaOrcamentos.filter((orcamento) => orcamento.status === "Aprovado"));
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro ao carregar dados do financeiro.");
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, []);

  // Abre modal pré-preenchido quando navegado de Orçamentos com state.novoLancamentoOrcamento
  useEffect(() => {
    const state = location.state as any;
    const orc = state?.novoLancamentoOrcamento;
    const lancamentoExistente: LancamentoFinanceiro | null = state?.lancamentoExistente ?? null;
    if (!orc) return;

    // Limpa o state para não reabrir em navegações futuras
    window.history.replaceState({}, '');

    if (lancamentoExistente) {
      // Abre modal em modo edição com os dados do lançamento existente
      setEditandoId(lancamentoExistente.id);
      setTipo(lancamentoExistente.tipo);
      setDescricao(lancamentoExistente.descricao);
      setValor(new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(lancamentoExistente.valor));
      setData(lancamentoExistente.data);
      setOrcamentoId(lancamentoExistente.orcamentoId);
      setOrcamentoBusca(`${orc.numero} - ${orc.cliente}`);
      setOrcamentoIdOriginalEdicao(lancamentoExistente.orcamentoId);
      setOrcamentoBuscaOriginalEdicao(`${orc.numero} - ${orc.cliente}`);
      setPercentualComissao(lancamentoExistente.comissaoPercentual === null ? "" : String(lancamentoExistente.comissaoPercentual));
      setValorComissao(lancamentoExistente.comissaoValor === null ? "" : new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(lancamentoExistente.comissaoValor));
      setOrigemComissao(lancamentoExistente.comissaoPercentual !== null ? "percentual" : lancamentoExistente.comissaoValor !== null ? "valor" : null);
      setOrcamentoPago(lancamentoExistente.orcamentoPago);
      setFormaPagamento(lancamentoExistente.formaPagamento || "");
      setParcelas(String(lancamentoExistente.parcelas ?? 1));
      setEditandoOculto(lancamentoExistente.oculto);
    } else {
      // Abre modal em modo novo lançamento pré-preenchido com dados do orçamento
      const totalOrcamento =
        (orc.itens || []).reduce((acc: number, item: any) => {
          const subtotal = Number(item.quantidade || 0) * Number(item.valorUnitario || 0);
          return acc + subtotal - subtotal * (Number(item.desconto || 0) / 100);
        }, 0) +
        (orc.hospedagem || []).reduce((acc: number, i: any) => acc + (Number(i?.preco) || 0), 0) +
        (orc.transporte || []).reduce((acc: number, i: any) => acc + (Number(i?.valor) || 0), 0) +
        (orc.restaurante || []).reduce((acc: number, i: any) => acc + (Number(i?.preco) || 0), 0) +
        (orc.experiencias || []).reduce((acc: number, i: any) => acc + (Number(i?.preco) || 0), 0) +
        (orc.seguro || []).reduce((acc: number, i: any) => acc + (Number(i?.valor) || 0), 0) +
        (orc.pacotes || []).reduce((acc: number, i: any) => acc + (Number(i?.valor) || 0) + (Number(i?.hospedagemValor) || 0), 0);

      setEditandoId(null);
      setTipo("receita");
      setDescricao(`Receita do orçamento #${orc.numero} - ${orc.cliente}`);
      setValor(new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalOrcamento));
      setData(orc.dataCriacao || new Date().toISOString().slice(0, 10));
      setOrcamentoId(orc.id);
      setOrcamentoBusca(`${orc.numero} - ${orc.cliente}`);
      setOrcamentoIdOriginalEdicao(null);
      setOrcamentoBuscaOriginalEdicao("");
      setPercentualComissao("");
      setValorComissao("");
      setOrigemComissao(null);
      setOrcamentoPago(false);
      setFormaPagamento("");
      setParcelas("1");
      setEditandoOculto(false);
    }

    setErro(null);
    setModalAberto(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

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

  const periodoParaDatas = useMemo(() => {
    const hoje = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    if (filtroPeriodo === "hoje") {
      const s = fmt(hoje);
      return { de: s, ate: s };
    }
    if (filtroPeriodo === "semana") {
      const inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - 6);
      return { de: fmt(inicio), ate: fmt(hoje) };
    }
    if (filtroPeriodo === "mes") {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      return { de: fmt(inicio), ate: fmt(hoje) };
    }
    if (filtroPeriodo === "3meses") {
      const inicio = new Date(hoje);
      inicio.setMonth(hoje.getMonth() - 3);
      return { de: fmt(inicio), ate: fmt(hoje) };
    }
    if (filtroPeriodo === "6meses") {
      const inicio = new Date(hoje);
      inicio.setMonth(hoje.getMonth() - 6);
      return { de: fmt(inicio), ate: fmt(hoje) };
    }
    if (filtroPeriodo === "ano") {
      const inicio = new Date(hoje.getFullYear(), 0, 1);
      return { de: fmt(inicio), ate: fmt(hoje) };
    }
    return { de: filtroDataDe, ate: filtroDataAte };
  }, [filtroPeriodo, filtroDataDe, filtroDataAte]);

  const transacoesFiltradas = useMemo(() => {
    const { de, ate } = periodoParaDatas;
    return [...lancamentos]
      .filter((item) => {
        if (filtroTipo !== "todos" && item.tipo !== filtroTipo) return false;
        if (filtroTexto.trim()) {
          const busca = filtroTexto.trim().toLowerCase();
          const textoItem = `${item.descricao} ${item.orcamentoNumero || ""} ${item.cliente || ""}`.toLowerCase();
          if (!textoItem.includes(busca)) return false;
        }
        if (de && item.data < de) return false;
        if (ate && item.data > ate) return false;
        return true;
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [lancamentos, filtroTipo, filtroTexto, periodoParaDatas]);

  const totaisFiltrados = useMemo(() => {
    const receitas = transacoesFiltradas
      .filter((i) => i.tipo === "receita" && !i.oculto)
      .reduce((acc, i) => acc + i.valor, 0);
    const despesas = transacoesFiltradas
      .filter((i) => i.tipo === "despesa" && !i.oculto)
      .reduce((acc, i) => acc + i.valor, 0);
    const totalComissao = transacoesFiltradas
      .filter((i) => !i.oculto && i.comissaoValor !== null)
      .reduce((acc, i) => acc + (i.comissaoValor ?? 0), 0);
    return { receitas, despesas, saldo: receitas - despesas, totalComissao };
  }, [transacoesFiltradas]);

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
    setOrcamentoIdOriginalEdicao(null);
    setOrcamentoBuscaOriginalEdicao("");
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
      // Se estiver editando e o texto digitado corresponde ao orçamento original (fora da lista de aprovados), preserva o ID
      if (orcamentoIdOriginalEdicao && valorDigitado === orcamentoBuscaOriginalEdicao) {
        setOrcamentoId(orcamentoIdOriginalEdicao);
        return;
      }
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
    const novoValor = formatarMoedaInput(totalOrcamento);
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
    setValor(formatarMoedaInput(lancamento.valor));
    setPercentualComissao(
      lancamento.comissaoPercentual === null ? "" : formatarNumeroInput(lancamento.comissaoPercentual)
    );
    setValorComissao(lancamento.comissaoValor === null ? "" : formatarMoedaInput(lancamento.comissaoValor));
    setOrigemComissao(
      lancamento.comissaoPercentual !== null ? "percentual" : lancamento.comissaoValor !== null ? "valor" : null
    );
    setData(lancamento.data);
    setEditandoOculto(lancamento.oculto);
    setOrcamentoPago(lancamento.orcamentoPago);
    setFormaPagamento(lancamento.formaPagamento || "");
    setParcelas(String(lancamento.parcelas ?? 1));

    if (lancamento.tipo === "receita" && lancamento.orcamentoId) {
      const relacionado = orcamentosAprovados.find((orcamento) => orcamento.id === lancamento.orcamentoId);
      let buscaTexto = "";
      if (relacionado) {
        buscaTexto = `${relacionado.numero} - ${relacionado.cliente}`;
      } else if (lancamento.orcamentoNumero) {
        // Orçamento não está mais na lista de aprovados, mas mantém a referência original
        buscaTexto = `${lancamento.orcamentoNumero} - ${lancamento.cliente}`;
      }
      setOrcamentoBusca(buscaTexto);
      setOrcamentoId(lancamento.orcamentoId);
      setOrcamentoIdOriginalEdicao(lancamento.orcamentoId);
      setOrcamentoBuscaOriginalEdicao(buscaTexto);
    } else {
      setOrcamentoBusca("");
      setOrcamentoId(null);
      setOrcamentoIdOriginalEdicao(null);
      setOrcamentoBuscaOriginalEdicao("");
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
    const valorFormatado = aplicarMascaraMoeda(novoValor);
    setValor(valorFormatado);

    const comissaoSincronizada = sincronizarComissaoComValor(
      valorFormatado,
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
    const valorFormatado = aplicarMascaraMoeda(novoValorComissao);
    setOrigemComissao("valor");
    setValorComissao(valorFormatado);

    const comissaoSincronizada = sincronizarComissaoComValor(valor, "valor", percentualComissao, valorFormatado);
    setPercentualComissao(comissaoSincronizada.percentualComissao);
  }

  function renderDescricao(transaction: LancamentoFinanceiro) {
    // Sempre tenta encontrar "#numero" na descrição
    const partes = transaction.descricao.split(/(#\d+)/);
    const temNumeroNaDescricao = partes.length > 1;

    if (!temNumeroNaDescricao && !transaction.orcamentoId) {
      return <p className="font-medium text-gray-900 text-sm">{transaction.descricao}</p>;
    }

    const irParaOrcamento = (numeroExtraido?: string) => {
      if (transaction.orcamentoId) {
        navigate("/financeiro/orcamentos", { state: { editId: transaction.orcamentoId } });
        return;
      }
      // Tenta encontrar o orçamento pelo número nos já carregados
      const num = numeroExtraido?.replace("#", "") ?? transaction.orcamentoNumero;
      const encontrado = todosOrcamentos.find(
        (o) => String(o.numero) === String(num)
      );
      if (encontrado) {
        navigate("/financeiro/orcamentos", { state: { editId: encontrado.id } });
      } else {
        navigate("/financeiro/orcamentos");
      }
    };

    if (temNumeroNaDescricao) {
      return (
        <p className="font-medium text-gray-900 text-sm">
          {partes.map((parte, i) =>
            /^#\d+$/.test(parte) ? (
              <button
                key={i}
                type="button"
                onClick={() => irParaOrcamento(parte)}
                className="text-blue-600 hover:underline font-semibold"
              >
                {parte}
              </button>
            ) : (
              <span key={i}>{parte}</span>
            )
          )}
        </p>
      );
    }

    // Tem orcamentoId mas sem "#numero" na descrição — adiciona link ao final
    const labelNumero = transaction.orcamentoNumero ? `#${transaction.orcamentoNumero}` : "ver orçamento";
    return (
      <p className="font-medium text-gray-900 text-sm">
        {transaction.descricao}{" "}
        <button type="button" onClick={() => irParaOrcamento()} className="text-blue-600 hover:underline font-semibold">
          {labelNumero}
        </button>
      </p>
    );
  }

  async function salvarLancamento() {
    if (!editandoId && tipo === "receita" && !orcamentoId) {
      setErro("Selecione um orçamento aprovado para lançar a receita.");
      return;
    }

    const valorNumerico = parseMoedaInput(valor) ?? 0;
    const percentualComissaoNumerico = parseNumeroInput(percentualComissao);
    const valorComissaoNumerico = parseMoedaInput(valorComissao);
    const parcelasNumero = Number(parcelas);

    if (!descricao.trim()) {
      setErro("Descrição é obrigatória.");
      return;
    }
    if (!valorNumerico || valorNumerico <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    if (!data) {
      setErro("Data é obrigatória.");
      return;
    }
    if (habilitarDadosPagamento && !formaPagamento.trim()) {
      setErro("Selecione a forma de pagamento para receita quitada.");
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
      {/* Cabeçalho */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="mb-1">Financeiro</h1>
          <p className="text-sm text-gray-600">Visão geral das finanças</p>
        </div>
        <Button onClick={abrirModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Criar receita/despesa</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resumo</h3>
          <button
            onClick={() => setResumoMinimizado((v) => !v)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title={resumoMinimizado ? "Maximizar" : "Minimizar"}
          >
            {resumoMinimizado ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        </div>
        {!resumoMinimizado && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {financialData.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <p className="text-xs text-gray-600 font-medium">{item.title}</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 leading-tight">{item.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.subtitle}</p>
                </Card>
              );
            })}
          </div>
        )}
        {resumoMinimizado && (
          <div className="flex flex-wrap gap-3">
            {financialData.map((item) => (
              <span key={item.title} className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">{item.title}:</span> {item.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {erro && <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      {/* Módulos financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Financial modules - Orçamentos moved to top menu */}
      </div>

      <Card className="p-4">
        {/* Cabeçalho da card */}
        <div className="flex items-start justify-between mb-4 gap-2">
          <div>
            <h3 className="font-semibold text-gray-900">Transações</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              <span className="text-xs text-green-700 font-medium">+{formatarMoeda(totaisFiltrados.receitas)}</span>
              <span className="text-xs text-red-600 font-medium">-{formatarMoeda(totaisFiltrados.despesas)}</span>
              <span className={`text-xs font-semibold ${totaisFiltrados.saldo >= 0 ? "text-blue-700" : "text-red-700"}`}>
                Saldo: {formatarMoeda(totaisFiltrados.saldo)}
              </span>
              {totaisFiltrados.totalComissao > 0 && (
                <span className="text-xs text-gray-500">Comissões: {formatarMoeda(totaisFiltrados.totalComissao)}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setTabelaMinimizada((v) => !v)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
            title={tabelaMinimizada ? "Maximizar" : "Minimizar"}
          >
            {tabelaMinimizada ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        </div>

        {!tabelaMinimizada && (
          <>
            {/* Filtros */}
            <div className="flex flex-col gap-2 mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por descrição ou cliente..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="w-full pl-8 h-9 rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value as "todos" | "receita" | "despesa")}
                  className="flex-1 h-9 rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="todos">Todos os tipos</option>
                  <option value="receita">Receitas</option>
                  <option value="despesa">Despesas</option>
                </select>
                <select
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value as typeof filtroPeriodo)}
                  className="flex-1 h-9 rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="todos">Todo período</option>
                  <option value="hoje">Hoje</option>
                  <option value="semana">7 dias</option>
                  <option value="mes">Este mês</option>
                  <option value="3meses">3 meses</option>
                  <option value="6meses">6 meses</option>
                  <option value="ano">Este ano</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>
              {filtroPeriodo === "personalizado" && (
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <label className="text-xs text-gray-500 whitespace-nowrap">De:</label>
                    <input
                      type="date"
                      value={filtroDataDe}
                      onChange={(e) => setFiltroDataDe(e.target.value)}
                      className="flex-1 h-9 rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Até:</label>
                    <input
                      type="date"
                      value={filtroDataAte}
                      onChange={(e) => setFiltroDataAte(e.target.value)}
                      className="flex-1 h-9 rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Contador e limpar filtros */}
            {(filtroTexto || filtroTipo !== "todos" || filtroPeriodo !== "todos") && (
              <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                <span>{transacoesFiltradas.length} resultado(s)</span>
                <button
                  onClick={() => { setFiltroTexto(""); setFiltroTipo("todos"); setFiltroPeriodo("todos"); setFiltroDataDe(""); setFiltroDataAte(""); }}
                  className="text-blue-600 hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            )}

            {/* Conteúdo */}
            {carregando ? (
              <p className="text-sm text-gray-500">Carregando transações...</p>
            ) : transacoesFiltradas.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma transação encontrada.</p>
            ) : (
              <>
                {/* Tabela — desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-gray-500 uppercase tracking-wide">
                        <th className="pb-2 text-left font-medium">Descrição</th>
                        <th className="pb-2 text-left font-medium">Data</th>
                        <th className="pb-2 text-right font-medium">Valor</th>
                        <th className="pb-2 text-right font-medium">% Comissão</th>
                        <th className="pb-2 text-right font-medium">Valor Comissão</th>
                        <th className="pb-2 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transacoesFiltradas.map((transaction) => {
                        const positivo = transaction.tipo === "receita";
                        return (
                          <tr key={transaction.id} className={`border-b last:border-b-0 ${transaction.oculto ? "opacity-50" : ""}`}>
                            <td className="py-3 pr-4">
                              {renderDescricao(transaction)}
                              {transaction.oculto && <p className="text-xs text-amber-600 mt-0.5">Oculta (não entra na soma)</p>}
                              {transaction.orcamentoNumero && (
                                <p className="text-xs text-gray-500 mt-0.5">Orçamento #{transaction.orcamentoNumero} - {transaction.cliente}</p>
                              )}
                            </td>
                            <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{formatarData(transaction.data)}</td>
                            <td className={`py-3 pr-4 text-right font-semibold whitespace-nowrap ${positivo ? "text-green-600" : "text-red-600"}`}>
                              {positivo ? "+ " : "- "}{formatarMoeda(transaction.valor)}
                            </td>
                            <td className="py-3 pr-4 text-right text-gray-700 whitespace-nowrap">
                              {transaction.comissaoPercentual !== null ? `${transaction.comissaoPercentual}%` : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-3 pr-4 text-right text-gray-700 whitespace-nowrap">
                              {transaction.comissaoValor !== null ? formatarMoeda(transaction.comissaoValor) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => abrirModalEdicao(transaction)} title="Editar">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-8 w-8 text-gray-600" onClick={() => alternarOcultarLancamento(transaction)} title={transaction.oculto ? "Reexibir" : "Ocultar"}>
                                  {transaction.oculto ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-sm">
                        <td colSpan={2} className="py-3 pr-4 text-gray-700">Total ({transacoesFiltradas.length})</td>
                        <td className="py-3 pr-4 text-right">
                          <span className="text-green-600">+{formatarMoeda(totaisFiltrados.receitas)}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-red-600">-{formatarMoeda(totaisFiltrados.despesas)}</span>
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-400">—</td>
                        <td className="py-3 pr-4 text-right text-gray-700">
                          {totaisFiltrados.totalComissao > 0 ? formatarMoeda(totaisFiltrados.totalComissao) : <span className="text-gray-400">—</span>}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Cards — mobile */}
                <div className="md:hidden space-y-3">
                  {transacoesFiltradas.map((transaction) => {
                    const positivo = transaction.tipo === "receita";
                    return (
                      <div key={transaction.id} className={`rounded-lg border p-3 ${transaction.oculto ? "opacity-50 bg-gray-50" : "bg-white"}`}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1">{renderDescricao(transaction)}</div>
                          <span className={`font-semibold text-sm whitespace-nowrap ${positivo ? "text-green-600" : "text-red-600"}`}>
                            {positivo ? "+" : "-"}{formatarMoeda(transaction.valor)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-500 mb-2">
                          <span>{formatarData(transaction.data)}</span>
                          {transaction.orcamentoNumero && <span>· Orç. #{transaction.orcamentoNumero}</span>}
                          {transaction.oculto && <span className="text-amber-600">· Oculta</span>}
                        </div>
                        {(transaction.comissaoPercentual !== null || transaction.comissaoValor !== null) && (
                          <p className="text-xs text-gray-500 mb-2">
                            Comissão:{" "}
                            {transaction.comissaoPercentual !== null && `${transaction.comissaoPercentual}%`}
                            {transaction.comissaoPercentual !== null && transaction.comissaoValor !== null && " · "}
                            {transaction.comissaoValor !== null && formatarMoeda(transaction.comissaoValor)}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => abrirModalEdicao(transaction)}>
                            <Pencil className="h-3 w-3 mr-1" /> Editar
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs text-gray-600" onClick={() => alternarOcultarLancamento(transaction)}>
                            {transaction.oculto ? <><Eye className="h-3 w-3 mr-1" />Reexibir</> : <><EyeOff className="h-3 w-3 mr-1" />Ocultar</>}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="rounded-lg border bg-gray-50 p-3 text-sm font-semibold">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{transacoesFiltradas.length} transações</span>
                      <div className="flex gap-3">
                        <span className="text-green-600">+{formatarMoeda(totaisFiltrados.receitas)}</span>
                        <span className="text-red-600">-{formatarMoeda(totaisFiltrados.despesas)}</span>
                      </div>
                    </div>
                    {totaisFiltrados.totalComissao > 0 && (
                      <div className="flex justify-between mt-1 text-xs text-gray-500 font-normal">
                        <span>Total comissões</span>
                        <span>{formatarMoeda(totaisFiltrados.totalComissao)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </Card>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 touch-none" onClick={fecharModal} />
          <div className="relative z-10 w-full sm:max-w-3xl rounded-t-2xl sm:rounded-lg bg-white shadow-xl flex flex-col max-h-[92dvh] sm:max-h-[90vh] pb-[env(safe-area-inset-bottom)]">

            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header fixo */}
            <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b shrink-0">
              <h2 className="text-base font-semibold text-gray-900">{editandoId ? "Editar lançamento" : "Novo lançamento"}</h2>
              <button onClick={fecharModal} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Fechar modal">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo com scroll */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              <div>
                <Label htmlFor="tipo-lancamento">Tipo</Label>
                <select
                  id="tipo-lancamento"
                  value={tipo}
                  onChange={(e) => onChangeTipo(e.target.value as TipoLancamento)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-base sm:text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>

              <div>
                <Label htmlFor="descricao-lancamento">Descrição</Label>
                <Input id="descricao-lancamento" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Pagamento de cliente" className="mt-1 h-10 text-base sm:text-sm" disabled={camposPreenchidosPorOrcamento} />
              </div>

              <div>
                <Label htmlFor="orcamento-lancamento">Orçamento aprovado</Label>
                <Input id="orcamento-lancamento" list="orcamentos-aprovados" value={orcamentoBusca} onChange={(e) => selecionarOrcamento(e.target.value)} placeholder="Buscar por número ou cliente" className="mt-1 h-10 text-base sm:text-sm" disabled={tipo !== "receita"} />
                <datalist id="orcamentos-aprovados">
                  {orcamentosAprovados.map((orcamento) => (
                    <option key={orcamento.id} value={`${orcamento.numero} - ${orcamento.cliente}`} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="valor-lancamento">Valor</Label>
                  <Input id="valor-lancamento" type="text" inputMode="decimal" value={valor} onChange={(e) => onChangeValor(e.target.value)} placeholder="0,00" className="mt-1 h-10 text-base sm:text-sm" disabled={camposPreenchidosPorOrcamento} />
                </div>
                <div>
                  <Label htmlFor="data-lancamento">Data</Label>
                  <Input id="data-lancamento" type="date" value={data} onChange={(e) => setData(e.target.value)} className="mt-1 h-10 text-base sm:text-sm" disabled={camposPreenchidosPorOrcamento} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="percentual-comissao">% Comissão</Label>
                  <Input id="percentual-comissao" list="percentuais-comissao" type="number" inputMode="decimal" min="0" step="0.01" value={percentualComissao} onChange={(e) => onChangePercentualComissao(e.target.value)} placeholder="0,00" className="mt-1 h-10 text-base sm:text-sm" />
                  <datalist id="percentuais-comissao">
                    <option value="5" /><option value="10" /><option value="15" /><option value="20" /><option value="25" /><option value="30" />
                  </datalist>
                </div>
                <div>
                  <Label htmlFor="valor-comissao">Valor Comissão</Label>
                  <Input id="valor-comissao" type="text" inputMode="decimal" value={valorComissao} onChange={(e) => onChangeValorComissao(e.target.value)} placeholder="0,00" className="mt-1 h-10 text-base sm:text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="orcamento-pago">Quitado</Label>
                  <select id="orcamento-pago" value={orcamentoPago ? "sim" : "nao"} onChange={(e) => { const pago = e.target.value === "sim"; setOrcamentoPago(pago); if (!pago) { setFormaPagamento(""); setParcelas("1"); } }} className="mt-1 flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-base sm:text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50">
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="forma-pagamento">Forma de pagamento</Label>
                  <select id="forma-pagamento" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} disabled={!habilitarDadosPagamento} className="mt-1 flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-base sm:text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50">
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
                  <Input id="parcelas" type="number" inputMode="numeric" min="1" step="1" value={parcelas} onChange={(e) => setParcelas(e.target.value)} placeholder="Ex.: 1" disabled={!habilitarDadosPagamento} className="mt-1 h-10 text-base sm:text-sm" />
                </div>
              </div>

            </div>

            {/* Footer fixo */}
            <div className="px-5 py-4 border-t flex gap-2 shrink-0">
              <Button variant="outline" onClick={fecharModal} className="flex-1 sm:flex-none h-11 sm:h-9 text-base sm:text-sm">Cancelar</Button>
              <Button onClick={salvarLancamento} disabled={salvando} className="flex-1 sm:flex-none h-11 sm:h-9 text-base sm:text-sm">
                {salvando ? "Salvando..." : editandoId ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

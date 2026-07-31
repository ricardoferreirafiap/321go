import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Search, Plus, Edit2, X, Check, FileText, ChevronDown, ChevronUp, Upload,
  User, Calendar, DollarSign, Send, Eye, Copy, MapPin, Sparkles, Link2, Star
} from "lucide-react"; // Adicionado Sparkles
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import PacotesForm from "./PacotesForm";
import RoteiroForm from "./RoteiroForm";
import DayByDayForm from "./DayByDayForm";
import TransporteForm from "./TransporteForm";
import RestauranteForm from "./RestauranteForm";
import ExperienciasForm from "./ExperienciasForm";
import SeguroForm from "./SeguroForm";
import ResumoOrcamentoInline from "./ResumoOrcamentoInline";
import { listarClientes, type Cliente } from "../data/clientesApi";
import { listarFuncionarios, type Funcionario } from "../data/funcionariosApi";
import { listarFornecedores, type Fornecedor } from "../data/fornecedoresApi";
import { listarProdutos, type Produto } from "../data/produtosApi";
import {
  atualizarOrcamento,
  criarOrcamento,
  listarOrcamentos,
  type ItemOrc,
  type DocumentoVenda,
  type Orcamento,
  type OrcamentoPayload,
  type StatusOrc,
  type StatusViagem,
} from "../data/orcamentosApi";
import {
  type Pacote,
  criarLancamentoFinanceiro,
  listarLancamentosFinanceiros,
  type LancamentoFinanceiro,
} from "../data/financeiroApi";
import { buscarOpcoesDestino } from "../data/placePhotoApi";
import { enviarMensagemIA } from "../data/aiChatApi";

const itemVazio = (): ItemOrc => ({
  id: Date.now(),
  descricao: "",
  quantidade: 1,
  unidade: "un",
  valorUnitario: 0,
  desconto: 0,
  link: "",
  urlOperador: [],
  documentos: [],
});


const statusConfig: Record<StatusOrc, { bg: string; cor: string }> = {
  Rascunho:  { bg: "bg-gray-100",   cor: "text-gray-600" },
  Enviado:   { bg: "bg-blue-100",   cor: "text-blue-700" },
  Aprovado:  { bg: "bg-green-100",  cor: "text-green-700" },
  Rejeitado: { bg: "bg-red-100",    cor: "text-red-600" },
  Cancelado: { bg: "bg-orange-100", cor: "text-orange-600" },
};

const allStatus: StatusOrc[] = ["Rascunho", "Enviado", "Aprovado", "Rejeitado", "Cancelado"];
const secoesOrcamento = ["Pacotes", "Roteiro", "Day by Day", "Transporte", "Restaurante", "Experiências", "Seguro", "Vendas"] as const;
type SecaoOrcamento = typeof secoesOrcamento[number];

type CategoriaPerfilViagem = {
  titulo: string;
  opcoes: string[];
};

const categoriasPerfilViagem: CategoriaPerfilViagem[] = [
  {
    titulo: "Perfil da viagem",
    opcoes: [
      "Casal",
      "Família",
      "Crianças",
      "Bebê",
      "Adolescente",
      "Melhor idade",
      "Grupo de amigos",
      "Lua de mel",
      "Viagem solo",
      "Pet Friendly",
      "LGBTQIA+",
      "Comunidade Nerd/Gamer",
      "Mochileiros",
      "Turismo religioso",
    ],
  },
  {
    titulo: "Acessibilidade e Mobilidade",
    opcoes: [
      "Cadeirante",
      "Mobilidade reduzida",
      "Usuário de andador",
      "Usuário de muletas",
      "Elevadores",
      "Rampas de acesso",
      "Banheiro adaptado",
      "Quarto acessível",
      "Praia acessível",
      "Cadeira anfíbia",
      "Transporte acessível",
      "Sinalização tátil",
      "Intérprete de Libras",
      "Audiodescrição",
    ],
  },
  {
    titulo: "Diversidade e Inclusão",
    opcoes: [
      "Destinos LGBTQIA+ Friendly",
      "Hotéis LGBTQIA+ Friendly",
      "Vida noturna LGBTQIA+",
      "Eventos Pride",
      "Destinos inclusivos",
      "Resorts inclusivos",
      "Segurança para viajantes LGBTQIA+",
      "Destinos acolhedores",
    ],
  },
  {
    titulo: "Saúde",
    opcoes: [
      "Gestantes",
      "Idosos",
      "Pessoas com mobilidade reduzida",
      "Oxigênio",
      "Hemodiálise próxima",
      "Hospitais próximos",
      "Clínicas",
      "Farmácia 24h",
      "Seguro obrigatório",
      "Alimentação especial",
    ],
  },
  {
    titulo: "Pet Friendly",
    opcoes: [
      "Aceita cães",
      "Aceita gatos",
      "Pet de grande porte",
      "Pet sem taxa",
      "Área pet",
      "Praia pet",
      "Hotel pet",
      "Veterinário próximo",
      "Dog Park",
    ],
  },
  {
    titulo: "Tipo de destino",
    opcoes: [
      "Nacional",
      "Internacional",
      "Praia",
      "Serra",
      "Campo",
      "Cidade histórica",
      "Natureza",
      "Ecoturismo",
      "Neve",
      "Capital",
      "Interior",
      "Ilha",
    ],
  },
  {
    titulo: "Faixa de orçamento",
    opcoes: [
      "Econômico",
      "Intermediário",
      "Premium",
      "Luxo",
      "Resort",
      "All Inclusive",
      "Hotel Fazenda",
      "Hostel",
      "Pousada",
    ],
  },
  {
    titulo: "Objetivo da viagem",
    opcoes: [
      "Descanso",
      "Romântica",
      "Lua de mel",
      "Aventura",
      "Compras",
      "Gastronomia",
      "Parques",
      "Disney",
      "Cruzeiro",
      "Shows",
      "Eventos",
      "Negócios",
      "Home Office",
      "Bem-estar",
      "Spa",
      "Pesca",
      "Esportes",
      "Mergulho",
      "Esqui",
    ],
  },
  {
    titulo: "Transporte",
    opcoes: [
      "Sem carro",
      "Com carro",
      "Aluguel de carro",
      "Transfer",
      "Transporte público",
      "Próximo ao aeroporto",
      "Próximo ao metrô",
      "Caminhável",
    ],
  },
  {
    titulo: "Alimentação",
    opcoes: [
      "Vegetariano",
      "Vegano",
      "Sem glúten",
      "Sem lactose",
      "Kosher",
      "Halal",
      "Restaurante infantil",
    ],
  },
  {
    titulo: "Hospedagem",
    opcoes: [
      "Piscina aquecida",
      "Piscina coberta",
      "Parque aquático",
      "Spa",
      "Academia",
      "Recreação infantil",
      "Copa do bebê",
      "Monitoria",
      "Cozinha no quarto",
      "Vista para o mar",
      "Frente para a praia",
      "Wi-Fi de alta velocidade",
      "Espaço para home office",
    ],
  },
];

const todasCategoriasMinimizadas: Record<string, boolean> = Object.fromEntries(
  categoriasPerfilViagem.map((c) => [c.titulo, true])
);

function chavePerfilViagem(tituloCategoria: string, opcao: string) {
  return `${tituloCategoria}::${opcao}`;
}

function calcItem(item: ItemOrc) {
  const bruto = item.quantidade * item.valorUnitario;
  const desc = bruto * (item.desconto / 100);
  return bruto - desc;
}

function calcTotal(itens: ItemOrc[]) {
  return itens.reduce((acc, i) => acc + calcItem(i), 0);
}

function calcTotalOrcamento(orc: Orcamento) {
  return calcTotal(montarLinhasDescricao(orc));
}

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(d: string) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function resumirItemSecao(item: any) {
  if (!item || typeof item !== "object") return "Detalhes disponíveis";

  if (item.nome) return String(item.nome);
  if (item.descricao) return String(item.descricao);
  if (item.companhia || item.numero) {
    const companhia = item.companhia ? String(item.companhia) : "Voo";
    const numero = item.numero ? ` ${String(item.numero)}` : "";
    return `${companhia}${numero}`.trim();
  }
  if (item.origem || item.destino) {
    const origem = item.origem ? String(item.origem) : "Origem";
    const destino = item.destino ? String(item.destino) : "Destino";
    return `${origem} -> ${destino}`;
  }
  if (item.tipo) return String(item.tipo);

  return "Detalhes disponíveis";
}

function extrairNumeroPositivo(valor: unknown, padrao = 0) {
  if (typeof valor === "string") {
    const limpo = valor.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(limpo);
    return Number.isFinite(n) && n > 0 ? n : padrao;
  }
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? n : padrao;
}

function extrairNumero(valor: unknown, padrao = 0) {
  if (valor === null || valor === undefined) return padrao;
  if (typeof valor === "string") {
    const limpo = valor.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(limpo);
    return Number.isFinite(n) ? n : padrao;
  }
  const n = Number(valor);
  return Number.isFinite(n) ? n : padrao;
}

function parseMoeda(valorTexto: string) {
  const limpo = valorTexto
      .replace(/\s/g, "")
      .replace(/R\$/gi, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");
  const numero = parseFloat(limpo);
  return Number.isFinite(numero) ? numero : 0;
}

function montarLinhasDescricao(orc: Orcamento): ItemOrc[] {
  let proximoId = 1;
  const criarLinha = (
      descricao: string,
      quantidade = 1,
      unidade = "item",
      valorUnitario = 0,
      desconto = 0
  ): ItemOrc => ({
    id: proximoId++,
    descricao,
    quantidade,
    unidade,
    valorUnitario,
    desconto,
  });

  const linhasVendas = (orc.itens || []).map((item) =>
      criarLinha(
          `[Vendas] ${item.descricao}`,
          item.quantidade,
          item.unidade || "un",
          item.valorUnitario,
          item.desconto
      )
  );

  const secoes = [
    { titulo: "Pacotes", dados: orc.pacotes },
    { titulo: "Voos", dados: orc.voos },
    { titulo: "Hospedagem", dados: orc.hospedagem },
    { titulo: "Day by Day", dados: orc.dayByDay },
    { titulo: "Transporte", dados: orc.transporte },
    { titulo: "Restaurante", dados: orc.restaurante },
    { titulo: "Experiências", dados: orc.experiencias },
    { titulo: "Seguro", dados: orc.seguro },
  ];

  const linhasSecoes = secoes.flatMap((secao) => {
    if (!Array.isArray(secao.dados) || secao.dados.length === 0) return [];

    return secao.dados.map((item) => {
      const quantidade = extrairNumeroPositivo(item?.qtdPessoas, 0)
          || extrairNumeroPositivo(item?.quantidade, 0)
          || extrairNumeroPositivo(item?.noites, 0)
          || 1;

      let valorUnitario = 0;
      if (secao.titulo === "Pacotes") {
        const valorPacote = extrairNumero(item?.valor, 0);
        const valorHosp = extrairNumero(item?.hospedagemValor, 0);
        valorUnitario = valorPacote + valorHosp;
      } else {
        valorUnitario = extrairNumeroPositivo(item?.valor, 0)
            || extrairNumeroPositivo(item?.preco, 0)
            || extrairNumeroPositivo(item?.valorUnitario, 0)
            || 0;
      }

      const unidade = typeof item?.unidade === "string" && item.unidade.trim()
          ? item.unidade
          : "item";

      return criarLinha(
          `[${secao.titulo}] ${resumirItemSecao(item)}`,
          quantidade,
          unidade,
          valorUnitario,
          0
      );
    });
  });

  const linhaRoteiro = orc.roteiro && orc.roteiro.trim()
      ? [criarLinha(`[Roteiro] ${orc.roteiro.trim().replace(/\s+/g, " ").slice(0, 160)}${orc.roteiro.trim().length > 160 ? "..." : ""}`, 1, "txt", 0, 0)]
      : [];

  return [...linhasVendas, ...linhasSecoes, ...linhaRoteiro];
}

function gerarNumero(lista: Orcamento[]) {
  // New format: <aammdd><NN> where NN is incremental starting at 01 per day
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const datePart = `${yy}${mm}${dd}`;

  // Look for existing numbers that match the new pattern for today and extract their sequence
  const regex = new RegExp(`^${datePart}(\\d{2})$`);
  const seqNums = lista
      .map((o) => {
        const m = String(o.numero).match(regex);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n): n is number => n !== null);

  const next = seqNums.length > 0 ? Math.max(...seqNums) + 1 : 1;
  const seq = String(next).padStart(2, "0");
  return `${datePart}${seq}`;
}

type Tela = "lista" | "form";

const orcVazio = (): OrcamentoPayload => ({
  numero: "", cliente: "", email: "", destino: "", agenteViagem: "", status: "Rascunho",
  dataCriacao: new Date().toISOString().split("T")[0], itens: [],

});

export default function Orcamentos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lista, setLista] = useState<Orcamento[]>([]);
  const [tela, setTela] = useState<Tela>("lista");
  const [editando, setEditando] = useState<Orcamento | null>(null);
  const [form, setForm] = useState<OrcamentoPayload>(orcVazio());
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusOrc | "Todos">("Todos");
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());
  const [section, setSection] = useState<SecaoOrcamento>("Pacotes");
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [voos, setVoos] = useState<Voo[]>([]);
  const [hospedagem, setHospedagem] = useState<any[]>([]);
  const [roteiro, setRoteiro] = useState<string>("");
  const [dayByDay, setDayByDay] = useState<any[]>([]);
  const [transporte, setTransporte] = useState<any[]>([]);
  const [gerandoRoteiro, setGerandoRoteiro] = useState(false); // Estado de loading para a IA
  const [promptRoteiroIA, setPromptRoteiroIA] = useState("");
  const [restaurante, setRestaurante] = useState<any[]>([]);
  const [experiencias, setExperiencias] = useState<any[]>([]);
  const [seguro, setSeguro] = useState<any[]>([]);
  const [funcionariosAtivos, setFuncionariosAtivos] = useState<Funcionario[]>([]);
  const [clientesAtivos, setClientesAtivos] = useState<Cliente[]>([]);
  const [fornecedoresAtivos, setFornecedoresAtivos] = useState<Fornecedor[]>([]);
  const [produtosAtivos, setProdutosAtivos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [statusBloqueado, setStatusBloqueado] = useState(false);
  const [modalFinanceiroAberto, setModalFinanceiroAberto] = useState(false);
  const [salvandoLancamento, setSalvandoLancamento] = useState(false);
  const [erroLancamento, setErroLancamento] = useState<string | null>(null);
  const [quitadoLancamento, setQuitadoLancamento] = useState(true);
  const [formaPagamentoLancamento, setFormaPagamentoLancamento] = useState("");
  const [parcelasLancamento, setParcelasLancamento] = useState("1");
  const [dataLancamento, setDataLancamento] = useState(new Date().toISOString().slice(0, 10));
  const [popupAprovadoAberto, setPopupAprovadoAberto] = useState(false);
  const [orcamentoDuplicacaoPendente, setOrcamentoDuplicacaoPendente] = useState<Orcamento | null>(null);
  const [dadosClienteMinimizados, setDadosClienteMinimizados] = useState(true);
  const [perfilViagemMinimizado, setPerfilViagemMinimizado] = useState(true);
  const [categoriasPerfilMinimizadas, setCategoriasPerfilMinimizadas] = useState<Record<string, boolean>>(() => ({ ...todasCategoriasMinimizadas }));
  const [perfilViagemSelecionado, setPerfilViagemSelecionado] = useState<string[]>([]);
  const [promptPerfilViagemIA, setPromptPerfilViagemIA] = useState("");
  const [passageiroSelecionado, setPassageiroSelecionado] = useState("");
  const [secoesOrcamentoMinimizadas, setSecoesOrcamentoMinimizadas] = useState(true);
  const [vendasMinimizadas, setVendasMinimizadas] = useState(true);
  const [detalhesMinimizados, setDetalhesMinimizados] = useState(true);
  const [resumoMinimizado, setResumoMinimizado] = useState(true);
  const [orcamentoResumoMinimizado, setOrcamentoResumoMinimizado] = useState(true);
  const [roteiroMinimizado, setRoteiroMinimizado] = useState(true);
  const [houveAlteracoes, setHouveAlteracoes] = useState(false);
  const formularioCarregadoRef = useRef(false);
  const [provedorRoteiroIA, setProvedorRoteiroIA] = useState<"automático" | "openai" | "groq" | "gemini" | "openrouter" | "cloudflare">("automático");
  const [novaUrlOperadorItem, setNovaUrlOperadorItem] = useState("");
  
  function adicionarUrlOperadorItem(itemId: number) {
    const url = novaUrlOperadorItem.trim();
    if (!url) return;
    
    const itensAtualizados = form.itens?.map(item => {
      if (item.id === itemId) {
        const urlsAtuais = item.urlOperador || [];
        if (urlsAtuais.includes(url)) {
          setErro("Esta URL já foi adicionada.");
          return item;
        }
        return { ...item, urlOperador: [...urlsAtuais, url] };
      }
      return item;
    }) || [];
    
    setForm({ ...form, itens: itensAtualizados });
    setNovaUrlOperadorItem("");
    setErro("");
  }

  function removerUrlOperadorItem(itemId: number, urlIndex: number) {
    const itensAtualizados = form.itens?.map(item => {
      if (item.id === itemId) {
        const urlsAtuais = item.urlOperador || [];
        const novasUrls = urlsAtuais.filter((_, i) => i !== urlIndex);
        return { ...item, urlOperador: novasUrls };
      }
      return item;
    }) || [];
    
    setForm({ ...form, itens: itensAtualizados });
  }
  
  function obterDestinoPrincipalOrcamento(orcBase?: Partial<Orcamento>, preferirEstadoFormulario = false) {
    const hospedagemFonte = hospedagem.length > 0 ? hospedagem : Array.isArray(orcBase?.hospedagem) ? orcBase.hospedagem : [];
    const transporteFonte = transporte.length > 0 ? transporte : Array.isArray(orcBase?.transporte) ? orcBase.transporte : [];
    const voosFonte = voos.length > 0 ? voos : Array.isArray(orcBase?.voos) ? orcBase.voos : [];
    const hospedagemFinal = preferirEstadoFormulario ? hospedagem : hospedagemFonte;
    const transporteFinal = preferirEstadoFormulario ? transporte : transporteFonte;
    const voosFinal = preferirEstadoFormulario ? voos : voosFonte;

    const destinoVoo = voosFinal.find((item) => typeof item?.destino === "string" && item.destino.trim())?.destino || "";
    if (destinoVoo) return String(destinoVoo).trim();

    const destinoExplcito = String(orcBase?.destino || form.destino || "").trim();
    if (destinoExplcito) return destinoExplcito;

    const destinoHospedagem =
        hospedagemFinal.find((item) => typeof item?.destino === "string" && item.destino.trim())?.destino
        || hospedagemFinal.find((item) => typeof item?.local === "string" && item.local.trim())?.local
        || hospedagemFinal.find((item) => typeof item?.cidade === "string" && item.cidade.trim())?.cidade
        || "";

    if (destinoHospedagem) return String(destinoHospedagem).trim();

    const destinoTransporte = transporteFinal.find((item) => typeof item?.destino === "string" && item.destino.trim())?.destino || "";
    if (destinoTransporte) return String(destinoTransporte).trim();

    return "";
  }

  function calcularTotalOrcamentoAtual() {
    const totalVendas = form.itens.reduce((acc, item) => acc + calcItem(item), 0);
    const totalPacotes = pacotes.reduce((acc, item) => acc + (Number(item?.valor) || 0), 0);
    const totalHospedagem = hospedagem.reduce((acc, item) => acc + (Number(item?.preco) || 0), 0);
    const totalTransporte = transporte.reduce((acc, item) => acc + (Number(item?.valor) || 0), 0);
    const totalRestaurante = restaurante.reduce((acc, item) => acc + (Number(item?.preco) || 0), 0);
    const totalExperiencias = experiencias.reduce((acc, item) => acc + (Number(item?.preco) || 0), 0);
    const totalSeguro = seguro.reduce((acc, item) => acc + (Number(item?.valor) || 0), 0);

    return totalVendas + totalPacotes + totalHospedagem + totalTransporte + totalRestaurante + totalExperiencias + totalSeguro;
  }

  async function verificarReceitaLancada(orcamentoId: number) {
    try {
      const lancamentos = await listarLancamentosFinanceiros();
      const receita = lancamentos.find(
          (item: LancamentoFinanceiro) => item.tipo === "receita" && item.orcamentoId === orcamentoId
      );
      setStatusBloqueado(Boolean(receita));
    } catch {
      setStatusBloqueado(false);
    }
  }

  function abrirCadastroLancamentoFinanceiro() {
    setErroLancamento(null);
    setQuitadoLancamento(true);
    setFormaPagamentoLancamento("");
    setParcelasLancamento("1");
    setDataLancamento(form.dataCriacao || new Date().toISOString().slice(0, 10));
    setModalFinanceiroAberto(true);
  }

  async function onChangeStatusOrcamento(novoStatus: StatusOrc) {
    if (statusBloqueado) {
      return;
    }

    const eraAprovado = form.status === "Aprovado";
    setForm((prev) => ({ ...prev, status: novoStatus }));

    if (novoStatus !== "Aprovado" || eraAprovado) {
      return;
    }

    setPopupAprovadoAberto(true);
  }

  function confirmarAprovadoQuitado() {
    setPopupAprovadoAberto(false);

    if (!editando?.id) {
      setErro("Salve o orçamento primeiro para gerar o lançamento financeiro vinculado.");
      return;
    }

    abrirCadastroLancamentoFinanceiro();
  }

  function confirmarAprovadoSemQuitacao() {
    setPopupAprovadoAberto(false);
  }

  async function salvarLancamentoVinculado() {
    if (!editando?.id) {
      setErroLancamento("Orçamento inválido para vincular lançamento financeiro.");
      return;
    }

    const valorTotal = calcularTotalOrcamentoAtual();
    const parcelas = Number(parcelasLancamento);

    if (!dataLancamento) {
      setErroLancamento("Informe a data do lançamento.");
      return;
    }

    if (quitadoLancamento && !formaPagamentoLancamento.trim()) {
      setErroLancamento("Selecione a forma de pagamento.");
      return;
    }

    if (quitadoLancamento && (!Number.isInteger(parcelas) || parcelas <= 0)) {
      setErroLancamento("Informe a quantidade de parcelas válida.");
      return;
    }

    setSalvandoLancamento(true);
    setErroLancamento(null);

    try {
      await criarLancamentoFinanceiro({
        tipo: "receita",
        descricao: `Receita do orçamento #${form.numero} - ${form.cliente}`,
        valor: Math.abs(valorTotal),
        data: dataLancamento,
        oculto: false,
        orcamentoPago: quitadoLancamento,
        formaPagamento: quitadoLancamento ? formaPagamentoLancamento.trim() : "",
        parcelas: quitadoLancamento ? parcelas : null,
        orcamentoId: editando.id,
      });

      setModalFinanceiroAberto(false);
      setStatusBloqueado(true);
    } catch (error) {
      setErroLancamento(error instanceof Error ? error.message : "Erro ao salvar lançamento financeiro.");
    } finally {
      setSalvandoLancamento(false);
    }
  }

  async function carregarOrcamentos() {
    setErro(null);
    try {
      const listaApi = await listarOrcamentos();
      setLista(listaApi);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar orçamentos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function carregarDadosCadastros() {
      try {
        const [clientes, funcionarios, produtos, fornecedores] = await Promise.all([listarClientes(), listarFuncionarios(), listarProdutos(), listarFornecedores()]);

        if (mounted) {
          setClientesAtivos(clientes.filter((cliente) => cliente.status === "Ativo"));
          setFuncionariosAtivos(funcionarios.filter((funcionario) => funcionario.status === "Ativo"));
          setProdutosAtivos(produtos.filter((produto) => produto.status === "Ativo"));
          setFornecedoresAtivos(fornecedores.filter((fornecedor) => fornecedor.status === "Ativo"));
        }
      } catch {
        if (mounted) {
          setClientesAtivos([]);
          setFuncionariosAtivos([]);
          setProdutosAtivos([]);
          setFornecedoresAtivos([]);
        }
      }
    }

    carregarDadosCadastros();
    carregarOrcamentos();

    // Garantir que Voos e Hospedagem estejam minimizados no carregamento inicial

    return () => {
      mounted = false;
    };
  }, []);

  // Handle state params from ResumoOrcamentos
  useEffect(() => {
    const state = location.state as any;
    if (state?.editId) {
      const orc = lista.find(o => o.id === state.editId);
      if (orc) {
        void abrirEdicao(orc);
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.state, lista, location.pathname, navigate]);

  // Detect form changes - only set to true after initial load
  useEffect(() => {
    if (tela === "form") {
      if (!formularioCarregadoRef.current) {
        // First time loading form - mark as loaded but don't mark as changed
        formularioCarregadoRef.current = true;
        return;
      }
      // After initial load, any change marks as changed
      setHouveAlteracoes(true);
    }
  }, [form, pacotes, voos, hospedagem, roteiro, dayByDay, transporte, restaurante, experiencias, seguro, perfilViagemSelecionado, tela]);

  const filtrados = lista.filter((o) => {
    const q = busca.toLowerCase();
    const match = o.numero.toLowerCase().includes(q) || o.cliente.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
    return match && (filtroStatus === "Todos" || o.status === filtroStatus);
  });

  const totais = {
    total: lista.reduce((a, o) => a + calcTotalOrcamento(o), 0),
    aprovados: lista.filter((o) => o.status === "Aprovado").reduce((a, o) => a + calcTotalOrcamento(o), 0),
    pendentes: lista.filter((o) => o.status === "Enviado").length,
  };

  function toggleExpandir(id: number) {
    setExpandidos((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const [favoritos, setFavoritos] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem("favoritos_orcamentos") || "[]"); }
    catch { return []; }
  });

  function toggleFavorito(id: number) {
    setFavoritos((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("favoritos_orcamentos", JSON.stringify(next));
      window.dispatchEvent(new Event("favoritos_orcamentos_updated"));
      return next;
    });
  }

  function abrirNovo() {
    setEditando(null);
    setErro(null);
    // Limpa o formulário principal e as seções
    setForm({ ...orcVazio(), numero: gerarNumero(lista) });
    setPacotes([]);
    setVoos([]);
    setHospedagem([]);
    setRoteiro("");
    setPromptRoteiroIA("");
    setDayByDay([]);
    setTransporte([]);
    setRestaurante([]);
    setExperiencias([]);
    setSeguro([]);
    setDadosClienteMinimizados(true);
    setPerfilViagemSelecionado([]);
    setPromptPerfilViagemIA("");
    setPerfilViagemMinimizado(true);
    setCategoriasPerfilMinimizadas(todasCategoriasMinimizadas);
    setSecoesOrcamentoMinimizadas(true);
    setVendasMinimizadas(true);
    setDetalhesMinimizados(true);
    setResumoMinimizado(true);
    setOrcamentoResumoMinimizado(true);
    setRoteiroMinimizado(true);
    setHouveAlteracoes(false);
    formularioCarregadoRef.current = false;
    setPassageiroSelecionado("");
    setStatusBloqueado(false);
    setSection("Pacotes");
    setTela("form");
  }

  async function abrirEdicao(o: Orcamento) {
    setEditando(o);
    setErro(null);
    setForm(o);

    // Carrega os dados das seções para os estados correspondentes
    setPacotes(
        (o.pacotes || []).map((p: any) => ({ ...p, documentos: p.documentos || [] })),
    );
    setVoos(
        // @ts-ignore
        o.voos || [],
    );
    setHospedagem(o.hospedagem || []);
    setRoteiro(o.roteiro || "");
    setPromptRoteiroIA(typeof o.promptRoteiroIA === "string" ? o.promptRoteiroIA : "");
    setDayByDay(o.dayByDay || []);
    setTransporte(o.transporte || []);
    setRestaurante(o.restaurante || []);
    setExperiencias(o.experiencias || []);
    setSeguro(o.seguro || []);
    setDadosClienteMinimizados(true);
    setPerfilViagemSelecionado(Array.isArray(o.perfilViagem) ? o.perfilViagem.filter((item) => typeof item === "string") : []);
    setPromptPerfilViagemIA(typeof o.promptPerfilViagemIA === "string" ? o.promptPerfilViagemIA : "");
    setPerfilViagemMinimizado(true);
    setCategoriasPerfilMinimizadas({});
    setSecoesOrcamentoMinimizadas(true);
    setVendasMinimizadas(true);
    setDetalhesMinimizados(true);
    setResumoMinimizado(true);
    setOrcamentoResumoMinimizado(true);
    setRoteiroMinimizado(true);
    setHouveAlteracoes(false);
    formularioCarregadoRef.current = false;
    setPassageiroSelecionado("");
    setSection("Pacotes");
    await verificarReceitaLancada(o.id);
    setTela("form");
  }

  function adicionarPassageiro(nomePassageiro: string) {
    const nome = nomePassageiro.trim();
    if (!nome) {
      return;
    }

    setForm((prev) => {
      const atuais = Array.isArray(prev.passageiros) ? prev.passageiros : [];
      if (atuais.includes(nome)) {
        return prev;
      }

      return { ...prev, passageiros: [...atuais, nome] };
    });
  }

  function removerPassageiro(nomePassageiro: string) {
    setForm((prev) => ({
      ...prev,
      passageiros: (prev.passageiros || []).filter((nome) => nome !== nomePassageiro),
    }));
  }

  function toggleOpcaoPerfilViagem(chave: string) {
    setPerfilViagemSelecionado((prev) => (
        prev.includes(chave) ? prev.filter((item) => item !== chave) : [...prev, chave]
    ));
  }

  function toggleCategoriaPerfilViagem(titulo: string) {
    setCategoriasPerfilMinimizadas((prev) => ({
      ...prev,
      [titulo]: !prev[titulo],
    }));
  }

  function voltar() { setTela("lista"); setEditando(null); }

  async function salvar() {
    if (!form.cliente.trim()) return null;
    setSalvando(true);
    setErro(null);

    // Montar dados do orçamento com seções
    const orcComSecoes = {
      ...form,
      destino: obterDestinoPrincipalOrcamento(undefined, true),
      pacotes: pacotes.length > 0 ? pacotes : undefined,
      voos: voos.length > 0 ? voos : undefined,
      hospedagem: hospedagem.length > 0 ? hospedagem : undefined,
      roteiro: roteiro.trim() ? roteiro : undefined,
      promptRoteiroIA: promptRoteiroIA.trim(),
      dayByDay: dayByDay.length > 0 ? dayByDay : undefined,
      transporte: transporte.length > 0 ? transporte : undefined,
      restaurante: restaurante.length > 0 ? restaurante : undefined,
      experiencias: experiencias.length > 0 ? experiencias : undefined,
      seguro: seguro.length > 0 ? seguro : undefined,
      perfilViagem: perfilViagemSelecionado,
      promptPerfilViagemIA: promptPerfilViagemIA.trim(),
    };

    try {
      if (editando) {
        await atualizarOrcamento(editando.id, orcComSecoes);
        await carregarOrcamentos();
        voltar();
        return editando.id;
      }

      const criado = await criarOrcamento(orcComSecoes);
      await carregarOrcamentos();
      voltar();
      return criado.id;
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar orçamento.");
      return null;
    } finally {
      setSalvando(false);
    }
  }

  async function duplicar(o: Orcamento) {
    const novo: OrcamentoPayload = { ...o, numero: gerarNumero([...lista, o]), status: "Rascunho", dataCriacao: new Date().toISOString().split("T")[0] };
    delete (novo as any).id;
    try {
      await criarOrcamento(novo);
      await carregarOrcamentos();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao duplicar orçamento.");
    }
  }

  function confirmarDuplicacao(o: Orcamento) {
    setOrcamentoDuplicacaoPendente(o);
  }

  function cancelarDuplicacao() {
    setOrcamentoDuplicacaoPendente(null);
  }

  async function executarDuplicacaoConfirmada() {
    if (!orcamentoDuplicacaoPendente) {
      return;
    }

    const orc = orcamentoDuplicacaoPendente;
    setOrcamentoDuplicacaoPendente(null);
    await duplicar(orc);
  }

  function gerarRoteiro(orc: Orcamento | null = null) {
    const orcParaAbrir = orc || (editando ? editando : null);
    if (!orcParaAbrir) return;

    const usandoEstadoFormulario = !orc && Boolean(editando);

    // Montar dados do orçamento com seções atualizadas
    const orcComSecoes = {
      ...orcParaAbrir,
      destino: obterDestinoPrincipalOrcamento(orcParaAbrir, usandoEstadoFormulario),
      pacotes: usandoEstadoFormulario ? pacotes : orcParaAbrir.pacotes,
      voos: usandoEstadoFormulario ? voos : orcParaAbrir.voos,
      hospedagem: usandoEstadoFormulario ? hospedagem : orcParaAbrir.hospedagem,
      roteiro: usandoEstadoFormulario ? roteiro : orcParaAbrir.roteiro,
      promptRoteiroIA: usandoEstadoFormulario ? promptRoteiroIA : (orcParaAbrir.promptRoteiroIA || ""),
      dayByDay: usandoEstadoFormulario ? dayByDay : orcParaAbrir.dayByDay,
      transporte: usandoEstadoFormulario ? transporte : orcParaAbrir.transporte,
      restaurante: usandoEstadoFormulario ? restaurante : orcParaAbrir.restaurante,
      experiencias: usandoEstadoFormulario ? experiencias : orcParaAbrir.experiencias,
      seguro: usandoEstadoFormulario ? seguro : orcParaAbrir.seguro,
      perfilViagem: usandoEstadoFormulario ? perfilViagemSelecionado : orcParaAbrir.perfilViagem,
      promptPerfilViagemIA: usandoEstadoFormulario ? promptPerfilViagemIA : (orcParaAbrir.promptPerfilViagemIA || ""),
    };

    // Store in localStorage to access from new tab
    localStorage.setItem(`orc_${orcComSecoes.numero}`, JSON.stringify(orcComSecoes));
    // Open roteiro in new tab using numero (not id)
    window.open(`/financeiro/orcamentos/roteiro/${orcComSecoes.publicToken || orcComSecoes.numero}`, "_blank");
  }

  function abrirResumo(orc: Orcamento | null = null) {
    const orcParaAbrir = orc || (editando ? { id: editando.id, ...form } : null);
    if (!orcParaAbrir) return;

    const usandoEstadoFormulario = !orc && Boolean(editando);

    const orcComSecoes = {
      ...orcParaAbrir,
      destino: obterDestinoPrincipalOrcamento(orcParaAbrir, usandoEstadoFormulario),
      pacotes: usandoEstadoFormulario ? pacotes : orcParaAbrir.pacotes,
      voos: usandoEstadoFormulario ? voos : orcParaAbrir.voos,
      hospedagem: usandoEstadoFormulario ? hospedagem : orcParaAbrir.hospedagem,
      roteiro: usandoEstadoFormulario ? roteiro : orcParaAbrir.roteiro,
      promptRoteiroIA: usandoEstadoFormulario ? promptRoteiroIA : (orcParaAbrir.promptRoteiroIA || ""),
      dayByDay: usandoEstadoFormulario ? dayByDay : orcParaAbrir.dayByDay,
      transporte: usandoEstadoFormulario ? transporte : orcParaAbrir.transporte,
      restaurante: usandoEstadoFormulario ? restaurante : orcParaAbrir.restaurante,
      experiencias: usandoEstadoFormulario ? experiencias : orcParaAbrir.experiencias,
      seguro: usandoEstadoFormulario ? seguro : orcParaAbrir.seguro,
      perfilViagem: usandoEstadoFormulario ? perfilViagemSelecionado : orcParaAbrir.perfilViagem,
      promptPerfilViagemIA: usandoEstadoFormulario ? promptPerfilViagemIA : (orcParaAbrir.promptPerfilViagemIA || ""),
    };

    // Armazena no localStorage para acessar na nova aba
    localStorage.setItem(`orc_${orcComSecoes.numero}`, JSON.stringify(orcComSecoes));
    window.open(`/financeiro/orcamentos/resumo/${orcComSecoes.publicToken || orcComSecoes.numero}`, "_blank");
  }

  // --- itens do form ---
  function addItem() { setForm((f) => ({ ...f, itens: [...f.itens, itemVazio()] })); }
  function removeItem(id: number) { setForm((f) => ({ ...f, itens: f.itens.filter((i) => i.id !== id) })); }
  function updateItem(id: number, field: keyof ItemOrc, value: string | number) {
    setForm((f) => ({ ...f, itens: f.itens.map((i) => i.id === id ? { ...i, [field]: value } : i) }));
  }

  function selecionarProdutoItem(id: number, nomeProduto: string) {
    const nomeNormalizado = nomeProduto.trim().toLowerCase();
    const produto = produtosAtivos.find((item) => item.nome.trim().toLowerCase() === nomeNormalizado);

    setForm((f) => ({
      ...f,
      itens: f.itens.map((item) =>
          item.id === id
              ? {
                ...item,
                descricao: nomeProduto,
                unidade: produto?.unidade || item.unidade,
                valorUnitario: produto?.preco ?? item.valorUnitario,
              }
              : item
      ),
    }));
  }

  async function uploadDocumentosVenda(idItem: number, e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    if (arquivos.length === 0) return;

    const docs = await Promise.all(
        arquivos.map(
            (arquivo) =>
                new Promise<DocumentoVenda>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    resolve({
                      id: Date.now() + Math.floor(Math.random() * 10000),
                      nome: arquivo.name,
                      tipo: arquivo.type,
                      arquivo: String(reader.result || ""),
                    });
                  };
                  reader.onerror = () => reject(new Error("Falha ao carregar documento."));
                  reader.readAsDataURL(arquivo);
                })
        )
    );

    setForm((f) => ({
      ...f,
      itens: f.itens.map((item) =>
          item.id === idItem
              ? { ...item, documentos: [...(item.documentos || []), ...docs] }
              : item
      ),
    }));
    e.target.value = "";
  }

  function removerDocumentoVenda(idItem: number, idDocumento: number) {
    setForm((f) => ({
      ...f,
      itens: f.itens.map((item) =>
          item.id === idItem
              ? { ...item, documentos: (item.documentos || []).filter((doc) => doc.id !== idDocumento) }
              : item
      ),
    }));
  }

  // --- Geração de Roteiro com IA (Simulação) ---
  async function gerarRoteiroComIA() {
    setGerandoRoteiro(true);

    const removerSecaoEvidenciasDosLugares = (texto: string): string => {
      const linhas = String(texto || "").split(/\r?\n/);
      const indiceSecao = linhas.findIndex((linha) => {
        const normalizada = String(linha || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
        return /(?:^|\s)(?:\d+[).]\s*)?evidencias\s+dos\s+lugares\b/.test(normalizada);
      });

      if (indiceSecao === -1) {
        return texto;
      }

      return linhas.slice(0, indiceSecao).join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
    };

    const destinoPrincipal = obterDestinoPrincipalOrcamento(undefined, true);

    // Coleta dados de voo, hospedagem e perfil da viagem para enriquecer o contexto da IA.
    const voosResumo = voos
        .map((voo, index) => {
          const origem = String(voo?.origem || "").trim();
          const destino = String(voo?.destino || "").trim();
          const data = String(voo?.data || voo?.dataIda || "").trim();
          if (!origem && !destino && !data) return "";

          return `${index + 1}) ${origem || "Origem não informada"} -> ${destino || "Destino não informado"}${data ? ` em ${fmtData(data)}` : ""}`;
        })
        .filter(Boolean);

    const destinosDosVoos = voos
        .map((voo) => String(voo?.destino || "").trim())
        .filter(Boolean);

    const hospedagemResumo = hospedagem
        .map((item, index) => {
          const nome = String(item?.nome || item?.nomeHotel || "").trim();
          const local = String(item?.local || item?.cidade || item?.destino || "").trim();
          const checkin = String(item?.checkin || "").trim();
          const checkout = String(item?.checkout || "").trim();

          if (!nome && !local && !checkin && !checkout) return "";

          const periodo = checkin || checkout
              ? ` (${checkin ? fmtData(checkin) : "data não informada"} a ${checkout ? fmtData(checkout) : "data não informada"})`
              : "";

          return `${index + 1}) ${nome || "Hospedagem sem nome"}${local ? ` - ${local}` : ""}${periodo}`;
        })
        .filter(Boolean);

    // Coleta os detalhes de Voo, Hospedagem, Traslado e Ingresso informados nas telas de Pacotes.
    const pacotesVooResumo = pacotes
        .map((pacote: any, index: number) => {
          const partes: string[] = [];
          if (pacote?.operador) partes.push(`Operador: ${pacote.operador}`);
          if (pacote?.ciaAerea) partes.push(`Cia aérea: ${pacote.ciaAerea}`);
          if (pacote?.reserva) partes.push(`Reserva: ${pacote.reserva}`);

          const origemIda = String(pacote?.origemIda || pacote?.origem || "").trim();
          const destinoIda = String(pacote?.destinoIda || pacote?.destino || "").trim();
          if (origemIda || destinoIda || pacote?.dataIda) {
            partes.push(
                `Ida: ${origemIda || "origem não informada"} -> ${destinoIda || "destino não informado"}` +
                `${pacote?.dataIda ? ` em ${fmtData(pacote.dataIda)}` : ""}${pacote?.duracaoIda ? ` (${pacote.duracaoIda})` : ""}`
            );
          }

          const origemVolta = String(pacote?.origemVolta || "").trim();
          const destinoVolta = String(pacote?.destinoVolta || "").trim();
          if (origemVolta || destinoVolta || pacote?.dataVolta) {
            partes.push(
                `Volta: ${origemVolta || "origem não informada"} -> ${destinoVolta || "destino não informado"}` +
                `${pacote?.dataVolta ? ` em ${fmtData(pacote.dataVolta)}` : ""}${pacote?.duracaoVolta ? ` (${pacote.duracaoVolta})` : ""}`
            );
          }

          if (pacote?.passageiros) partes.push(`Passageiros: ${pacote.passageiros}`);
          if (pacote?.politicaAlteracoesCancelamentos) partes.push(`Política de alterações/cancelamentos: ${pacote.politicaAlteracoesCancelamentos}`);

          if (partes.length === 0) return "";
          return `${index + 1}) ${partes.join(" | ")}`;
        })
        .filter(Boolean);

    const pacotesHospedagemResumo = pacotes
        .map((pacote: any, index: number) => {
          const partes: string[] = [];
          if (pacote?.hospedagemNome) partes.push(`Hotel: ${pacote.hospedagemNome}`);
          if (pacote?.hospedagemEndereco) partes.push(`Endereço: ${pacote.hospedagemEndereco}`);
          if (pacote?.hospedagemCheckin || pacote?.hospedagemCheckout) {
            partes.push(`Check-in/Check-out: ${pacote?.hospedagemCheckin || "não informado"} a ${pacote?.hospedagemCheckout || "não informado"}`);
          }
          if (pacote?.hospedagemNoites) partes.push(`Noites: ${pacote.hospedagemNoites}`);
          if (pacote?.hospedagemTipoQuarto) partes.push(`Tipo de quarto: ${pacote.hospedagemTipoQuarto}`);
          if (pacote?.hospedagemRegime) partes.push(`Regime: ${pacote.hospedagemRegime}`);
          if (pacote?.hospedagemComodidades) partes.push(`Comodidades: ${pacote.hospedagemComodidades}`);
          if (pacote?.hospedagemPoliticasCondicoesInformacoesEspeciais) {
            partes.push(`Políticas/informações especiais: ${pacote.hospedagemPoliticasCondicoesInformacoesEspeciais}`);
          }

          if (partes.length === 0) return "";
          return `${index + 1}) ${partes.join(" | ")}`;
        })
        .filter(Boolean);

    const pacotesTrasladoResumo = pacotes
        .map((pacote: any, index: number) => {
          const partes: string[] = [];
          if (pacote?.trasladoTipo) partes.push(`Tipo: ${pacote.trasladoTipo}`);
          if (pacote?.trasladoLocalPartida || pacote?.trasladoLocalChegada) {
            partes.push(`Trajeto: ${pacote?.trasladoLocalPartida || "local de partida não informado"} -> ${pacote?.trasladoLocalChegada || "local de chegada não informado"}`);
          }
          if (pacote?.trasladoData || pacote?.trasladoHorario) {
            partes.push(`Data/Horário: ${[pacote?.trasladoData ? fmtData(pacote.trasladoData) : "", pacote?.trasladoHorario].filter(Boolean).join(" ")}`);
          }
          if (pacote?.trasladoVeiculoEmpresa) partes.push(`Veículo/Empresa: ${pacote.trasladoVeiculoEmpresa}`);
          if (pacote?.trasladoObservacoes) partes.push(`Observações: ${pacote.trasladoObservacoes}`);

          if (partes.length === 0) return "";
          return `${index + 1}) ${partes.join(" | ")}`;
        })
        .filter(Boolean);

    const pacotesIngressoResumo = pacotes
        .map((pacote: any, index: number) => {
          const partes: string[] = [];
          if (pacote?.ingressoNomeAtracao) partes.push(`Atração/Ingresso: ${pacote.ingressoNomeAtracao}`);
          if (pacote?.ingressoData || pacote?.ingressoHorario) {
            partes.push(`Data/Horário: ${[pacote?.ingressoData ? fmtData(pacote.ingressoData) : "", pacote?.ingressoHorario].filter(Boolean).join(" ")}`);
          }
          if (pacote?.ingressoQuantidade) partes.push(`Quantidade: ${pacote.ingressoQuantidade}`);
          if (pacote?.ingressoObservacoes) partes.push(`Observações: ${pacote.ingressoObservacoes}`);

          if (partes.length === 0) return "";
          return `${index + 1}) ${partes.join(" | ")}`;
        })
        .filter(Boolean);

    const perfilViagemResumo = perfilViagemSelecionado
        .map((item) => {
          const partes = String(item || "").split("::");
          if (partes.length === 2) {
            return `${partes[0]}: ${partes[1]}`;
          }
          return String(item || "").trim();
        })
        .filter(Boolean);

    const passageirosResumo = (form.passageiros || [])
        .map((nome) => String(nome || "").trim())
        .filter(Boolean);

    const promptPerfilViagemLimpo = promptPerfilViagemIA.trim();
    const promptRoteiroLimpo = promptRoteiroIA.trim();

    const destinosTexto = destinosDosVoos.length > 0
        ? destinosDosVoos.join(", ")
        : (destinoPrincipal || "Destino não informado");

    // Combina ambos os prompts: primeiro a personalização do roteiro, depois o perfil da viagem
    const diretrizesAdicionais = [promptRoteiroLimpo, promptPerfilViagemLimpo]
        .filter(Boolean)
        .join("\n- ");

    const prompt = `Crie uma sugestão de roteiro de viagem para ${form.cliente || "cliente"}.

  Contexto obrigatório para usar na sugestão:
  - Destino principal: ${destinoPrincipal || "não informado"}
  - Destino(s) dos voos: ${destinosTexto}
  - Voos informados:
  ${voosResumo.length > 0 ? voosResumo.join("\n") : "Nenhum voo informado"}
  - Hospedagem informada:
  ${hospedagemResumo.length > 0 ? hospedagemResumo.join("\n") : "Nenhuma hospedagem informada"}
  - Detalhes do Voo (Pacotes):
  ${pacotesVooResumo.length > 0 ? pacotesVooResumo.join("\n") : "Nenhum detalhe de voo informado nos pacotes"}
  - Detalhes da Hospedagem (Pacotes):
  ${pacotesHospedagemResumo.length > 0 ? pacotesHospedagemResumo.join("\n") : "Nenhum detalhe de hospedagem informado nos pacotes"}
  - Detalhes do Traslado (Pacotes):
  ${pacotesTrasladoResumo.length > 0 ? pacotesTrasladoResumo.join("\n") : "Nenhum detalhe de traslado informado nos pacotes"}
  - Detalhes do Ingresso (Pacotes):
  ${pacotesIngressoResumo.length > 0 ? pacotesIngressoResumo.join("\n") : "Nenhum detalhe de ingresso informado nos pacotes"}
  - Passageiros:
  ${passageirosResumo.length > 0 ? passageirosResumo.join(", ") : "Nenhum passageiro adicional informado"}
  - Perfil da viagem selecionado:
  ${perfilViagemResumo.length > 0 ? perfilViagemResumo.join("\n") : "Nenhum perfil selecionado"}
  - Diretrizes adicionais para personalizar o roteiro:
  ${diretrizesAdicionais || "Nenhuma diretriz adicional informada"}

  Formato obrigatório da resposta:
  1) Título elegante do roteiro.
  2) Resumo inspirador em 1 parágrafo.
  3) Bloco "Dia a dia sugerido" com subtítulos por dia (ex: "Dia 1 - ...") e atividades em bullets.
  4) Bloco "Destaques imperdíveis" com 5 a 8 itens.
  5) Bloco "Dicas práticas" (transporte, horários, segurança e clima).

  Escreva em português do Brasil, com tom profissional, bonito e claro para apresentar ao cliente final.
  Deixe os subtítulos de cada dia bem claros e organizados para fácil leitura.
  Nao utilize Markdown e nao use simbolos de formatacao como **, __, # ou listas com asterisco.
  A sugestão deve respeitar explicitamente os dados de voo, hospedagem, traslado, ingressos, passageiros e perfil da viagem fornecidos acima.`;

    try {
      let respostaFinal = "";

      const tentarComProvedor = async (provedor: "openai" | "groq" | "gemini" | "openrouter" | "cloudflare") => {
        const data = await enviarMensagemIA(
            [{ role: "user", content: prompt }],
            provedor
        );
        return data.reply;
      };

      if (provedorRoteiroIA === "automático") {
        const provedores: ("openai" | "groq" | "gemini" | "openrouter" | "cloudflare")[] = ["groq", "openai", "gemini", "openrouter", "cloudflare"];
        for (const provedor of provedores) {
          try {
            respostaFinal = await tentarComProvedor(provedor);
            if (respostaFinal) break;
          } catch (error) {
            console.warn(`Falha no provedor ${provedor}, tentando próximo...`, error);
          }
        }
        if (!respostaFinal) {
          throw new Error("Todos os provedores de IA falharam.");
        }
      } else {
        respostaFinal = await tentarComProvedor(provedorRoteiroIA);
      }

      const roteiroGerado = removerSecaoEvidenciasDosLugares(respostaFinal);
      setRoteiro(roteiroGerado);
    } catch (error) {
      console.error("Falha ao gerar roteiro com IA:", error);
      // Mantém a mensagem de erro original que vem da API, que é mais informativa.
      const detalhesErro = error instanceof Error ? error.message : JSON.stringify(error);
      setRoteiro(
          `Ocorreu um erro ao tentar gerar o roteiro com a IA. Detalhes: ${detalhesErro}`
      );
    } finally {
      setGerandoRoteiro(false);
    }
  }

  // ============ TELA FORMULÁRIO ============
  if (tela === "form") {
    const itensVendaComDescricao = form.itens.filter((item) => item.descricao.trim());
    const totalPacotesResumo = pacotes.reduce((acc, item) => {
      const valorPacote = Number(item?.valor) || 0;
      const valorHospedagem = Number(item?.hospedagemValor) || 0;
      return acc + valorPacote + valorHospedagem;
    }, 0);
    const totalHospedagemResumo = hospedagem.reduce((acc, item) => acc + (Number(item?.preco) || 0), 0);
    const totalTransporteResumo = transporte.reduce((acc, item) => acc + (Number(item?.valor) || 0), 0);
    const totalRestauranteResumo = restaurante.reduce((acc, item) => acc + (Number(item?.preco) || 0), 0);
    const totalExperienciasResumo = experiencias.reduce((acc, item) => acc + (Number(item?.preco) || 0), 0);
    const totalSeguroResumo = seguro.reduce((acc, item) => acc + (Number(item?.valor) || 0), 0);
    const totalVendasResumo = itensVendaComDescricao.reduce((acc, item) => acc + calcItem(item), 0);
    const totalResumo = totalVendasResumo
        + totalPacotesResumo
        + totalHospedagemResumo
        + totalTransporteResumo
        + totalRestauranteResumo
        + totalExperienciasResumo
        + totalSeguroResumo;
    const resumeSecoes = [
      { nome: "Pacotes" as const, quantidade: pacotes.length, valor: moeda(totalPacotesResumo) },
      { nome: "Voos" as const, quantidade: voos.length, valor: "—" },
      { nome: "Hospedagem" as const, quantidade: hospedagem.length, valor: moeda(totalHospedagemResumo) },
      { nome: "Day by Day" as const, quantidade: dayByDay.length, valor: "—" },
      { nome: "Transporte" as const, quantidade: transporte.length, valor: moeda(totalTransporteResumo) },
      { nome: "Restaurante" as const, quantidade: restaurante.length, valor: moeda(totalRestauranteResumo) },
      { nome: "Experiências" as const, quantidade: experiencias.length, valor: moeda(totalExperienciasResumo) },
      { nome: "Seguro" as const, quantidade: seguro.length, valor: moeda(totalSeguroResumo) },
    ].filter((secao) => secao.quantidade > 0) as { nome: SecaoOrcamento; quantidade: number; valor: string }[];
    return (
        <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="flex items-center gap-3 mb-6 flex-wrap relative">
            {form.cliente && (
              <span className="text-2xl font-bold text-indigo-700">{form.cliente}</span>
            )}
            {!editando && <h2 className="text-xl font-bold text-gray-900">Novo Orçamento</h2>}

            {/* Save/Exit button - shows Salvar if changes, Sair otherwise */}
            <div className="ml-auto">
              <Button
                onClick={houveAlteracoes ? salvar : voltar}
                disabled={salvando || (houveAlteracoes && !form.cliente.trim())}
                className={houveAlteracoes ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-600 hover:bg-gray-700 text-white"}
              >
                {houveAlteracoes ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {salvando ? "Salvando..." : editando ? "Salvar" : "Criar orçamento"}
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Sair
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
              {/* Dados do cliente */}
              <Card className="p-3 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><User className="w-4 h-4 text-indigo-500" /> Dados do Cliente</h3>
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDadosClienteMinimizados((prev) => !prev)}
                      className="h-8 px-2 text-gray-600"
                  >
                    {dadosClienteMinimizados ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    <span className="ml-1">{dadosClienteMinimizados ? " " : " "}</span>
                  </Button>
                </div>
                {!dadosClienteMinimizados && (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                      <div className="flex flex-col">
                        <Label htmlFor="cliente">Cliente *</Label>
                        <select
                            id="cliente"
                            value={form.cliente}
                            onChange={(e) => {
                              const nome = e.target.value;
                              const cliente = clientesAtivos.find((item) => item.nome === nome);
                              const funcionario = funcionariosAtivos.find((item) => item.name === nome);
                              const fornecedor = fornecedoresAtivos.find((item) => (item.nomeFantasia || item.razaoSocial) === nome);
                              setForm({
                                ...form,
                                cliente: nome,
                                email: cliente?.email ?? funcionario?.email ?? fornecedor?.email ?? "",
                              });
                            }}
                            className="mt-1 flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <option value="">Selecione um cliente</option>
                          {[
                            ...clientesAtivos.map((c) => ({ nome: c.nome, tipo: "Cliente" as const })),
                            ...funcionariosAtivos.map((f) => ({ nome: f.name, tipo: "Funcionário" as const })),
                            ...fornecedoresAtivos.map((f) => ({ nome: f.nomeFantasia || f.razaoSocial, tipo: "Fornecedor" as const })),
                          ]
                            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                            .map((item) => (
                              <option key={`${item.tipo}-${item.nome}`} value={item.nome}>
                                {item.nome}
                              </option>
                            ))}
                        </select>
                        {form.cliente && (
                            <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700 border border-indigo-100">
                        {form.cliente}
                        <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, cliente: "", email: "" }))}
                            className="text-indigo-500 hover:text-indigo-700"
                            aria-label={`Remover cliente ${form.cliente}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                            </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <Label htmlFor="passageiros">Passageiros</Label>
                        <select
                            id="passageiros"
                            value={passageiroSelecionado}
                            onChange={(e) => {
                              const nome = e.target.value;
                              setPassageiroSelecionado("");
                              adicionarPassageiro(nome);
                            }}
                            className="mt-1 flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <option value="">Selecione e adicione passageiros</option>
                          {[
                            ...clientesAtivos.map((c) => ({ nome: c.nome, tipo: "Cliente" as const })),
                            ...funcionariosAtivos.map((f) => ({ nome: f.name, tipo: "Funcionário" as const })),
                            ...fornecedoresAtivos.map((f) => ({ nome: f.nomeFantasia || f.razaoSocial, tipo: "Fornecedor" as const })),
                          ]
                            .filter((item) => !(form.passageiros || []).includes(item.nome))
                            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                            .map((item) => (
                              <option key={`${item.tipo}-${item.nome}`} value={item.nome}>
                                {item.nome}
                              </option>
                            ))}
                        </select>

                        {(form.passageiros || []).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(form.passageiros || []).map((nome) => (
                                  <span key={nome} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700 border border-indigo-100">
                          {nome}
                                    <button
                                        type="button"
                                        onClick={() => removerPassageiro(nome)}
                                        className="text-indigo-500 hover:text-indigo-700"
                                        aria-label={`Remover passageiro ${nome}`}
                                    >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                              ))}
                            </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <Label htmlFor="agente-viagem">Agente de Viagem</Label>
                        <select
                            id="agente-viagem"
                            value={form.agenteViagem || ""}
                            onChange={(e) => setForm({ ...form, agenteViagem: e.target.value })}
                            className="mt-1 flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <option value="">Selecione um agente</option>
                          {funcionariosAtivos.map((funcionario) => (
                              <option key={funcionario.id} value={funcionario.name}>{funcionario.name}</option>
                          ))}
                        </select>
                        {form.agenteViagem && (
                            <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700 border border-indigo-100">
                        {form.agenteViagem}
                        <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, agenteViagem: "" }))}
                            className="text-indigo-500 hover:text-indigo-700"
                            aria-label={`Remover agente ${form.agenteViagem}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                            </div>
                        )}
                      </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setDadosClienteMinimizados(true)}
                        className="absolute bottom-2 right-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                        title="Minimizar"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    </>
                )}
              </Card>

              {/* Detalhes */}
              <Card className="p-3 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Detalhes</h3>
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetalhesMinimizados((prev) => !prev)}
                      className="h-8 px-2 text-gray-600"
                  >
                    {detalhesMinimizados ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    <span className="ml-1">{detalhesMinimizados ? " " : " "}</span>
                  </Button>
                </div>
                {!detalhesMinimizados && (
                <>
                <div className="space-y-4 relative">
                  <div>
                    <Label>Número</Label>
                    <Input value={form.numero} readOnly disabled className="mt-1 font-mono bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div>
                    <Label htmlFor="dataCriacao">Data de emissão</Label>
                    <Input id="dataCriacao" type="date" value={form.dataCriacao} onChange={(e) => setForm({ ...form, dataCriacao: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="dataValidade">Válido até</Label>
                    <Input id="dataValidade" type="date" value={form.dataValidade} onChange={(e) => setForm({ ...form, dataValidade: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="formaPagamento">Forma de pagamento</Label>
                    <select
                        id="formaPagamento"
                        value={form.formaPagamento || ""}
                        onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })}
                        className="mt-1 flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
                    <Label htmlFor="orcamento-parcelado">Parcelado?</Label>
                    <select
                        id="orcamento-parcelado"
                        value={(form.parcelas || 1) > 1 ? "sim" : "nao"}
                        onChange={(e) => {
                          const parcelado = e.target.value === "sim";
                          setForm({ ...form, parcelas: parcelado ? Math.max(2, Number(form.parcelas) || 2) : 1 });
                        }}
                        className="mt-1 flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <option value="nao">Não</option>
                      <option value="sim">Sim</option>
                    </select>
                  </div>
                  {(form.parcelas || 1) > 1 && (
                      <div>
                        <Label htmlFor="orcamento-parcelas">Qtd. de parcelas</Label>
                        <Input
                            id="orcamento-parcelas"
                            type="number"
                            min="2"
                            step="1"
                            value={form.parcelas || 2}
                            onChange={(e) => setForm({ ...form, parcelas: Math.max(2, Number(e.target.value) || 2) })}
                            className="mt-1"
                        />
                      </div>
                  )}
                  <div>
                    <Label>Status do Orçamento</Label>
                    <select
                        value={form.status}
                        onChange={(e) => void onChangeStatusOrcamento(e.target.value as StatusOrc)}
                        className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        disabled={statusBloqueado}
                    >
                      {allStatus.map((s) => (
                          <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {statusBloqueado && (
                        <p className="mt-1 text-xs text-gray-500">
                          Status bloqueado após lançamento financeiro vinculado.
                        </p>
                    )}
                  </div>
                  {form.status === "Aprovado" && (
                      <div>
                        <Label>Status da Viagem</Label>
                        <select
                            value={form.statusViagem || ""}
                            onChange={(e) => setForm({ ...form, statusViagem: e.target.value as StatusViagem | undefined })}
                            className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        >
                          <option value="">Selecione...</option>
                          <option value="Não Iniciada">Não Iniciada</option>
                          <option value="Em Andamento">Em Andamento</option>
                          <option value="Finalizada">Finalizada</option>
                        </select>
                      </div>
                  )}
                </div>
                </>
                )}
              </Card>

              {/* Perfil da viagem */}
              <Card className="p-3 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /> Perfil da Viagem</h3>
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPerfilViagemMinimizado((prev) => {
                          if (prev) {
                            // expandindo — reseta todas categorias para minimizado
                            setCategoriasPerfilMinimizadas({ ...todasCategoriasMinimizadas });
                          }
                          return !prev;
                        });
                      }}
                      className="h-8 px-2 text-gray-600"
                  >
                    {perfilViagemMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    <span className="ml-1">{perfilViagemMinimizado ? " " : " "}</span>
                  </Button>
                </div>

                {perfilViagemMinimizado ? (
                    null
                ) : (
                    <div className="space-y-5">
                      <div>
                        <Label htmlFor="prompt-perfil-viagem-ia">Prompt para ajudar a IA</Label>
                        <textarea
                            id="prompt-perfil-viagem-ia"
                            value={promptPerfilViagemIA}
                            onChange={(e) => setPromptPerfilViagemIA(e.target.value)}
                            placeholder="Ex.: Priorize experiências gastronômicas locais, ritmo leve, atividades para crianças e deslocamentos curtos."
                            className="mt-1 min-h-24 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Esse texto será enviado junto com os dados do perfil para orientar a geração do roteiro pela IA.
                        </p>
                      </div>

                      {/* Controles expandir/minimizar todos */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const total = perfilViagemSelecionado.length;
                            return total > 0 ? `${total} opção${total !== 1 ? "ões" : ""} selecionada${total !== 1 ? "s" : ""}` : "Nenhuma opção selecionada";
                          })()}
                        </span>
                        <div className="flex gap-1">
                          <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCategoriasPerfilMinimizadas(Object.fromEntries(categoriasPerfilViagem.map((c) => [c.titulo, false])))}
                              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-800"
                              title="Expandir todos"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCategoriasPerfilMinimizadas(Object.fromEntries(categoriasPerfilViagem.map((c) => [c.titulo, true])))}
                              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-800"
                              title="Minimizar todos"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {categoriasPerfilViagem.map((categoria) => (
                          <div key={categoria.titulo} className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                type="button"
                                onClick={() => toggleCategoriaPerfilViagem(categoria.titulo)}
                                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                            >
                              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                {categoria.titulo}
                                {(() => {
                                  const selecionadosNaCategoria = categoria.opcoes.filter(
                                    (opcao) => perfilViagemSelecionado.includes(chavePerfilViagem(categoria.titulo, opcao))
                                  ).length;
                                  return selecionadosNaCategoria > 0 ? (
                                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                                      {selecionadosNaCategoria}
                                    </span>
                                  ) : null;
                                })()}
                              </span>
                              {categoriasPerfilMinimizadas[categoria.titulo] ? (
                                <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              ) : (
                                <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              )}
                            </button>
                            {!categoriasPerfilMinimizadas[categoria.titulo] && (
                              <div className="px-3 py-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                                {categoria.opcoes.map((opcao) => {
                                  const chave = chavePerfilViagem(categoria.titulo, opcao);
                                  const selecionado = perfilViagemSelecionado.includes(chave);

                                  return (
                                      <label
                                          key={chave}
                                          className="flex items-center gap-2 rounded-md border border-gray-200 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                      >
                                        <input
                                            type="checkbox"
                                            checked={selecionado}
                                            onChange={() => toggleOpcaoPerfilViagem(chave)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>{opcao}</span>
                                      </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                      ))}

                      <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPerfilViagemMinimizado(true)}
                            className="h-8 px-2 text-gray-600"
                        >
                          <ChevronUp className="h-4 w-4" />
                          <span className="ml-1">Minimizar</span>
                        </Button>
                      </div>
                    </div>
                )}
              </Card>

              {/* Seções do orçamento (sub-páginas) */}
              <Card className="p-3 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Seções do Orçamento</h3>
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSecoesOrcamentoMinimizadas((prev) => !prev)}
                      className="h-8 px-2 text-gray-600"
                  >
                    {secoesOrcamentoMinimizadas ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    <span className="ml-1">{secoesOrcamentoMinimizadas ? " " : " "}</span>
                  </Button>
                </div>

                {!secoesOrcamentoMinimizadas && (
                    <>
                      <div className="-mx-1 mb-2 overflow-x-auto px-1 pb-1">
                        <div className="flex w-max min-w-full flex-nowrap gap-1.5 text-sm">
                          {secoesOrcamento.map((s) => (
                              <button
                                  key={s}
                                  type="button"
                                  onClick={() => setSection(s)}
                                  className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs sm:text-sm ${section === s ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                              >
                                {s}
                              </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3">
                        {section === 'Pacotes' && (
                            <div className="space-y-6">
                              <PacotesForm pacotes={pacotes} onPacotesChange={setPacotes} hospedagens={hospedagem} onHospedagensChange={setHospedagem} />
                            </div>
                        )}

                        {section === 'Roteiro' && (
                            <div>
                              <div className="mb-4">
                                <Label htmlFor="prompt-roteiro-ia">Prompt para Sugestão de Roteiro com IA</Label>
                                <textarea
                                    id="prompt-roteiro-ia"
                                    value={promptRoteiroIA}
                                    onChange={(e) => setPromptRoteiroIA(e.target.value)}
                                    placeholder="Ex.: Roteiro contemplativo com visitas a templos antigos, ritmo lento e muitas atividades de meditação."
                                    className="mt-1 min-h-40 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  Instruções específicas para personalizar a sugestão de roteiro gerada pela IA.
                                </p>
                              </div>
                              <div className="flex justify-between items-center mb-2">
                                <Label htmlFor="roteiro-texto">Descrição do Roteiro</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={gerarRoteiroComIA}
                                    disabled={gerandoRoteiro}
                                    className="flex items-center gap-2 text-indigo-600 border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                                >
                                  <Sparkles className={`w-4 h-4 ${gerandoRoteiro ? 'animate-spin' : ''}`} /> {gerandoRoteiro ? 'Gerando...' : 'Analisar IA'}
                                </Button>
                              </div>
                              <RoteiroForm roteiro={roteiro} onRoteiroChange={setRoteiro} />
                            </div>
                        )}

                        {section === 'Day by Day' && (
                            <DayByDayForm dayByDay={dayByDay} onDayByDayChange={setDayByDay} />
                        )}

                        {section === 'Transporte' && (
                            <TransporteForm transportes={transporte} onTransportesChange={setTransporte} />
                        )}

                        {section === 'Restaurante' && (
                            <RestauranteForm restaurantes={restaurante} onRestaurantesChange={setRestaurante} />
                        )}

                        {section === 'Experiências' && (
                            <ExperienciasForm experiencias={experiencias} onExperienciasChange={setExperiencias} />
                        )}

                        {section === 'Seguro' && (
                            <SeguroForm seguros={seguro} onSegurosChange={setSeguro} />
                        )}

                        {section === 'Vendas' && (
                            <div>
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-sm text-gray-600">Itens relacionados à venda (produtos/serviços). Se quiser, digite um item manualmente.</p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setVendasMinimizadas((prev) => !prev)}
                                    className="gap-2 text-gray-600 hover:text-gray-900"
                                >
                                  {vendasMinimizadas ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                  {vendasMinimizadas ? " " : " "}
                                </Button>
                              </div>

                              {!vendasMinimizadas && (
                                  <>
                                    <div className="space-y-3">
                                      {form.itens.map((item, idx) => (
                                          <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-xs font-semibold text-gray-400">Item {idx + 1}</span>
                                              {form.itens.length > 1 && (
                                                  <button onClick={() => removeItem(item.id)} className="p-1 rounded text-red-400 hover:bg-red-50"><X className="w-3.5 h-3.5" /></button>
                                              )}
                                            </div>
                                            <div className="grid grid-cols-6 gap-2">
                                              <div className="col-span-6">
                                                <Input
                                                    value={item.descricao}
                                                    onChange={(e) => selecionarProdutoItem(item.id, e.target.value)}
                                                    placeholder="Selecione da lista ou digite outro produto/serviço"
                                                    list={`produtos-vendas-${item.id}`}
                                                />
                                                <datalist id={`produtos-vendas-${item.id}`}>
                                                  {produtosAtivos.map((produto) => (
                                                      <option key={produto.id} value={produto.nome} />
                                                  ))}
                                                </datalist>
                                              </div>
                                              <div className="col-span-2">
                                                <Input type="number" min="1" value={item.quantidade} onChange={(e) => updateItem(item.id, "quantidade", parseFloat(e.target.value) || 1)} placeholder="Qtd" />
                                              </div>
                                              <div className="col-span-1">
                                                <Input value={item.unidade} onChange={(e) => updateItem(item.id, "unidade", e.target.value)} placeholder="Un" />
                                              </div>
                                              <div className="col-span-2">
                                                <Input type="number" min="0" step="0.01" value={item.valorUnitario} onChange={(e) => updateItem(item.id, "valorUnitario", parseFloat(e.target.value) || 0)} placeholder="Valor unit." />
                                              </div>
                                              <div className="col-span-1">
                                                <Input type="number" min="0" max="100" value={item.desconto} onChange={(e) => updateItem(item.id, "desconto", parseFloat(e.target.value) || 0)} placeholder="% desc" />
                                              </div>
                                              <div className="col-span-6 sm:col-span-3">
                                                <Label htmlFor={`item-link-${item.id}`} className="text-xs text-gray-500">Link</Label>
                                                <div className="relative mt-1">
                                                  <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                                  <Input
                                                      id={`item-link-${item.id}`}
                                                      value={item.link || ""}
                                                      onChange={(e) => updateItem(item.id, "link", e.target.value)}
                                                      placeholder="https://..."
                                                      className="pl-8"
                                                  />
                                                </div>
                                              </div>
                                              <div className="col-span-6 sm:col-span-3">
                                                <Label htmlFor={`item-documentos-${item.id}`} className="text-xs text-gray-500">Downloads de documentos</Label>
                                                <Input
                                                    id={`item-documentos-${item.id}`}
                                                    type="file"
                                                    multiple
                                                    onChange={(e) => uploadDocumentosVenda(item.id, e)}
                                                    className="mt-1"
                                                />
                                              </div>
                                            </div>
                                            <div className="mt-3">
                                              <Label htmlFor={`item-url-operador-${item.id}`} className="text-xs text-gray-500">URL do Operador</Label>
                                              <div className="relative mt-1 flex gap-2">
                                                <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                                <Input
                                                    id={`item-url-operador-${item.id}`}
                                                    value={novaUrlOperadorItem}
                                                    onChange={(e) => setNovaUrlOperadorItem(e.target.value)}
                                                    placeholder="Cole a URL do operador aqui..."
                                                    className="pl-8"
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        adicionarUrlOperadorItem(item.id);
                                                      }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => adicionarUrlOperadorItem(item.id)}
                                                    className="shrink-0"
                                                >
                                                  <Plus className="h-4 w-4" />
                                                </Button>
                                              </div>
                                              {(item.urlOperador || []).length > 0 && (
                                                  <div className="space-y-1.5 pr-2 mt-2">
                                                    {(item.urlOperador || []).map((url, urlIndex) => (
                                                        <div key={urlIndex} className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs">
                                                          <div className="flex-1 min-w-0">
                                                            <a href={url} target="_blank" rel="noopener noreferrer" className="truncate text-indigo-600 hover:text-indigo-700 flex items-center gap-2">
                                                              <Link2 className="h-4 w-4 flex-shrink-0" />
                                                              <span className="truncate">{url}</span>
                                                            </a>
                                                          </div>
                                                          <button type="button" onClick={() => removerUrlOperadorItem(item.id, urlIndex)} className="ml-2 rounded p-1 text-red-500 hover:bg-red-50" title="Remover URL">
                                                            <X className="h-3.5 w-3.5" />
                                                          </button>
                                                        </div>
                                                    ))}
                                                  </div>
                                              )}
                                            </div>
                                            {(item.documentos || []).length > 0 && (
                                                <div className="mt-3 space-y-1.5">
                                                  {(item.documentos || []).map((doc) => (
                                                      <div key={doc.id} className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs">
                                                        <a
                                                            href={doc.arquivo}
                                                            download={doc.nome}
                                                            className="truncate text-indigo-600 hover:text-indigo-700"
                                                        >
                                                          {doc.nome}
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => removerDocumentoVenda(item.id, doc.id)}
                                                            className="ml-2 rounded p-1 text-red-500 hover:bg-red-50"
                                                            title="Remover documento"
                                                        >
                                                          <X className="h-3.5 w-3.5" />
                                                        </button>
                                                      </div>
                                                  ))}
                                                </div>
                                            )}
                                            <div className="text-right text-sm font-semibold text-indigo-700 mt-2">
                                              {moeda(calcItem(item))}
                                            </div>
                                          </div>
                                      ))}
                                    </div>

                                    <button onClick={addItem} className="mt-3 w-full border-2 border-dashed border-indigo-200 rounded-lg py-2.5 text-sm text-indigo-600 font-medium hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                                      <Plus className="w-4 h-4" /> Adicionar item
                                    </button>
                                  </>
                              )}
                            </div>
                        )}
                      </div>
                    </>
                )}
              </Card>

              {/* Resumo de valores */}
              <Card className="p-3 sm:p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><DollarSign className="w-4 h-4 text-indigo-500" /> Resumo</h3>
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setResumoMinimizado((prev) => !prev)}
                      className="h-8 px-2 text-gray-600"
                  >
                    {resumoMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    <span className="ml-1">{resumoMinimizado ? " " : " "}</span>
                  </Button>
                </div>
                {!resumoMinimizado && (
                <div className="space-y-2 text-sm">
                  <div className="space-y-1.5">
                    {resumeSecoes.length > 0 ? (
                        resumeSecoes.map((secao) => (
                            <div key={secao.nome} className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-2.5 py-2">
                              <div className="flex min-w-0 items-center gap-2">
                        <span className="inline-flex h-6 min-w-8 items-center justify-center rounded bg-indigo-100 px-2 text-xs font-semibold text-indigo-700">
                          {secao.quantidade}x
                        </span>
                                <span className="truncate text-gray-700">{secao.nome}</span>
                              </div>
                              <span className="text-right font-medium text-gray-700">{secao.valor}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-500">Nenhuma seção preenchida.</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {itensVendaComDescricao.length > 0 ? (
                        itensVendaComDescricao.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-2.5 py-2">
                              <div className="flex min-w-0 items-center gap-2">
                        <span className="inline-flex h-6 min-w-8 items-center justify-center rounded bg-indigo-100 px-2 text-xs font-semibold text-indigo-700">
                          {item.quantidade}x
                        </span>
                                <span className="truncate text-gray-700">{item.descricao}</span>
                              </div>
                              <span className="text-right font-medium text-gray-700">{moeda(calcItem(item))}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-500">Nenhum item de venda informado.</p>
                    )}
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-base text-gray-900">
                    <span>Total</span>
                    <span className="text-indigo-700">{moeda(totalResumo)}</span>
                  </div>
                </div>
                )}
              </Card>

              {/* Orçamento - Resumo */}
              <Card className="p-3 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Orçamento</h3>
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setOrcamentoResumoMinimizado((prev) => !prev)}
                      className="h-8 px-2 text-gray-600"
                  >
                    {orcamentoResumoMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    <span className="ml-1">{orcamentoResumoMinimizado ? " " : " "}</span>
                  </Button>
                </div>

                {!orcamentoResumoMinimizado && (
                    <div className="space-y-4">
                      {editando ? (
                        <ResumoOrcamentoInline orcamento={editando} />
                      ) : (
                        <p className="text-sm text-gray-600">Salve o orçamento primeiro para visualizar o resumo.</p>
                      )}
                    </div>
                )}
              </Card>

              {/* Roteiro */}
              <Card className="p-3 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /> Roteiro</h3>
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRoteiroMinimizado((prev) => !prev)}
                      className="h-8 px-2 text-gray-600"
                  >
                    {roteiroMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    <span className="ml-1">{roteiroMinimizado ? " " : " "}</span>
                  </Button>
                </div>

                {!roteiroMinimizado && (
                    <div className="space-y-4">
                      {editando ? (
                        <div className="w-full" style={{ height: "600px" }}>
                          <iframe
                            src={`/financeiro/orcamentos/roteiro/${editando.publicToken || editando.numero}`}
                            className="w-full h-full border-0 rounded-lg"
                            title="Roteiro do Orçamento"
                            onLoad={() => {
                              localStorage.setItem(`orc_${editando.numero}`, JSON.stringify(editando));
                            }}
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Salve o orçamento primeiro para visualizar o roteiro.</p>
                      )}
                    </div>
                )}
              </Card>

          {modalFinanceiroAberto && (
              <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/50" onClick={() => setModalFinanceiroAberto(false)} />
                <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Novo lançamento financeiro</h2>
                    <button
                        onClick={() => setModalFinanceiroAberto(false)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Fechar modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {erroLancamento && (
                      <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erroLancamento}</p>
                  )}

                  <div className="space-y-4">
                    <div>
                      <Label>Orçamento</Label>
                      <Input value={`${form.numero} - ${form.cliente}`} className="mt-1" disabled />
                    </div>

                    <div>
                      <Label>Descrição</Label>
                      <Input value={`Receita do orçamento #${form.numero} - ${form.cliente}`} className="mt-1" disabled />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Valor</Label>
                        <Input value={calcularTotalOrcamentoAtual().toFixed(2)} className="mt-1" disabled />
                      </div>
                      <div>
                        <Label htmlFor="data-lancamento-orc">Data</Label>
                        <Input
                            id="data-lancamento-orc"
                            type="date"
                            value={dataLancamento}
                            onChange={(e) => setDataLancamento(e.target.value)}
                            className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="quitado-orc">Quitado</Label>
                        <select
                            id="quitado-orc"
                            value={quitadoLancamento ? "sim" : "nao"}
                            onChange={(e) => {
                              const quitado = e.target.value === "sim";
                              setQuitadoLancamento(quitado);
                              if (!quitado) {
                                setFormaPagamentoLancamento("");
                                setParcelasLancamento("1");
                              }
                            }}
                            className="mt-1 flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <option value="nao">Não</option>
                          <option value="sim">Sim</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="forma-orc">Forma de pagamento</Label>
                        <select
                            id="forma-orc"
                            value={formaPagamentoLancamento}
                            onChange={(e) => setFormaPagamentoLancamento(e.target.value)}
                            className="mt-1 flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            disabled={!quitadoLancamento}
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
                        <Label htmlFor="parcelas-orc">Parcelas</Label>
                        <Input
                            id="parcelas-orc"
                            type="number"
                            min="1"
                            step="1"
                            value={parcelasLancamento}
                            onChange={(e) => setParcelasLancamento(e.target.value)}
                            className="mt-1"
                            disabled={!quitadoLancamento}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setModalFinanceiroAberto(false)}>Cancelar</Button>
                    <Button onClick={() => void salvarLancamentoVinculado()} disabled={salvandoLancamento}>
                      {salvandoLancamento ? "Salvando..." : "Salvar lançamento"}
                    </Button>
                  </div>
                </div>
              </div>
          )}

          {popupAprovadoAberto && (
              <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/50" onClick={() => setPopupAprovadoAberto(false)} />
                <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-900">Orçamento aprovado</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Perfeito. Este orçamento já foi quitado? Se sim, vamos abrir agora o cadastro do lançamento financeiro vinculado.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-end gap-2">
                    <Button variant="outline" onClick={confirmarAprovadoSemQuitacao}>
                      Ainda não foi quitado
                    </Button>
                    <Button onClick={confirmarAprovadoQuitado} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Sim, foi quitado
                    </Button>
                  </div>
                </div>
              </div>
          )}
        </div>
        </div>
    );
  }

  // ============ TELA LISTA ============
  return (
      <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orçamentos</h1>
            <p className="text-sm text-gray-500 mt-1">{lista.length} orçamentos cadastrados</p>
          </div>
          <Button onClick={abrirNovo} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4" /> Novo Orçamento
          </Button>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="p-3 sm:p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-indigo-600" /></div>
            <div><p className="text-xs text-gray-500">Volume Total</p><p className="text-xl font-bold text-gray-900">{moeda(totais.total)}</p></div>
          </Card>
          <Card className="p-3 sm:p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Check className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-xs text-gray-500">Aprovados</p><p className="text-xl font-bold text-gray-900">{moeda(totais.aprovados)}</p></div>
          </Card>
          <Card className="p-3 sm:p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Send className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-xs text-gray-500">Aguardando retorno</p><p className="text-xl font-bold text-gray-900">{totais.pendentes} orçamento{totais.pendentes !== 1 ? "s" : ""}</p></div>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-3 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Pesquisar por número, cliente, e-mail..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9 pr-9" />
              {busca && <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
            </div>
            <div className="flex flex-wrap gap-2">
              {(["Todos", ...allStatus] as const).map((s) => (
                  <button key={s} onClick={() => setFiltroStatus(s as StatusOrc | "Todos")} className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${filtroStatus === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}>{s}</button>
              ))}
            </div>
          </div>
        </Card>

        {erro && (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
        )}

        {carregando && (
            <p className="mb-4 text-sm text-gray-500">Carregando orçamentos...</p>
        )}

        {/* Lista de orçamentos */}
        <div className="space-y-3">
          {!carregando && filtrados.length === 0 && (
              <Card className="py-12 text-center text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Nenhum orçamento encontrado</p>
              </Card>
          )}
          {filtrados.map((orc) => {
            const total = calcTotalOrcamento(orc);
            const linhasDescricao = montarLinhasDescricao(orc);
            const totalDescricao = calcTotal(linhasDescricao);
            const cfg = statusConfig[orc.status];
            const expandido = expandidos.has(orc.id);
            const vencido = orc.dataValidade && new Date(orc.dataValidade) < new Date() && orc.status !== "Aprovado" && orc.status !== "Cancelado" && orc.status !== "Rejeitado";
            return (
                <Card key={orc.id} className="overflow-hidden">
                  {/* Linha principal */}
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-indigo-700">{orc.numero}</span>
                        <Badge className={`${cfg.bg} ${cfg.cor} hover:${cfg.bg}`}>{orc.status}</Badge>
                        {vencido && <span className="text-xs text-red-500 font-semibold">⚠ Vencido</span>}
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{orc.cliente}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="w-3 h-3" />Emissão: {fmtData(orc.dataCriacao)}</span>
                        {orc.dataValidade && <span className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="w-3 h-3" />Validade: {fmtData(orc.dataValidade)}</span>}
                        <span className="text-xs text-gray-400">{orc.itens.length} item{orc.itens.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg text-indigo-700">{moeda(total)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                      <button onClick={() => abrirResumo(orc)} title="Orçamento" className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"><FileText className="w-4 h-4" /></button>
                      <button onClick={() => abrirEdicao(orc)} title="Editar" className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button
                          onClick={() => gerarRoteiro(orc)}
                          disabled={orc.status !== "Aprovado"}
                          title={orc.status !== "Aprovado" ? "O orçamento precisa estar Aprovado" : "Roteiro"}
                          className="p-1.5 rounded text-green-600 hover:bg-green-50 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      ><MapPin className="w-4 h-4" /></button>
                      <button onClick={() => confirmarDuplicacao(orc)} title="Duplicar" className="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => toggleFavorito(orc.id)} title={favoritos.includes(orc.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"} className={`p-1.5 rounded transition-colors ${favoritos.includes(orc.id) ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}>
                        <Star className={`w-4 h-4 ${favoritos.includes(orc.id) ? 'fill-yellow-400' : ''}`} />
                      </button>
                      <button onClick={() => toggleExpandir(orc.id)} className="p-1.5 rounded text-gray-400 hover:bg-gray-100 transition-colors">
                        {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Itens expandidos */}
                  {expandido && (
                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Descrição</h4>
                        <table className="w-full text-xs">
                          <thead>
                          <tr className="text-gray-400 font-semibold">
                            <th className="text-left pb-2">Descrição</th>
                            <th className="text-center pb-2 w-12">Qtd</th>
                            <th className="text-center pb-2 w-10">Un</th>
                            <th className="text-right pb-2 w-24">Unit.</th>
                            <th className="text-right pb-2 w-16">Desc.</th>
                            <th className="text-right pb-2 w-24">Total</th>
                          </tr>
                          </thead>
                          <tbody>
                          {linhasDescricao.map((item) => (
                              <tr key={item.id} className="border-t border-gray-200">
                                <td className="py-1.5 text-gray-700">{item.descricao}</td>
                                <td className="py-1.5 text-center text-gray-500">{item.quantidade}</td>
                                <td className="py-1.5 text-center text-gray-400">{item.unidade}</td>
                                <td className="py-1.5 text-right text-gray-500">{moeda(item.valorUnitario)}</td>
                                <td className="py-1.5 text-right text-orange-500">{item.desconto > 0 ? `${item.desconto}%` : "—"}</td>
                                <td className="py-1.5 text-right font-semibold text-gray-800">{moeda(calcItem(item))}</td>
                              </tr>
                          ))}
                          <tr className="border-t-2 border-indigo-200">
                            <td colSpan={5} className="py-2 font-bold text-gray-700">Total</td>
                            <td className="py-2 text-right font-bold text-indigo-700">{moeda(totalDescricao)}</td>
                          </tr>
                          </tbody>
                        </table>

                      </div>
                  )}
                </Card>
            );
          })}
        </div>

        {orcamentoDuplicacaoPendente && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/50" onClick={cancelarDuplicacao} />
              <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900">Duplicar orçamento</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Tem certeza que deseja duplicar o orçamento <span className="font-semibold text-gray-800">{orcamentoDuplicacaoPendente.numero}</span>?
                </p>

                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={cancelarDuplicacao}>Cancelar</Button>
                  <Button onClick={() => void executarDuplicacaoConfirmada()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Sim, duplicar
                  </Button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}
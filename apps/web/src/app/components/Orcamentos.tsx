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
  buscarOrcamentoPorId,
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
  atualizarLancamentoFinanceiro,
  listarLancamentosFinanceiros,
  type LancamentoFinanceiro,
} from "../data/financeiroApi";
import { buscarOpcoesDestino } from "../data/placePhotoApi";
import { enviarMensagemIA } from "../data/aiChatApi";
import { criarEvento } from "../data/eventosApi";
import { prepararRoteiroSemAnexos, salvarRoteiroNoCache } from "../data/roteiroCache";

// ─── Utilitários de comissão (espelhados de Financeiro.tsx) ─────────────────

function parseNumeroInput(valor: string) {
  const valorNormalizado = valor.replace(",", ".").trim();
  if (!valorNormalizado) return null;
  const numero = Number(valorNormalizado);
  return Number.isFinite(numero) ? numero : null;
}

function formatarNumeroInput(valor: number, casasDecimais = 2) {
  return Number(valor.toFixed(casasDecimais)).toString();
}

function parseMoedaInput(valor: string): number | null {
  if (!valor) return null;
  const limpo = valor
    .replace(/R\$\s*/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  if (!limpo) return null;
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : null;
}

function formatarMoedaInput(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function aplicarMascaraMoeda(texto: string): string {
  const apenasDigitos = texto.replace(/\D/g, "");
  if (!apenasDigitos) return "";
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

  return { percentualComissao: percentualTexto, valorComissao: valorComissaoTexto };
}

// ────────────────────────────────────────────────────────────────────────────

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

const statusViagemConfig: Record<StatusViagem, { bg: string; cor: string }> = {
  "Não Iniciada": { bg: "bg-slate-100",  cor: "text-slate-600" },
  "Em Andamento": { bg: "bg-sky-100",    cor: "text-sky-700" },
  "Finalizada":   { bg: "bg-teal-100",   cor: "text-teal-700" },
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

const orcVazio = (): OrcamentoPayload => {
  const hoje = new Date().toISOString().split("T")[0];
  const validade = new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return {
    numero: "", cliente: "", email: "", destino: "", agenteViagem: "", status: "Rascunho",
    dataCriacao: hoje, dataValidade: validade, statusViagem: "Não Iniciada", itens: [],
  };
};

export default function Orcamentos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lista, setLista] = useState<Orcamento[]>([]);
  const [lancamentosFinanceiros, setLancamentosFinanceiros] = useState<LancamentoFinanceiro[]>([]);
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
  const [modalFinanceiroAberto, setModalFinanceiroAberto] = useState(false);
  const [salvandoLancamento, setSalvandoLancamento] = useState(false);
  const [erroLancamento, setErroLancamento] = useState<string | null>(null);
  const [quitadoLancamento, setQuitadoLancamento] = useState(true);
  const [formaPagamentoLancamento, setFormaPagamentoLancamento] = useState("");
  const [parcelasLancamento, setParcelasLancamento] = useState("1");
  const [dataLancamento, setDataLancamento] = useState(new Date().toISOString().slice(0, 10));
  const [percentualComissaoLancamento, setPercentualComissaoLancamento] = useState("");
  const [valorComissaoLancamento, setValorComissaoLancamento] = useState("");
  const [origemComissaoLancamento, setOrigemComissaoLancamento] = useState<OrigemComissao>(null);
  const [popupAprovadoAberto, setPopupAprovadoAberto] = useState(false);

  // Estados do modal de lançamento financeiro da tela de lista
  const [modalListaLancamentoAberto, setModalListaLancamentoAberto] = useState(false);
  const [orcamentoListaModal, setOrcamentoListaModal] = useState<Orcamento | null>(null);
  const [editandoIdLancamentoLista, setEditandoIdLancamentoLista] = useState<number | null>(null);
  const [tipoLancamentoLista, setTipoLancamentoLista] = useState<"receita" | "despesa">("receita");
  const [descricaoLancamentoLista, setDescricaoLancamentoLista] = useState("");
  const [valorLancamentoLista, setValorLancamentoLista] = useState("");
  const [dataLancamentoLista, setDataLancamentoLista] = useState("");
  const [percentualComissaoLista, setPercentualComissaoLista] = useState("");
  const [valorComissaoLista, setValorComissaoLista] = useState("");
  const [origemComissaoLista, setOrigemComissaoLista] = useState<OrigemComissao>(null);
  const [orcamentoPagoLista, setOrcamentoPagoLista] = useState(false);
  const [formaPagamentoLista, setFormaPagamentoLista] = useState("");
  const [parcelasLista, setParcelasLista] = useState("1");
  const [editandoOcultoLista, setEditandoOcultoLista] = useState(false);
  const [salvandoLancamentoLista, setSalvandoLancamentoLista] = useState(false);
  const [erroLancamentoLista, setErroLancamentoLista] = useState<string | null>(null);
  const [orcamentoDuplicacaoPendente, setOrcamentoDuplicacaoPendente] = useState<Orcamento | null>(null);
  const [dadosClienteMinimizados, setDadosClienteMinimizados] = useState(true);
  const [perfilViagemMinimizado, setPerfilViagemMinimizado] = useState(true);
  const [categoriasPerfilMinimizadas, setCategoriasPerfilMinimizadas] = useState<Record<string, boolean>>(() => ({ ...todasCategoriasMinimizadas }));
  const [perfilViagemSelecionado, setPerfilViagemSelecionado] = useState<string[]>([]);
  const [promptPerfilViagemIA, setPromptPerfilViagemIA] = useState("");
  const [passageiroSelecionado, setPassageiroSelecionado] = useState("");
  const [secoesOrcamentoMinimizadas, setSecoesOrcamentoMinimizadas] = useState(true);
  const [vendasMinimizadas, setVendasMinimizadas] = useState(true);

  const [resumoMinimizado, setResumoMinimizado] = useState(true);
  const [cardsResumoMinimizados, setCardsResumoMinimizados] = useState(false);
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
    const totalPacotes = pacotes.reduce((acc, item) => {
      const valorPacote = Number(item?.valor) || 0;
      const valorHospedagem = Number(item?.hospedagemValor) || 0;
      return acc + valorPacote + valorHospedagem;
    }, 0);
    const totalHospedagem = hospedagem.reduce((acc, item) => acc + (Number(item?.preco) || 0), 0);
    const totalTransporte = transporte.reduce((acc, item) => acc + (Number(item?.valor) || 0), 0);
    const totalRestaurante = restaurante.reduce((acc, item) => acc + (Number(item?.preco) || 0), 0);
    const totalExperiencias = experiencias.reduce((acc, item) => acc + (Number(item?.preco) || 0), 0);
    const totalSeguro = seguro.reduce((acc, item) => acc + (Number(item?.valor) || 0), 0);

    return totalVendas + totalPacotes + totalHospedagem + totalTransporte + totalRestaurante + totalExperiencias + totalSeguro;
  }

  function abrirCadastroLancamentoFinanceiro() {
    setErroLancamento(null);
    setQuitadoLancamento(true);
    setFormaPagamentoLancamento("");
    setParcelasLancamento("1");
    setDataLancamento(form.dataCriacao || new Date().toISOString().slice(0, 10));
    setPercentualComissaoLancamento("");
    setValorComissaoLancamento("");
    setOrigemComissaoLancamento(null);
    setModalFinanceiroAberto(true);
  }

  function abrirLancamentoDaLista(orc: Orcamento) {
    const lancamentoExistente = lancamentosFinanceiros.find(
      (l) => l.orcamentoId === orc.id
    ) ?? null;

    setErroLancamentoLista(null);
    setOrcamentoListaModal(orc);

    if (lancamentoExistente) {
      // Modo edição — pré-preenche com os dados do lançamento existente
      setEditandoIdLancamentoLista(lancamentoExistente.id);
      setTipoLancamentoLista(lancamentoExistente.tipo);
      setDescricaoLancamentoLista(lancamentoExistente.descricao);
      setValorLancamentoLista(formatarMoedaInput(lancamentoExistente.valor));
      setDataLancamentoLista(lancamentoExistente.data);
      setPercentualComissaoLista(
        lancamentoExistente.comissaoPercentual === null
          ? ""
          : formatarNumeroInput(lancamentoExistente.comissaoPercentual)
      );
      setValorComissaoLista(
        lancamentoExistente.comissaoValor === null
          ? ""
          : formatarMoedaInput(lancamentoExistente.comissaoValor)
      );
      setOrigemComissaoLista(
        lancamentoExistente.comissaoPercentual !== null
          ? "percentual"
          : lancamentoExistente.comissaoValor !== null
          ? "valor"
          : null
      );
      setOrcamentoPagoLista(lancamentoExistente.orcamentoPago);
      setFormaPagamentoLista(lancamentoExistente.formaPagamento || "");
      setParcelasLista(String(lancamentoExistente.parcelas ?? 1));
      setEditandoOcultoLista(lancamentoExistente.oculto);
    } else {
      // Modo criação — pré-preenche com dados do orçamento
      const totalOrcamento = calcTotalOrcamento(orc);
      setEditandoIdLancamentoLista(null);
      setTipoLancamentoLista("receita");
      setDescricaoLancamentoLista(`Receita do orçamento #${orc.numero} - ${orc.cliente}`);
      setValorLancamentoLista(formatarMoedaInput(totalOrcamento));
      setDataLancamentoLista(orc.dataCriacao || new Date().toISOString().slice(0, 10));
      setPercentualComissaoLista("");
      setValorComissaoLista("");
      setOrigemComissaoLista(null);
      setOrcamentoPagoLista(false);
      setFormaPagamentoLista("");
      setParcelasLista("1");
      setEditandoOcultoLista(false);
    }

    setModalListaLancamentoAberto(true);
  }

  async function salvarLancamentoListaModal() {
    if (!orcamentoListaModal) return;

    const valorNumerico = parseMoedaInput(valorLancamentoLista) ?? 0;
    const percentualComissaoNum = parseNumeroInput(percentualComissaoLista);
    const valorComissaoNum = parseMoedaInput(valorComissaoLista);
    const parcelasNum = Number(parcelasLista);
    const habilitarPagamento = orcamentoPagoLista;

    if (!descricaoLancamentoLista.trim()) {
      setErroLancamentoLista("Descrição é obrigatória.");
      return;
    }
    if (!valorNumerico || valorNumerico <= 0) {
      setErroLancamentoLista("Informe um valor maior que zero.");
      return;
    }
    if (!dataLancamentoLista) {
      setErroLancamentoLista("Data é obrigatória.");
      return;
    }
    if (habilitarPagamento && !formaPagamentoLista.trim()) {
      setErroLancamentoLista("Selecione a forma de pagamento.");
      return;
    }
    if (habilitarPagamento && (!Number.isInteger(parcelasNum) || parcelasNum <= 0)) {
      setErroLancamentoLista("Informe a quantidade de parcelas válida.");
      return;
    }

    setSalvandoLancamentoLista(true);
    setErroLancamentoLista(null);

    try {
      const payload = {
        tipo: tipoLancamentoLista,
        descricao: descricaoLancamentoLista.trim(),
        valor: Math.abs(valorNumerico),
        comissaoPercentual: percentualComissaoNum === null ? null : Math.abs(percentualComissaoNum),
        comissaoValor: valorComissaoNum === null ? null : Math.abs(valorComissaoNum),
        data: dataLancamentoLista,
        oculto: editandoIdLancamentoLista ? editandoOcultoLista : false,
        orcamentoPago: orcamentoPagoLista,
        formaPagamento: habilitarPagamento ? formaPagamentoLista.trim() : "",
        parcelas: habilitarPagamento ? parcelasNum : null,
        orcamentoId: orcamentoListaModal.id,
      };

      if (editandoIdLancamentoLista) {
        const atualizado = await atualizarLancamentoFinanceiro(editandoIdLancamentoLista, payload);
        setLancamentosFinanceiros((prev) =>
          prev.map((l) => (l.id === editandoIdLancamentoLista ? atualizado : l))
        );
      } else {
        const novo = await criarLancamentoFinanceiro(payload);
        setLancamentosFinanceiros((prev) => [novo, ...prev]);
      }

      setModalListaLancamentoAberto(false);
    } catch (error) {
      setErroLancamentoLista(error instanceof Error ? error.message : "Erro ao salvar lançamento financeiro.");
    } finally {
      setSalvandoLancamentoLista(false);
    }
  }

  function fecharModalListaLancamento() {
    setModalListaLancamentoAberto(false);
    setErroLancamentoLista(null);
  }

  function onChangePercentualComissaoLista(novoPercentual: string) {
    setOrigemComissaoLista("percentual");
    setPercentualComissaoLista(novoPercentual);
    const valorBase = parseMoedaInput(valorLancamentoLista) ?? 0;
    const valorBaseTexto = formatarMoedaInput(valorBase);
    const sincronizado = sincronizarComissaoComValor(valorBaseTexto, "percentual", novoPercentual, valorComissaoLista);
    setValorComissaoLista(sincronizado.valorComissao);
  }

  function onChangeValorComissaoLista(novoValorComissao: string) {
    const valorFormatado = aplicarMascaraMoeda(novoValorComissao);
    setOrigemComissaoLista("valor");
    setValorComissaoLista(valorFormatado);
    const valorBase = parseMoedaInput(valorLancamentoLista) ?? 0;
    const valorBaseTexto = formatarMoedaInput(valorBase);
    const sincronizado = sincronizarComissaoComValor(valorBaseTexto, "valor", percentualComissaoLista, valorFormatado);
    setPercentualComissaoLista(sincronizado.percentualComissao);
  }

  function onChangeValorLancamentoLista(novoValor: string) {
    setValorLancamentoLista(aplicarMascaraMoeda(novoValor));
  }

  function onChangePercentualComissaoLancamento(novoPercentual: string) {
    setOrigemComissaoLancamento("percentual");
    setPercentualComissaoLancamento(novoPercentual);
    const valorBase = formatarMoedaInput(calcularTotalOrcamentoAtual());
    const sincronizado = sincronizarComissaoComValor(valorBase, "percentual", novoPercentual, valorComissaoLancamento);
    setValorComissaoLancamento(sincronizado.valorComissao);
  }

  function onChangeValorComissaoLancamento(novoValorComissao: string) {
    const valorFormatado = aplicarMascaraMoeda(novoValorComissao);
    setOrigemComissaoLancamento("valor");
    setValorComissaoLancamento(valorFormatado);
    const valorBase = formatarMoedaInput(calcularTotalOrcamentoAtual());
    const sincronizado = sincronizarComissaoComValor(valorBase, "valor", percentualComissaoLancamento, valorFormatado);
    setPercentualComissaoLancamento(sincronizado.percentualComissao);
  }

  async function onChangeStatusOrcamento(novoStatus: StatusOrc) {
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
      const percentualComissaoNum = parseNumeroInput(percentualComissaoLancamento);
      const valorComissaoNum = parseMoedaInput(valorComissaoLancamento);

      await criarLancamentoFinanceiro({
        tipo: "receita",
        descricao: `Receita do orçamento #${form.numero} - ${form.cliente}`,
        valor: Math.abs(valorTotal),
        comissaoPercentual: percentualComissaoNum ?? null,
        comissaoValor: valorComissaoNum ?? null,
        data: dataLancamento,
        oculto: false,
        orcamentoPago: quitadoLancamento,
        formaPagamento: quitadoLancamento ? formaPagamentoLancamento.trim() : "",
        parcelas: quitadoLancamento ? parcelas : null,
        orcamentoId: editando.id,
      });

      setModalFinanceiroAberto(false);
    } catch (error) {
      setErroLancamento(error instanceof Error ? error.message : "Erro ao salvar lançamento financeiro.");
    } finally {
      setSalvandoLancamento(false);
    }
  }

  async function carregarOrcamentos() {
    setErro(null);
    try {
      const [listaApi, lancamentos] = await Promise.all([
        listarOrcamentos(),
        listarLancamentosFinanceiros(),
      ]);
      setLista(listaApi);
      setLancamentosFinanceiros(lancamentos);
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
          setClientesAtivos(clientes.filter((cliente) => cliente.status === "Ativo" && !!(cliente.nomeCompleto || cliente.nome)));
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

  // Handle state params from ResumoOrcamentos and sessionStorage
  useEffect(() => {
    if (tela === "form") return; // Já está editando, não re-abre
    const state = location.state as any;
    const sessionStorageId = sessionStorage.getItem('editOrcamentoId');
    
    if (state?.editId) {
      const orc = lista.find(o => o.id === state.editId);
      if (orc) {
        void abrirEdicao(orc);
        navigate(location.pathname, { replace: true });
      }
    } else if (sessionStorageId) {
      const editId = parseInt(sessionStorageId, 10);
      const orc = lista.find(o => o.id === editId);
      if (orc) {
        void abrirEdicao(orc);
        sessionStorage.removeItem('editOrcamentoId');
      }
    }
  }, [location.state, lista, location.pathname, navigate, tela]);

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
    qtdTotal: lista.length,
    aprovados: lista.filter((o) => o.status === "Aprovado").reduce((a, o) => a + calcTotalOrcamento(o), 0),
    qtdAprovados: lista.filter((o) => o.status === "Aprovado").length,
    pendentes: lista.filter((o) => o.status === "Enviado").length,
    rascunhos: lista.filter((o) => o.status === "Rascunho").reduce((a, o) => a + calcTotalOrcamento(o), 0),
    qtdRascunhos: lista.filter((o) => o.status === "Rascunho").length,
    enviados: lista.filter((o) => o.status === "Enviado").reduce((a, o) => a + calcTotalOrcamento(o), 0),
    qtdEnviados: lista.filter((o) => o.status === "Enviado").length,
    rejeitados: lista.filter((o) => o.status === "Rejeitado").reduce((a, o) => a + calcTotalOrcamento(o), 0),
    qtdRejeitados: lista.filter((o) => o.status === "Rejeitado").length,
    cancelados: lista.filter((o) => o.status === "Cancelado").reduce((a, o) => a + calcTotalOrcamento(o), 0),
    qtdCancelados: lista.filter((o) => o.status === "Cancelado").length,
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
    setResumoMinimizado(true);
    setOrcamentoResumoMinimizado(true);
    setRoteiroMinimizado(true);
    setHouveAlteracoes(false);
    formularioCarregadoRef.current = false;
    setPassageiroSelecionado("");
    setSection("Pacotes");
    setTela("form");
  }

  async function abrirEdicao(o: Orcamento) {
    setErro(null);

    // Busca o orçamento completo do servidor (com roteiro e prompts de IA)
    // para não precisar trafegar esses campos pesados na listagem.
    let completo: Orcamento = o;
    try {
      completo = await buscarOrcamentoPorId(o.id);
    } catch {
      // Se falhar, usa o objeto da lista (campos de IA ficarão vazios)
    }

    setEditando(completo);
    setForm(completo);

    // Carrega os dados das seções para os estados correspondentes
    setPacotes(
        (completo.pacotes || []).map((p: any) => ({ ...p, documentos: p.documentos || [] })),
    );
    setVoos(
        // @ts-ignore
        completo.voos || [],
    );
    setHospedagem(completo.hospedagem || []);
    setRoteiro(completo.roteiro || "");
    setPromptRoteiroIA(typeof completo.promptRoteiroIA === "string" ? completo.promptRoteiroIA : "");
    setDayByDay(completo.dayByDay || []);
    setTransporte(completo.transporte || []);
    setRestaurante(completo.restaurante || []);
    setExperiencias(completo.experiencias || []);
    setSeguro(completo.seguro || []);
    setDadosClienteMinimizados(true);
    setPerfilViagemSelecionado(Array.isArray(completo.perfilViagem) ? completo.perfilViagem.filter((item) => typeof item === "string") : []);
    setPromptPerfilViagemIA(typeof completo.promptPerfilViagemIA === "string" ? completo.promptPerfilViagemIA : "");
    setPerfilViagemMinimizado(true);
    setCategoriasPerfilMinimizadas({});
    setSecoesOrcamentoMinimizadas(true);
    setVendasMinimizadas(true);
    setResumoMinimizado(true);
    setOrcamentoResumoMinimizado(true);
    setRoteiroMinimizado(true);
    setHouveAlteracoes(false);
    formularioCarregadoRef.current = false;
    setPassageiroSelecionado("");
    setSection("Pacotes");
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

  async function criarEventosDeOrcamento(
    orcamento: OrcamentoPayload,
    pacotesData: any[],
    voosData: any[]
  ) {
    const cliente = orcamento.cliente || "";
    const agente = orcamento.agenteViagem || "";
    const destino = orcamento.destino || "";
    const numero = orcamento.numero || "";

    const eventos: Array<{ data: string; titulo: string; descricao: string }> = [];

    // Datas dos voos individuais
    for (const voo of voosData) {
      const data = voo.data;
      if (!data || typeof data !== "string") continue;

      const trecho = voo.tipoTrecho ? ` (${voo.tipoTrecho})` : "";
      const rota = voo.origem && voo.destino ? ` ${voo.origem} → ${voo.destino}` : destino ? ` → ${destino}` : "";
      const cia = voo.companhia ? ` - ${voo.companhia}` : "";

      eventos.push({
        data,
        titulo: `✈️ Voo${trecho}${rota}${cia}`,
        descricao: `Orçamento #${numero} - Cliente: ${cliente}${voo.numero ? ` - Voo: ${voo.numero}` : ""}`,
      });
    }

    // Datas dos pacotes (dataIda, dataVolta, hospedagemCheckin, hospedagemCheckout)
    for (const pacote of pacotesData) {
      const rotaPacote = pacote.origem && pacote.destino ? ` ${pacote.origem} → ${pacote.destino}` : destino ? ` ${destino}` : "";
      const operador = pacote.operador ? ` (${pacote.operador})` : "";

      if (pacote.dataIda && typeof pacote.dataIda === "string") {
        eventos.push({
          data: pacote.dataIda,
          titulo: `✈️ Voo Ida${rotaPacote}${operador}`,
          descricao: `Orçamento #${numero} - Cliente: ${cliente}`,
        });
      }

      if (pacote.dataVolta && typeof pacote.dataVolta === "string") {
        eventos.push({
          data: pacote.dataVolta,
          titulo: `✈️ Voo Volta${rotaPacote}${operador}`,
          descricao: `Orçamento #${numero} - Cliente: ${cliente}`,
        });
      }

      if (pacote.hospedagemCheckin && typeof pacote.hospedagemCheckin === "string") {
        const hotel = pacote.hospedagemNome ? ` - ${pacote.hospedagemNome}` : "";
        eventos.push({
          data: pacote.hospedagemCheckin,
          titulo: `🏨 Check-in${hotel}${operador}`,
          descricao: `Orçamento #${numero} - Cliente: ${cliente}`,
        });
      }

      if (pacote.hospedagemCheckout && typeof pacote.hospedagemCheckout === "string") {
        const hotel = pacote.hospedagemNome ? ` - ${pacote.hospedagemNome}` : "";
        eventos.push({
          data: pacote.hospedagemCheckout,
          titulo: `🏨 Check-out${hotel}${operador}`,
          descricao: `Orçamento #${numero} - Cliente: ${cliente}`,
        });
      }
    }

    // Cria todos os eventos em paralelo, ignorando falhas individuais
    await Promise.allSettled(
      eventos.map((ev) =>
        criarEvento({
          titulo: ev.titulo,
          descricao: ev.descricao,
          data: ev.data,
          hora: "00:00",
          tipo: "Viagem",
          cliente,
          agente,
        })
      )
    );
  }

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

      // Cria automaticamente eventos na agenda para cada data de voo/checkin/checkout
      await criarEventosDeOrcamento(
        { ...orcComSecoes, numero: criado.numero },
        pacotes,
        voos
      );

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

  // Remove dados pesados (base64 de PDFs/imagens e URLs de localhost) antes de salvar
  // no localStorage para evitar QuotaExceededError (limite ~5MB por origem)
  function sanitizarParaStorage(obj: any): any {
    if (Array.isArray(obj)) return obj.map(sanitizarParaStorage);
    if (obj && typeof obj === "object") {
      const resultado: Record<string, any> = {};
      for (const [chave, valor] of Object.entries(obj)) {
        if (chave === "arquivo" && typeof valor === "string" && valor.startsWith("data:")) {
          resultado[chave] = "";
        } else if (
          (chave === "hospedagemFoto" || chave === "foto") &&
          typeof valor === "string" &&
          valor.includes("localhost")
        ) {
          resultado[chave] = "";
        } else {
          resultado[chave] = sanitizarParaStorage(valor);
        }
      }
      return resultado;
    }
    return obj;
  }

  async function gerarRoteiro(orc: Orcamento | null = null) {
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

    const roteiroPath = `/financeiro/orcamentos/roteiro/${orcComSecoes.numero}`;
    const novaAba = window.open("", "_blank");
    const orcPersistivel = prepararRoteiroSemAnexos(
      sanitizarParaStorage(orcComSecoes) as Orcamento,
    );

    await salvarRoteiroNoCache(orcComSecoes as Orcamento);

    // Store in localStorage to access from new tab
    try {
      const orcJson = JSON.stringify(orcPersistivel);
      localStorage.setItem(`orc_${orcComSecoes.numero}`, orcJson);
      // Se houver publicToken, grava também com ele para que o fallback funcione
      if (orcComSecoes.publicToken) {
        localStorage.setItem(`orc_${orcComSecoes.publicToken}`, orcJson);
      }
    } catch {
      // QuotaExceededError: localStorage cheio — segue sem cache local,
      // a página do roteiro vai carregar direto da API
    }

    if (novaAba) {
      novaAba.location.href = roteiroPath;
    } else {
      navigate(roteiroPath);
    }
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

    // Armazena no localStorage para acessar na nova aba (sem base64 para não estourar quota)
    try {
      localStorage.setItem(`orc_${orcComSecoes.numero}`, JSON.stringify(sanitizarParaStorage(orcComSecoes)));
    } catch {
      // QuotaExceededError: segue sem cache local
    }
    const novaAbaResumo = window.open(`/financeiro/orcamentos/resumo/${orcComSecoes.publicToken || orcComSecoes.numero}`, "_blank");
    if (!novaAbaResumo) {
      navigate(`/financeiro/orcamentos/resumo/${orcComSecoes.publicToken || orcComSecoes.numero}`);
    }
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
                <div className="mb-4 flex items-center justify-between gap-3 cursor-pointer select-none" onClick={() => setDadosClienteMinimizados((prev) => !prev)}>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><User className="w-4 h-4 text-indigo-500" /> Dados do Cliente</h3>
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setDadosClienteMinimizados((prev) => !prev); }}
                      className="h-8 px-2 text-gray-600"
                  >
                    {dadosClienteMinimizados ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    <span className="ml-1">{dadosClienteMinimizados ? " " : " "}</span>
                  </Button>
                </div>
                {!dadosClienteMinimizados && (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                      <div className="flex flex-col md:col-span-1">
                        <Label>Número</Label>
                        <Input value={form.numero} readOnly disabled className="mt-1 font-mono bg-gray-100 cursor-not-allowed" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative mt-3">
                      <div className="flex flex-col">
                        <Label htmlFor="cliente">Cliente *</Label>
                        <select
                            id="cliente"
                            value={form.cliente}
                            onChange={(e) => {
                              const nome = e.target.value;
                              const cliente = clientesAtivos.find((item) => (item.nomeCompleto || item.nome) === nome);
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
                            ...clientesAtivos.map((c) => ({ nome: c.nomeCompleto || c.nome, tipo: "Cliente" as const })),
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
                            ...clientesAtivos.map((c) => ({ nome: c.nomeCompleto || c.nome, tipo: "Cliente" as const })),
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div className="flex flex-col">
                        <Label htmlFor="dataCriacao">Data de emissão</Label>
                        <Input id="dataCriacao" type="date" value={form.dataCriacao} onChange={(e) => {
                          const emissao = e.target.value;
                          const validade = emissao ? new Date(new Date(emissao).getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : form.dataValidade;
                          setForm({ ...form, dataCriacao: emissao, dataValidade: validade });
                        }} className="mt-1" />
                      </div>
                      <div className="flex flex-col">
                        <Label htmlFor="dataValidade">Válido até</Label>
                        <Input id="dataValidade" type="date" value={form.dataValidade} onChange={(e) => setForm({ ...form, dataValidade: e.target.value })} className="mt-1" />
                      </div>
                      <div className="flex flex-col">
                        <Label>Status do Orçamento</Label>
                        <select
                            value={form.status}
                            onChange={(e) => void onChangeStatusOrcamento(e.target.value as StatusOrc)}
                            className="mt-1 flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          {allStatus.map((s) => (
                              <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <Label>Status da Viagem</Label>
                        <select
                            value={form.statusViagem || ""}
                            onChange={(e) => setForm({ ...form, statusViagem: e.target.value as StatusViagem | undefined })}
                            className="mt-1 flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <option value="">Selecione...</option>
                          <option value="Não Iniciada">Não Iniciada</option>
                          <option value="Em Andamento">Em Andamento</option>
                          <option value="Finalizada">Finalizada</option>
                        </select>
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

              {/* Perfil da viagem */}
              <Card className="p-3 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3 cursor-pointer select-none" onClick={() => { setPerfilViagemMinimizado((prev) => { if (prev) { setCategoriasPerfilMinimizadas({ ...todasCategoriasMinimizadas }); } return !prev; }); }}>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /> Perfil da Viagem</h3>
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setPerfilViagemMinimizado((prev) => {
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
                <div className="mb-4 flex items-center justify-between gap-3 cursor-pointer select-none" onClick={() => setSecoesOrcamentoMinimizadas((prev) => !prev)}>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Seções do Orçamento</h3>
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setSecoesOrcamentoMinimizadas((prev) => !prev); }}
                      className="h-8 px-2 text-gray-600 cursor-pointer"
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
                                  style={{ cursor: 'pointer' }}
                                  className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs sm:text-sm cursor-pointer ${section === s ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
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
                <div className="mb-3 flex items-center justify-between gap-3 cursor-pointer select-none" onClick={() => setResumoMinimizado((prev) => !prev)}>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><DollarSign className="w-4 h-4 text-indigo-500" /> Resumo</h3>
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setResumoMinimizado((prev) => !prev); }}
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
                <div className="mb-4 flex items-center justify-between gap-3 cursor-pointer select-none" onClick={() => setOrcamentoResumoMinimizado((prev) => !prev)}>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Orçamento</h3>
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setOrcamentoResumoMinimizado((prev) => !prev); }}
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
                <div className="mb-4 flex items-center justify-between gap-3 cursor-pointer select-none" onClick={() => setRoteiroMinimizado((prev) => !prev)}>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /> Roteiro</h3>
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setRoteiroMinimizado((prev) => !prev); }}
                      className="h-8 px-2 text-gray-600 cursor-pointer"
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
      <>
      <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orçamentos</h1>
            <p className="text-sm text-gray-500 mt-1">{lista.length} orçamentos cadastrados</p>
          </div>
          <Button onClick={abrirNovo} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Orçamento</span><span className="sm:hidden">Novo</span>
          </Button>
        </div>

        {/* Cards de resumo */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-end mb-1">
            <button
              onClick={() => setCardsResumoMinimizados((v) => !v)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
              title={cardsResumoMinimizados ? "Maximizar" : "Minimizar"}
            >
              {cardsResumoMinimizados ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
          {!cardsResumoMinimizados && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
              <Card onClick={() => setFiltroStatus("Todos")} className={`p-3 sm:p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md ${filtroStatus === "Todos" ? "ring-2 ring-indigo-500" : ""}`}>
                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0"><DollarSign className="w-4 h-4 text-indigo-600" /></div>
                <div><p className="text-xs text-gray-500">Total</p><p className="text-base font-bold text-gray-900">{moeda(totais.total)}</p><p className="text-xs text-gray-400">{totais.qtdTotal} orçamento{totais.qtdTotal !== 1 ? "s" : ""}</p></div>
              </Card>
              <Card onClick={() => setFiltroStatus(filtroStatus === "Rascunho" ? "Todos" : "Rascunho")} className={`p-3 sm:p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md ${filtroStatus === "Rascunho" ? "ring-2 ring-gray-400" : ""}`}>
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-gray-500" /></div>
                <div><p className="text-xs text-gray-500">Rascunho</p><p className="text-base font-bold text-gray-900">{moeda(totais.rascunhos)}</p><p className="text-xs text-gray-400">{totais.qtdRascunhos} orçamento{totais.qtdRascunhos !== 1 ? "s" : ""}</p></div>
              </Card>
              <Card onClick={() => setFiltroStatus(filtroStatus === "Enviado" ? "Todos" : "Enviado")} className={`p-3 sm:p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md ${filtroStatus === "Enviado" ? "ring-2 ring-blue-500" : ""}`}>
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0"><Send className="w-4 h-4 text-blue-600" /></div>
                <div><p className="text-xs text-gray-500">Enviado</p><p className="text-base font-bold text-gray-900">{moeda(totais.enviados)}</p><p className="text-xs text-gray-400">{totais.qtdEnviados} orçamento{totais.qtdEnviados !== 1 ? "s" : ""}</p></div>
              </Card>
              <Card onClick={() => setFiltroStatus(filtroStatus === "Aprovado" ? "Todos" : "Aprovado")} className={`p-3 sm:p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md ${filtroStatus === "Aprovado" ? "ring-2 ring-green-500" : ""}`}>
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0"><Check className="w-4 h-4 text-green-600" /></div>
                <div><p className="text-xs text-gray-500">Aprovado</p><p className="text-base font-bold text-gray-900">{moeda(totais.aprovados)}</p><p className="text-xs text-gray-400">{totais.qtdAprovados} orçamento{totais.qtdAprovados !== 1 ? "s" : ""}</p></div>
              </Card>
              <Card onClick={() => setFiltroStatus(filtroStatus === "Rejeitado" ? "Todos" : "Rejeitado")} className={`p-3 sm:p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md ${filtroStatus === "Rejeitado" ? "ring-2 ring-red-500" : ""}`}>
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0"><X className="w-4 h-4 text-red-500" /></div>
                <div><p className="text-xs text-gray-500">Rejeitado</p><p className="text-base font-bold text-gray-900">{moeda(totais.rejeitados)}</p><p className="text-xs text-gray-400">{totais.qtdRejeitados} orçamento{totais.qtdRejeitados !== 1 ? "s" : ""}</p></div>
              </Card>
              <Card onClick={() => setFiltroStatus(filtroStatus === "Cancelado" ? "Todos" : "Cancelado")} className={`p-3 sm:p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md ${filtroStatus === "Cancelado" ? "ring-2 ring-orange-500" : ""}`}>
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0"><X className="w-4 h-4 text-orange-500" /></div>
                <div><p className="text-xs text-gray-500">Cancelado</p><p className="text-base font-bold text-gray-900">{moeda(totais.cancelados)}</p><p className="text-xs text-gray-400">{totais.qtdCancelados} orçamento{totais.qtdCancelados !== 1 ? "s" : ""}</p></div>
              </Card>
            </div>
          )}
        </div>

        {/* Filtros */}
        <Card className="p-3 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Pesquisar por número, cliente, e-mail..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9 pr-9" />
              {busca && <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
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
            const cfg = statusConfig[orc.status] || defaultStatusConfig;
            const expandido = expandidos.has(orc.id);
            const vencido = orc.dataValidade && new Date(orc.dataValidade) < new Date() && orc.status !== "Aprovado" && orc.status !== "Cancelado" && orc.status !== "Rejeitado";
            const temLancamento = lancamentosFinanceiros.some((l) => l.orcamentoId === orc.id);
            return (
                <Card key={orc.id} className="overflow-hidden">
                  {/* Linha principal */}
                  <div className="p-3 sm:p-4">
                    {/* Topo: ícone + info + valor */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-4 h-4 text-indigo-600" />
                      </div>

                      {/* Bloco central de info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm sm:text-base font-semibold text-gray-900 leading-tight truncate">{orc.cliente}</p>
                          <p className="font-bold text-base sm:text-lg text-indigo-700 flex-shrink-0 leading-tight">{moeda(total)}</p>
                        </div>

                        {/* Número + destino */}
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="font-mono text-xs font-bold text-indigo-600">{orc.numero}</span>
                          {orc.destino && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" />{orc.destino}</span>}
                        </div>

                        {/* Badges de status */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <Badge className={`${cfg.bg} ${cfg.cor} hover:${cfg.bg} text-xs`}>{orc.status}</Badge>
                          {orc.statusViagem && (() => { const cfgV = statusViagemConfig[orc.statusViagem] || statusViagemConfig; return <Badge className={`${cfgV.bg} ${cfgV.cor} hover:${cfgV.bg} text-xs`}>{orc.statusViagem}</Badge>; })()}
                          {vencido && <span className="text-xs text-red-500 font-semibold">⚠ Vencido</span>}
                        </div>

                        {/* Datas — linha abaixo em mobile */}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="w-3 h-3" />{fmtData(orc.dataCriacao)}</span>
                          {orc.dataValidade && <span className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="w-3 h-3" />Val: {fmtData(orc.dataValidade)}</span>}
                          <span className="text-xs text-gray-400">{orc.itens.length} item{orc.itens.length !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>

                    {/* Barra de ações — separada embaixo, scroll horizontal em mobile */}
                    <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
                        <button
                          onClick={() => abrirLancamentoDaLista(orc)}
                          title={temLancamento ? "Editar lançamento financeiro" : "Criar lançamento financeiro"}
                          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${temLancamento ? "text-emerald-600 hover:bg-emerald-50" : "text-orange-400 hover:bg-orange-50"}`}
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button onClick={() => abrirResumo(orc)} title="Orçamento" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"><FileText className="w-4 h-4" /></button>
                        <button onClick={() => void abrirEdicao(orc)} title="Editar" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => gerarRoteiro(orc)} title="Roteiro" className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors flex-shrink-0"><MapPin className="w-4 h-4" /></button>
                        <button onClick={() => confirmarDuplicacao(orc)} title="Duplicar" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"><Copy className="w-4 h-4" /></button>
                        <button
                          onClick={() => toggleFavorito(orc.id)}
                          title={favoritos.includes(orc.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${favoritos.includes(orc.id) ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                        >
                          <Star className={`w-4 h-4 ${favoritos.includes(orc.id) ? 'fill-yellow-400' : ''}`} />
                        </button>
                      </div>
                      <button
                        onClick={() => toggleExpandir(orc.id)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0 ml-1"
                        title={expandido ? "Recolher" : "Ver detalhes"}
                      >
                        {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Itens expandidos — cards em mobile, tabela em desktop */}
                  {expandido && (
                    <div className="border-t border-gray-100 bg-gray-50 px-3 sm:px-4 py-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Descrição</h4>

                      {/* Tabela — apenas desktop */}
                      <div className="hidden sm:block overflow-x-auto">
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

                      {/* Cards — apenas mobile */}
                      <div className="sm:hidden space-y-2">
                        {linhasDescricao.map((item) => (
                          <div key={item.id} className="rounded-lg bg-white border border-gray-200 px-3 py-2">
                            <p className="text-xs font-medium text-gray-800 leading-snug">{item.descricao}</p>
                            <div className="flex items-center justify-between mt-1.5 gap-2 flex-wrap">
                              <span className="text-xs text-gray-400">{item.quantidade} {item.unidade} × {moeda(item.valorUnitario)}{item.desconto > 0 ? ` (−${item.desconto}%)` : ""}</span>
                              <span className="text-xs font-semibold text-gray-800">{moeda(calcItem(item))}</span>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-1 border-t-2 border-indigo-200 mt-1">
                          <span className="text-xs font-bold text-gray-700">Total</span>
                          <span className="text-sm font-bold text-indigo-700">{moeda(totalDescricao)}</span>
                        </div>
                      </div>
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

        {/* Modal de lançamento financeiro — tela lista */}
        {modalListaLancamentoAberto && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/50 touch-none" onClick={fecharModalListaLancamento} />
            <div className="relative z-10 w-full sm:max-w-3xl rounded-t-2xl sm:rounded-lg bg-white shadow-xl flex flex-col max-h-[92dvh] sm:max-h-[90vh] pb-[env(safe-area-inset-bottom)]">

              {/* Drag handle — mobile only */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b shrink-0">
                <h2 className="text-base font-semibold text-gray-900">
                  {editandoIdLancamentoLista ? "Editar lançamento financeiro" : "Novo lançamento financeiro"}
                </h2>
                <button onClick={fecharModalListaLancamento} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Fechar modal">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Corpo */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                <div>
                  <Label htmlFor="lista-tipo-lancamento">Tipo</Label>
                  <select
                    id="lista-tipo-lancamento"
                    value={tipoLancamentoLista}
                    onChange={(e) => setTipoLancamentoLista(e.target.value as "receita" | "despesa")}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-base sm:text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="lista-descricao-lancamento">Descrição</Label>
                  <Input
                    id="lista-descricao-lancamento"
                    value={descricaoLancamentoLista}
                    onChange={(e) => setDescricaoLancamentoLista(e.target.value)}
                    placeholder="Ex.: Pagamento de cliente"
                    className="mt-1 h-10 text-base sm:text-sm"
                  />
                </div>

                {orcamentoListaModal && (
                  <div>
                    <Label>Orçamento</Label>
                    <Input
                      value={`${orcamentoListaModal.numero} - ${orcamentoListaModal.cliente}`}
                      disabled
                      className="mt-1 h-10 text-base sm:text-sm bg-gray-50"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="lista-valor-lancamento">Valor</Label>
                    <Input
                      id="lista-valor-lancamento"
                      type="text"
                      inputMode="decimal"
                      value={valorLancamentoLista}
                      onChange={(e) => onChangeValorLancamentoLista(e.target.value)}
                      placeholder="0,00"
                      className="mt-1 h-10 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lista-data-lancamento">Data</Label>
                    <Input
                      id="lista-data-lancamento"
                      type="date"
                      value={dataLancamentoLista}
                      onChange={(e) => setDataLancamentoLista(e.target.value)}
                      className="mt-1 h-10 text-base sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="lista-percentual-comissao">% Comissão</Label>
                    <Input
                      id="lista-percentual-comissao"
                      list="lista-percentuais-comissao"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={percentualComissaoLista}
                      onChange={(e) => onChangePercentualComissaoLista(e.target.value)}
                      placeholder="0,00"
                      className="mt-1 h-10 text-base sm:text-sm"
                    />
                    <datalist id="lista-percentuais-comissao">
                      <option value="5" /><option value="10" /><option value="15" /><option value="20" /><option value="25" /><option value="30" />
                    </datalist>
                  </div>
                  <div>
                    <Label htmlFor="lista-valor-comissao">Valor Comissão</Label>
                    <Input
                      id="lista-valor-comissao"
                      type="text"
                      inputMode="decimal"
                      value={valorComissaoLista}
                      onChange={(e) => onChangeValorComissaoLista(e.target.value)}
                      placeholder="0,00"
                      className="mt-1 h-10 text-base sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="lista-orcamento-pago">Quitado</Label>
                    <select
                      id="lista-orcamento-pago"
                      value={orcamentoPagoLista ? "sim" : "nao"}
                      onChange={(e) => {
                        const pago = e.target.value === "sim";
                        setOrcamentoPagoLista(pago);
                        if (!pago) { setFormaPagamentoLista(""); setParcelasLista("1"); }
                      }}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-base sm:text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <option value="nao">Não</option>
                      <option value="sim">Sim</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="lista-forma-pagamento">Forma de pagamento</Label>
                    <select
                      id="lista-forma-pagamento"
                      value={formaPagamentoLista}
                      onChange={(e) => setFormaPagamentoLista(e.target.value)}
                      disabled={!orcamentoPagoLista}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-base sm:text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
                    <Label htmlFor="lista-parcelas">Parcelado em</Label>
                    <Input
                      id="lista-parcelas"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      value={parcelasLista}
                      onChange={(e) => setParcelasLista(e.target.value)}
                      placeholder="Ex.: 1"
                      disabled={!orcamentoPagoLista}
                      className="mt-1 h-10 text-base sm:text-sm"
                    />
                  </div>
                </div>

                {erroLancamentoLista && (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {erroLancamentoLista}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t flex gap-2 shrink-0">
                <Button variant="outline" onClick={fecharModalListaLancamento} className="flex-1 sm:flex-none h-11 sm:h-9 text-base sm:text-sm">
                  Cancelar
                </Button>
                <Button
                  onClick={() => void salvarLancamentoListaModal()}
                  disabled={salvandoLancamentoLista}
                  className="flex-1 sm:flex-none h-11 sm:h-9 text-base sm:text-sm"
                >
                  {salvandoLancamentoLista ? "Salvando..." : editandoIdLancamentoLista ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      </>
  );
}

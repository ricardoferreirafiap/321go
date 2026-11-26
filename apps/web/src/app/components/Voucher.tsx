import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Search, Plus, Edit2, X, Check, FileText, ChevronDown, ChevronUp,
  User, Calendar, MapPin, Sparkles, Star
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
import { type Voo } from "./VoosForm";
import { listarClientes, type Cliente } from "../data/clientesApi";
import { listarFuncionarios, type Funcionario } from "../data/funcionariosApi";
import { listarFornecedores, type Fornecedor } from "../data/fornecedoresApi";
import {
  atualizarOrcamento,
  buscarOrcamentoPorId,
  criarOrcamento,
  listarOrcamentos,
  type ItemOrc,
  type Orcamento,
  type OrcamentoPayload,
  type StatusOrc,
  type StatusViagem,
} from "../data/orcamentosApi";
import {
  criarLancamentoFinanceiro,
  atualizarLancamentoFinanceiro,
  listarLancamentosFinanceiros,
  type LancamentoFinanceiro,
} from "../data/financeiroApi";
import { enviarMensagemIA } from "../data/aiChatApi";
import { criarEvento } from "../data/eventosApi";
import { prepararRoteiroSemAnexos, salvarRoteiroNoCache } from "../data/roteiroCache";
import { formatarRespostaRoteiroParaCampo } from "../data/roteiroFormatter";

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

const STATUS_VIAGEM_NAO_INICIADA: StatusViagem = "Não Iniciada";
const STATUS_VIAGEM_EM_ANDAMENTO: StatusViagem = "Em Andamento";
const STATUS_VIAGEM_FINALIZADA: StatusViagem = "Finalizada";

const statusViagemConfig: Record<StatusViagem, { bg: string; cor: string }> = {
  [STATUS_VIAGEM_NAO_INICIADA]: { bg: "bg-slate-100",  cor: "text-slate-600" },
  [STATUS_VIAGEM_EM_ANDAMENTO]: { bg: "bg-sky-100",    cor: "text-sky-700" },
  [STATUS_VIAGEM_FINALIZADA]: { bg: "bg-teal-100",   cor: "text-teal-700" },
};

const secoesOrcamento = ["Pacotes", "Roteiro", "Day by Day", "Transporte", "Restaurante", "Experiências"] as const;
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
      "Compras",
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

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(d: string) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function extrairDataIso(valor: unknown) {
  if (typeof valor !== "string") return "";
  const texto = valor.trim();
  if (!texto) return "";

  const matchIso = texto.match(/^(\d{4}-\d{2}-\d{2})/);
  if (matchIso) return matchIso[1];

  const matchBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (matchBr) return `${matchBr[3]}-${matchBr[2]}-${matchBr[1]}`;

  return "";
}

function obterDestinoResumoOrcamento(orc: Orcamento) {
  const voos = Array.isArray(orc.voos) ? orc.voos : [];
  const hospedagens = Array.isArray(orc.hospedagem) ? orc.hospedagem : [];
  const pacotes = Array.isArray(orc.pacotes) ? orc.pacotes : [];

  const destinoVoo = voos.find((voo: any) => typeof voo?.destino === "string" && voo.destino.trim())?.destino
    || pacotes.find((pacote: any) => typeof pacote?.destinoIda === "string" && pacote.destinoIda.trim())?.destinoIda
    || pacotes.find((pacote: any) => typeof pacote?.destinoVolta === "string" && pacote.destinoVolta.trim())?.destinoVolta
    || "";
  if (destinoVoo) return String(destinoVoo).trim();

  const destinoHospedagem = hospedagens.find((item: any) => typeof item?.destino === "string" && item.destino.trim())?.destino
    || hospedagens.find((item: any) => typeof item?.local === "string" && item.local.trim())?.local
    || hospedagens.find((item: any) => typeof item?.cidade === "string" && item.cidade.trim())?.cidade
    || pacotes.find((pacote: any) => typeof pacote?.hospedagemDestino === "string" && pacote.hospedagemDestino.trim())?.hospedagemDestino
    || pacotes.find((pacote: any) => typeof pacote?.hospedagemLocal === "string" && pacote.hospedagemLocal.trim())?.hospedagemLocal
    || pacotes.find((pacote: any) => typeof pacote?.hospedagemNome === "string" && pacote.hospedagemNome.trim())?.hospedagemNome
    || "";
  if (destinoHospedagem) return String(destinoHospedagem).trim();

  return String(orc.destino || "").trim();
}

function obterPeriodoResumoOrcamento(orc: Orcamento): { ida: string; volta: string } | null {
  const voos = Array.isArray(orc.voos) ? orc.voos : [];
  const pacotes = Array.isArray(orc.pacotes) ? orc.pacotes : [];
  const hospedagens = Array.isArray(orc.hospedagem) ? orc.hospedagem : [];

  const vooIda = extrairDataIso(
    voos.find((voo: any) => String(voo?.tipoTrecho || "").toUpperCase() === "IDA")?.data
    || voos.find((voo: any) => voo?.data)?.data
    || pacotes.find((pacote: any) => pacote?.dataIda)?.dataIda
  );
  const vooVolta = extrairDataIso(
    voos.find((voo: any) => String(voo?.tipoTrecho || "").toUpperCase() === "VOLTA")?.data
    || pacotes.find((pacote: any) => pacote?.dataVolta)?.dataVolta
  );

  const todasDatasVoo = [
    ...voos.map((voo: any) => extrairDataIso(voo?.data)),
    ...pacotes.flatMap((pacote: any) => [extrairDataIso(pacote?.dataIda), extrairDataIso(pacote?.dataVolta)]),
  ].filter(Boolean).sort();

  const idaVooFinal = vooIda || todasDatasVoo[0] || "";
  const voltaVooFinal = vooVolta || (todasDatasVoo.length > 1 ? todasDatasVoo[todasDatasVoo.length - 1] : "");
  if (idaVooFinal || voltaVooFinal) {
    return { ida: idaVooFinal, volta: voltaVooFinal };
  }

  const checkinHospedagem = extrairDataIso(
    hospedagens.find((item: any) => item?.checkin)?.checkin
    || pacotes.find((pacote: any) => pacote?.hospedagemCheckin)?.hospedagemCheckin
  );
  const checkoutHospedagem = extrairDataIso(
    hospedagens.find((item: any) => item?.checkout)?.checkout
    || pacotes.find((pacote: any) => pacote?.hospedagemCheckout)?.hospedagemCheckout
  );

  if (checkinHospedagem || checkoutHospedagem) {
    return { ida: checkinHospedagem, volta: checkoutHospedagem };
  }

  return null;
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
  ];

  const linhasSecoes = secoes.flatMap((secao) => {
    if (!Array.isArray(secao.dados) || secao.dados.length === 0) return [];

    return secao.dados.map((item) => {
      const quantidade = extrairNumeroPositivo(item?.qtdPessoas, 0)
          || extrairNumeroPositivo(item?.quantidade, 0)
          || extrairNumeroPositivo(item?.noites, 0)
          || 1;

      const valorUnitario = secao.titulo === "Pacotes"
          ? extrairNumero(item?.valor, 0) + extrairNumero(item?.hospedagemValor, 0)
          : extrairNumeroPositivo(item?.valor, 0)
              || extrairNumeroPositivo(item?.preco, 0)
              || extrairNumeroPositivo(item?.valorUnitario, 0)
              || 0;

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

type DiaAtividadeRoteiro = {
  id: number;
  hora: string;
  descricao: string;
  tipo: string;
};

type DiaRoteiro = {
  id: number;
  data: string;
  titulo: string;
  atividades: DiaAtividadeRoteiro[];
};

function extrairDayByDayDoRoteiro(texto: string): DiaRoteiro[] {
  const linhas = String(texto || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((linha) => String(linha || "").trim());

  const dias: DiaRoteiro[] = [];
  let diaAtual: DiaRoteiro | null = null;
  const baseId = Date.now();

  for (const linhaOriginal of linhas) {
    if (!linhaOriginal) continue;

    const semBullet = linhaOriginal.replace(/^[-*•]\s*/, "").trim();
    if (!semBullet) continue;

    if (/^(destaques\s+imperd[ií]veis|dicas\s+pr[aá]ticas)$/i.test(semBullet)) {
      break;
    }

    const semIndice = semBullet.replace(/^\d+\s*[).:-]\s*/, "").trim();
    const matchDia = semIndice.match(/^(dia\s*0*\d+)(?:\s*[-:–—]\s*(.+))?$/i);
    if (matchDia) {
      const cabecalhoDia = matchDia[1].replace(/\s+/g, " ").replace(/^dia/i, "Dia");
      const complemento = String(matchDia[2] || "").trim();
      const titulo = complemento ? `${cabecalhoDia} - ${complemento}` : cabecalhoDia;

      diaAtual = {
        id: baseId + dias.length,
        data: "",
        titulo,
        atividades: [],
      };
      dias.push(diaAtual);
      continue;
    }

    if (!diaAtual) {
      continue;
    }

    const descricao = semBullet.replace(/^\d+[).:-]\s*/, "").trim();
    if (!descricao) {
      continue;
    }

    diaAtual.atividades.push({
      id: baseId + dias.length * 100 + diaAtual.atividades.length,
      hora: "",
      descricao,
      tipo: "",
    });
  }

  return dias;
}

const orcVazio = (): OrcamentoPayload => {
  const hoje = new Date().toISOString().split("T")[0];
  const validade = new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return {
    numero: "", cliente: "", email: "", destino: "", agenteViagem: "", status: "Rascunho",
    dataCriacao: hoje, dataValidade: validade, statusViagem: STATUS_VIAGEM_NAO_INICIADA, itens: [],
  };
};

export default function Roteiros() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lista, setLista] = useState<Orcamento[]>([]);
  const [, setLancamentosFinanceiros] = useState<LancamentoFinanceiro[]>([]);
  const [tela, setTela] = useState<Tela>("lista");
  const [editando, setEditando] = useState<Orcamento | null>(null);
  const [form, setForm] = useState<OrcamentoPayload>(orcVazio());
  const [busca, setBusca] = useState("");
  const filtroStatus: StatusOrc | "Todos" = "Todos";
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
  const [funcionariosAtivos, setFuncionariosAtivos] = useState<Funcionario[]>([]);
  const [clientesAtivos, setClientesAtivos] = useState<Cliente[]>([]);
  const [fornecedoresAtivos, setFornecedoresAtivos] = useState<Fornecedor[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<Funcionario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [, setQuitadoLancamento] = useState(true);
  const [, setFormaPagamentoLancamento] = useState("");
  const [, setParcelasLancamento] = useState("1");
  const [, setDataLancamento] = useState(new Date().toISOString().slice(0, 10));
  const [, setPercentualComissaoLancamento] = useState("");
  const [, setValorComissaoLancamento] = useState("");
  const [popupAprovadoAberto, setPopupAprovadoAberto] = useState(false);
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false);

  // Estados do modal de lançamento financeiro da tela de lista
  const [modalListaLancamentoAberto, setModalListaLancamentoAberto] = useState(false);
  const [orcamentoListaModal] = useState<Orcamento | null>(null);
  const [editandoIdLancamentoLista] = useState<number | null>(null);
  const [tipoLancamentoLista, setTipoLancamentoLista] = useState<"receita" | "despesa">("receita");
  const [descricaoLancamentoLista, setDescricaoLancamentoLista] = useState("");
  const [valorLancamentoLista, setValorLancamentoLista] = useState("");
  const [dataLancamentoLista, setDataLancamentoLista] = useState("");
  const [percentualComissaoLista, setPercentualComissaoLista] = useState("");
  const [valorComissaoLista, setValorComissaoLista] = useState("");
  const [, setOrigemComissaoLista] = useState<OrigemComissao>(null);
  const [orcamentoPagoLista, setOrcamentoPagoLista] = useState(false);
  const [formaPagamentoLista, setFormaPagamentoLista] = useState("");
  const [parcelasLista, setParcelasLista] = useState("1");
  const [editandoOcultoLista] = useState(false);
  const [salvandoLancamentoLista, setSalvandoLancamentoLista] = useState(false);
  const [erroLancamentoLista, setErroLancamentoLista] = useState<string | null>(null);
  const [dadosClienteMinimizados, setDadosClienteMinimizados] = useState(false);
  const [perfilViagemMinimizado, setPerfilViagemMinimizado] = useState(true);
  const [categoriasPerfilMinimizadas, setCategoriasPerfilMinimizadas] = useState<Record<string, boolean>>(() => ({ ...todasCategoriasMinimizadas }));
  const [perfilViagemSelecionado, setPerfilViagemSelecionado] = useState<string[]>([]);
  const [promptPerfilViagemIA, setPromptPerfilViagemIA] = useState("");
  const [passageiroSelecionado, setPassageiroSelecionado] = useState("");
  const [secoesOrcamentoMinimizadas, setSecoesOrcamentoMinimizadas] = useState(false);
  const [, setVendasMinimizadas] = useState(true);

  const [, setResumoMinimizado] = useState(true);
  const [cardsResumoMinimizados, setCardsResumoMinimizados] = useState(false);
  const [, setOrcamentoResumoMinimizado] = useState(true);
  const [roteiroMinimizado, setRoteiroMinimizado] = useState(true);
  const [houveAlteracoes, setHouveAlteracoes] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("authFuncionario");
      if (raw) {
        setUsuarioLogado(JSON.parse(raw) as Funcionario);
      }
    } catch {
      setUsuarioLogado(null);
    }
  }, []);
  const formularioCarregadoRef = useRef(false);
  const [provedorRoteiroIA, setProvedorRoteiroIA] = useState<"automatico" | "gemini" | "groq" | "openai" | "wonderful">("wonderful");
  const [iaRoteiroExibida, setIaRoteiroExibida] = useState("Wonderful");

  const nomesProvedorIA: Record<typeof provedorRoteiroIA, string> = {
    automatico: "Automático",
    gemini: "Gemini",
    groq: "Groq",
    openai: "OpenAI",
    wonderful: "Wonderful",
  };
  
  function obterDestinoPrincipalOrcamento(orcBase?: Partial<Orcamento>, preferirEstadoFormulario = false) {
    const hospedagemFonte = hospedagem.length > 0 ? hospedagem : Array.isArray(orcBase?.hospedagem) ? orcBase.hospedagem : [];
    const transporteFonte = transporte.length > 0 ? transporte : Array.isArray(orcBase?.transporte) ? orcBase.transporte : [];
    const voosFonte = voos.length > 0 ? voos : Array.isArray(orcBase?.voos) ? orcBase.voos : [];
    const pacotesFonte = pacotes.length > 0 ? pacotes : Array.isArray(orcBase?.pacotes) ? orcBase.pacotes : [];
    const hospedagemFinal = preferirEstadoFormulario ? hospedagem : hospedagemFonte;
    const transporteFinal = preferirEstadoFormulario ? transporte : transporteFonte;
    const voosFinal = preferirEstadoFormulario ? voos : voosFonte;
    const pacotesFinal = preferirEstadoFormulario ? pacotes : pacotesFonte;

    const destinoVoo =
      voosFinal.find((item) => typeof item?.destino === "string" && item.destino.trim())?.destino
      || pacotesFinal.find((item) => typeof item?.destinoIda === "string" && item.destinoIda.trim())?.destinoIda
      || pacotesFinal.find((item) => typeof item?.destino === "string" && item.destino.trim())?.destino
      || pacotesFinal.find((item) => typeof item?.destinoVolta === "string" && item.destinoVolta.trim())?.destinoVolta
      || "";
    if (destinoVoo) return String(destinoVoo).trim();

    const destinoExplcito = String(orcBase?.destino || form.destino || "").trim();
    if (destinoExplcito) return destinoExplcito;

    const destinoHospedagem =
        hospedagemFinal.find((item) => typeof item?.destino === "string" && item.destino.trim())?.destino
        || hospedagemFinal.find((item) => typeof item?.local === "string" && item.local.trim())?.local
        || hospedagemFinal.find((item) => typeof item?.cidade === "string" && item.cidade.trim())?.cidade
        || pacotesFinal.find((item) => typeof item?.hospedagemDestino === "string" && item.hospedagemDestino.trim())?.hospedagemDestino
        || pacotesFinal.find((item) => typeof item?.hospedagemLocal === "string" && item.hospedagemLocal.trim())?.hospedagemLocal
        || pacotesFinal.find((item) => typeof item?.hospedagemNome === "string" && item.hospedagemNome.trim())?.hospedagemNome
        || "";

    if (destinoHospedagem) return String(destinoHospedagem).trim();

    const destinoTransporte = transporteFinal.find((item) => typeof item?.destino === "string" && item.destino.trim())?.destino || "";
    if (destinoTransporte) return String(destinoTransporte).trim();

    return "";
  }

  function abrirCadastroLancamentoFinanceiro() {
    setQuitadoLancamento(true);
    setFormaPagamentoLancamento("");
    setParcelasLancamento("1");
    setDataLancamento(form.dataCriacao || new Date().toISOString().slice(0, 10));
    setPercentualComissaoLancamento("");
    setValorComissaoLancamento("");
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
        const [clientes, funcionarios, fornecedores] = await Promise.all([listarClientes(), listarFuncionarios(), listarFornecedores()]);

        if (mounted) {
          setClientesAtivos(clientes.filter((cliente) => cliente.status === "Ativo" && !!(cliente.nomeCompleto || cliente.nome)));
          setFuncionariosAtivos(funcionarios.filter((funcionario) => funcionario.status === "Ativo"));
          setFornecedoresAtivos(fornecedores.filter((fornecedor) => fornecedor.status === "Ativo"));
        }
      } catch {
        if (mounted) {
          setClientesAtivos([]);
          setFuncionariosAtivos([]);
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
  }, [form, pacotes, voos, hospedagem, roteiro, dayByDay, transporte, restaurante, experiencias, perfilViagemSelecionado, tela]);

  const filtrados = lista.filter((o) => {
    const q = busca.toLowerCase();
    const match = o.numero.toLowerCase().includes(q) || o.cliente.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
    return match && (filtroStatus === "Todos" || o.status === filtroStatus);
  });

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
    setDadosClienteMinimizados(false);
    setPerfilViagemSelecionado([]);
    setPromptPerfilViagemIA("");
    setPerfilViagemMinimizado(true);
    setCategoriasPerfilMinimizadas(todasCategoriasMinimizadas);
    setSecoesOrcamentoMinimizadas(false);
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
    const dayByDayExistente = Array.isArray(completo.dayByDay) ? completo.dayByDay : [];
    if (dayByDayExistente.length > 0) {
      setDayByDay(dayByDayExistente);
    } else {
      setDayByDay(extrairDayByDayDoRoteiro(completo.roteiro || ""));
    }
    setTransporte(completo.transporte || []);
    setRestaurante(completo.restaurante || []);
    setExperiencias(completo.experiencias || []);
    setDadosClienteMinimizados(false);
    setPerfilViagemSelecionado(Array.isArray(completo.perfilViagem) ? completo.perfilViagem.filter((item) => typeof item === "string") : []);
    setPromptPerfilViagemIA(typeof completo.promptPerfilViagemIA === "string" ? completo.promptPerfilViagemIA : "");
    setPerfilViagemMinimizado(true);
    setCategoriasPerfilMinimizadas({});
    setSecoesOrcamentoMinimizadas(false);
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

  async function salvar(sairAposSalvar = true, pacotesSobrescritos?: OrcamentoPayload["pacotes"]) {
    if (!form.cliente.trim()) {
      setErro("Informe o cliente antes de salvar o voucher.");
      return null;
    }
    setSalvando(true);
    setErro(null);

    const pacotesParaSalvar = pacotesSobrescritos && pacotesSobrescritos.length > 0
      ? pacotesSobrescritos
      : pacotes;

    // O backend (ValidationPipe com forbidNonWhitelisted) rejeita campos extras como "id" no body.
    const { id: _ignoredId, ...formSemId } = form as Orcamento & { id?: number };

    // Montar dados do orçamento com seções
    const orcComSecoes = {
      ...formSemId,
      destino: obterDestinoPrincipalOrcamento(undefined, true),
      pacotes: pacotesParaSalvar.length > 0 ? pacotesParaSalvar : undefined,
      voos: voos.length > 0 ? voos : undefined,
      hospedagem: hospedagem.length > 0 ? hospedagem : undefined,
      roteiro: roteiro.trim() ? roteiro : undefined,
      promptRoteiroIA: promptRoteiroIA.trim(),
      dayByDay: dayByDay.length > 0 ? dayByDay : undefined,
      transporte: transporte.length > 0 ? transporte : undefined,
      restaurante: restaurante.length > 0 ? restaurante : undefined,
      experiencias: experiencias.length > 0 ? experiencias : undefined,
      perfilViagem: perfilViagemSelecionado,
      promptPerfilViagemIA: promptPerfilViagemIA.trim(),
    };

    try {
      if (editando) {
        const atualizado = await atualizarOrcamento(editando.id, orcComSecoes);
        setEditando(atualizado);
        setLista((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)));
        void carregarOrcamentos();
        setHouveAlteracoes(false);
        if (sairAposSalvar) voltar();
        return editando.id;
      }

      const criado = await criarOrcamento(orcComSecoes);

      // Eventos são disparados em segundo plano para não bloquear o fluxo de salvar.
      void criarEventosDeOrcamento(
        { ...orcComSecoes, numero: criado.numero },
        pacotesParaSalvar,
        voos
      ).catch(() => undefined);

      setLista((prev) => [criado, ...prev.filter((item) => item.id !== criado.id)]);
      void carregarOrcamentos();
      // Ao criar sem sair, o formulário passa a editar o registro recém-criado.
      if (!sairAposSalvar) {
        setEditando(criado);
      }
      setHouveAlteracoes(false);
      if (sairAposSalvar) voltar();
      return criado.id;
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar orçamento.");
      return null;
    } finally {
      setSalvando(false);
    }
  }

  async function persistirExclusaoRestaurante(restaurantesAtualizados: any[]) {
    if (!editando) {
      return;
    }

    try {
      const atualizado = await atualizarOrcamento(editando.id, {
        restaurante: restaurantesAtualizados,
      });
      setEditando(atualizado);
      setLista((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Erro ao excluir restaurante no servidor.");
    }
  }

  async function salvarPacotesDaSecao(pacotesAtualizados: OrcamentoPayload["pacotes"]) {
    const idSalvo = await salvar(false, pacotesAtualizados);
    if (!idSalvo) {
      throw new Error("Não foi possível salvar o voucher no servidor. Verifique os campos obrigatórios.");
    }
  }

  function abrirModalSalvar() {
    setModalSalvarAberto(true);
  }

  function fecharModalSalvar() {
    setModalSalvarAberto(false);
  }

  async function handleSalvarSemSair() {
    const idSalvo = await salvar(false);
    if (idSalvo) {
      fecharModalSalvar();
    }
  }

  async function handleSalvarESair() {
    const idSalvo = await salvar(true);
    if (idSalvo) {
      fecharModalSalvar();
    }
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

  // --- Geração de Roteiro com IA (Simulação) ---
  async function gerarRoteiroComIA() {
    setGerandoRoteiro(true);

    let orcamentoFonte: Partial<Orcamento> = {
      ...editando,
      ...form,
      pacotes,
      voos,
      hospedagem,
      transporte,
      restaurante,
      experiencias,
      perfilViagem: perfilViagemSelecionado,
    };

    if (editando?.id) {
      try {
        const completo = await buscarOrcamentoPorId(editando.id);
        orcamentoFonte = {
          ...orcamentoFonte,
          ...completo,
          pacotes: Array.isArray(completo.pacotes) ? completo.pacotes : pacotes,
          voos: Array.isArray(completo.voos) ? completo.voos : voos,
          hospedagem: Array.isArray(completo.hospedagem) ? completo.hospedagem : hospedagem,
          transporte: Array.isArray(completo.transporte) ? completo.transporte : transporte,
          restaurante: Array.isArray(completo.restaurante) ? completo.restaurante : restaurante,
          experiencias: Array.isArray(completo.experiencias) ? completo.experiencias : experiencias,
          perfilViagem: Array.isArray(completo.perfilViagem) ? completo.perfilViagem : perfilViagemSelecionado,
        };

        setPacotes(Array.isArray(orcamentoFonte.pacotes) ? orcamentoFonte.pacotes : []);
        setVoos(Array.isArray(orcamentoFonte.voos) ? orcamentoFonte.voos as Voo[] : []);
        setHospedagem(Array.isArray(orcamentoFonte.hospedagem) ? orcamentoFonte.hospedagem : []);
        setTransporte(Array.isArray(orcamentoFonte.transporte) ? orcamentoFonte.transporte : []);
        setRestaurante(Array.isArray(orcamentoFonte.restaurante) ? orcamentoFonte.restaurante : []);
        setExperiencias(Array.isArray(orcamentoFonte.experiencias) ? orcamentoFonte.experiencias : []);
        setPerfilViagemSelecionado(
          Array.isArray(orcamentoFonte.perfilViagem)
            ? orcamentoFonte.perfilViagem.filter((item): item is string => typeof item === "string")
            : [],
        );
      } catch {
        // Se a atualização falhar, usa os dados já carregados no formulário.
      }
    }

    const textoLimpo = (value: unknown) => String(value ?? "").trim();
    const resumirTexto = (value: unknown, limite = 180) => {
      const base = textoLimpo(value).replace(/\s+/g, " ");
      if (!base) return "";
      return base.length > limite ? `${base.slice(0, limite).trim()}...` : base;
    };
    const ehPromptGeradoAutomaticamente = (value: string) => {
      if (!value) return false;
      return [
        "Crie uma sugestão de roteiro de viagem para",
        "Contexto obrigatório para usar na sugestão",
        "Formato obrigatório da resposta",
        "INSTRUÇÕES CRÍTICAS",
        "Pacotes (resumo):",
        "Restaurantes (resumo):",
        "Experiências (resumo):",
      ].some((trecho) => value.includes(trecho));
    };
    const montarSecao = (titulo: string, linhas: string[]) => {
      const preenchidas = linhas.map((linha) => textoLimpo(linha)).filter(Boolean);
      if (preenchidas.length === 0) return "";
      return `${titulo}\n${preenchidas.join("\n")}`;
    };

    const voosFonte = (Array.isArray(orcamentoFonte.voos) ? orcamentoFonte.voos : []) as Voo[];
    const pacotesFonte = Array.isArray(orcamentoFonte.pacotes) ? orcamentoFonte.pacotes : [];
    const hospedagemFonte = Array.isArray(orcamentoFonte.hospedagem) ? orcamentoFonte.hospedagem : [];
    const transporteFonte = Array.isArray(orcamentoFonte.transporte) ? orcamentoFonte.transporte : [];
    const restaurantesFonte = Array.isArray(orcamentoFonte.restaurante) ? orcamentoFonte.restaurante : [];
    const experienciasFonte = Array.isArray(orcamentoFonte.experiencias) ? orcamentoFonte.experiencias : [];
    const perfilFonte = Array.isArray(orcamentoFonte.perfilViagem)
      ? orcamentoFonte.perfilViagem.filter((item): item is string => typeof item === "string")
      : [];

    const destinoPrincipal =
      voosFonte.find((item) => textoLimpo(item?.destino))?.destino
      || pacotesFonte.find((item) => textoLimpo(item?.destinoIda))?.destinoIda
      || pacotesFonte.find((item) => textoLimpo(item?.destino))?.destino
      || hospedagemFonte.find((item) => textoLimpo(item?.destino))?.destino
      || transporteFonte.find((item) => textoLimpo(item?.destino))?.destino
      || textoLimpo(orcamentoFonte.destino)
      || textoLimpo(form.destino);

    const voosResumo = voosFonte
      .map((voo, index) => {
        const origem = textoLimpo(voo?.origem);
        const destino = textoLimpo(voo?.destino);
        const data = textoLimpo(voo?.data);
        const partes: string[] = [];

        if (origem || destino) {
          partes.push(`Trajeto: ${[origem, destino].filter(Boolean).join(" -> ")}`);
        }
        if (data) {
          partes.push(`Data: ${fmtData(data)}`);
        }
        if (partes.length === 0) return "";
        return `${index + 1}) ${partes.join(" | ")}`;
      })
      .filter(Boolean);

    const destinosDosVoos = voosFonte
      .map((voo) => textoLimpo(voo?.destino))
      .filter(Boolean);

    const destinosDosPacotes = Array.from(
      new Set(
        pacotesFonte
          .map((pacote: any) => textoLimpo(pacote?.destinoIda || pacote?.destino))
          .filter(Boolean),
      ),
    );

    const hospedagemResumo = pacotesFonte
      .map((item: any, index: number) => {
        const partes: string[] = [];
        if (textoLimpo(item?.hospedagemNome)) partes.push(`Hotel: ${item.hospedagemNome}`);
        if (textoLimpo(item?.hospedagemEndereco)) partes.push(`Endereço: ${item.hospedagemEndereco}`);
        if (textoLimpo(item?.hospedagemCheckin)) partes.push(`Check-in: ${fmtData(item.hospedagemCheckin)}`);
        if (textoLimpo(item?.hospedagemCheckout)) partes.push(`Check-out: ${fmtData(item.hospedagemCheckout)}`);
        if (partes.length === 0) return "";
        return `${index + 1}) ${partes.join(" | ")}`;
      })
      .filter(Boolean);

    const pacotesVooResumo = pacotesFonte
      .map((pacote: any, index: number) => {
        const partes: string[] = [];
        if (textoLimpo(pacote?.operador)) partes.push(`Operador: ${pacote.operador}`);
        if (textoLimpo(pacote?.ciaAerea)) partes.push(`Cia aérea: ${pacote.ciaAerea}`);
        if (textoLimpo(pacote?.reserva)) partes.push(`Reserva: ${pacote.reserva}`);

        const origemIda = textoLimpo(pacote?.origemIda || pacote?.origem);
        const destinoIda = textoLimpo(pacote?.destinoIda || pacote?.destino);
        if (origemIda || destinoIda) {
          const idaPartes = [`Ida: ${[origemIda, destinoIda].filter(Boolean).join(" -> ")}`];
          if (textoLimpo(pacote?.dataIda)) idaPartes.push(`Data: ${fmtData(pacote.dataIda)}`);
          if (textoLimpo(pacote?.duracaoIda)) idaPartes.push(`Duração: ${pacote.duracaoIda}`);
          partes.push(idaPartes.join(" | "));
        }

        const origemVolta = textoLimpo(pacote?.origemVolta);
        const destinoVolta = textoLimpo(pacote?.destinoVolta);
        if (origemVolta || destinoVolta) {
          const voltaPartes = [`Volta: ${[origemVolta, destinoVolta].filter(Boolean).join(" -> ")}`];
          if (textoLimpo(pacote?.dataVolta)) voltaPartes.push(`Data: ${fmtData(pacote.dataVolta)}`);
          if (textoLimpo(pacote?.duracaoVolta)) voltaPartes.push(`Duração: ${pacote.duracaoVolta}`);
          partes.push(voltaPartes.join(" | "));
        }

        if (textoLimpo(pacote?.passageiros)) partes.push(`Passageiros: ${pacote.passageiros}`);
        if (textoLimpo(pacote?.politicaAlteracoesCancelamentos)) {
          partes.push(`Política: ${resumirTexto(pacote.politicaAlteracoesCancelamentos)}`);
        }

        if (partes.length === 0) return "";
        return `${index + 1}) ${partes.join(" | ")}`;
      })
      .filter(Boolean);

    const pacotesHospedagemResumo = pacotesFonte
      .map((pacote: any, index: number) => {
        const partes: string[] = [];
        if (textoLimpo(pacote?.hospedagemNome)) partes.push(`Hotel: ${pacote.hospedagemNome}`);
        if (textoLimpo(pacote?.hospedagemEndereco)) partes.push(`Endereço: ${pacote.hospedagemEndereco}`);
        if (textoLimpo(pacote?.hospedagemCheckin)) partes.push(`Check-in: ${fmtData(pacote.hospedagemCheckin)}`);
        if (textoLimpo(pacote?.hospedagemCheckout)) partes.push(`Check-out: ${fmtData(pacote.hospedagemCheckout)}`);
        if (textoLimpo(pacote?.hospedagemNoites)) partes.push(`Noites: ${pacote.hospedagemNoites}`);
        if (textoLimpo(pacote?.hospedagemTipoQuarto)) partes.push(`Quarto: ${pacote.hospedagemTipoQuarto}`);
        if (textoLimpo(pacote?.hospedagemRegime)) partes.push(`Regime: ${pacote.hospedagemRegime}`);
        if (textoLimpo(pacote?.hospedagemComodidades)) partes.push(`Comodidades: ${resumirTexto(pacote.hospedagemComodidades, 120)}`);
        if (textoLimpo(pacote?.hospedagemPoliticasCondicoesInformacoesEspeciais)) {
          partes.push(`Políticas: ${resumirTexto(pacote.hospedagemPoliticasCondicoesInformacoesEspeciais)}`);
        }

        if (partes.length === 0) return "";
        return `${index + 1}) ${partes.join(" | ")}`;
      })
      .filter(Boolean);

    const pacotesTrasladoResumo = pacotesFonte
      .map((pacote: any, index: number) => {
        const partes: string[] = [];
        if (textoLimpo(pacote?.trasladoTipo)) partes.push(`Tipo: ${pacote.trasladoTipo}`);
        const localPartida = textoLimpo(pacote?.trasladoLocalPartida);
        const localChegada = textoLimpo(pacote?.trasladoLocalChegada);
        if (localPartida || localChegada) {
          partes.push(`Trajeto: ${[localPartida, localChegada].filter(Boolean).join(" -> ")}`);
        }
        const dataTraslado = textoLimpo(pacote?.trasladoData);
        const horarioTraslado = textoLimpo(pacote?.trasladoHorario);
        if (dataTraslado || horarioTraslado) {
          partes.push(`Data/Horário: ${[dataTraslado ? fmtData(dataTraslado) : "", horarioTraslado].filter(Boolean).join(" ")}`);
        }
        if (textoLimpo(pacote?.trasladoVeiculoEmpresa)) partes.push(`Veículo/Empresa: ${pacote.trasladoVeiculoEmpresa}`);
        if (textoLimpo(pacote?.trasladoObservacoes)) partes.push(`Observações: ${resumirTexto(pacote.trasladoObservacoes, 120)}`);

        if (partes.length === 0) return "";
        return `${index + 1}) ${partes.join(" | ")}`;
      })
      .filter(Boolean);

    const pacotesIngressoResumo = pacotesFonte
      .map((pacote: any, index: number) => {
        const partes: string[] = [];
        if (textoLimpo(pacote?.ingressoNomeAtracao)) partes.push(`Atração/Ingresso: ${pacote.ingressoNomeAtracao}`);
        const dataIngresso = textoLimpo(pacote?.ingressoData);
        const horarioIngresso = textoLimpo(pacote?.ingressoHorario);
        if (dataIngresso || horarioIngresso) {
          partes.push(`Data/Horário: ${[dataIngresso ? fmtData(dataIngresso) : "", horarioIngresso].filter(Boolean).join(" ")}`);
        }
        if (textoLimpo(pacote?.ingressoQuantidade)) partes.push(`Quantidade: ${pacote.ingressoQuantidade}`);
        if (textoLimpo(pacote?.ingressoObservacoes)) partes.push(`Observações: ${resumirTexto(pacote.ingressoObservacoes, 120)}`);

        if (partes.length === 0) return "";
        return `${index + 1}) ${partes.join(" | ")}`;
      })
      .filter(Boolean);

    const vouchersPacotesResumo = pacotesFonte
      .map((pacote: any, index: number) => {
        const docs = Array.isArray(pacote?.documentos) ? pacote.documentos : [];
        const nomesDocs = docs
          .map((doc: any) => textoLimpo(doc?.nome || doc?.filename || doc?.fileName))
          .filter(Boolean);
        if (nomesDocs.length === 0) return "";
        return `${index + 1}) ${nomesDocs.join(", ")}`;
      })
      .filter(Boolean);

    const restauranteResumo = restaurantesFonte
      .map((item: any, index: number) => {
        const partes: string[] = [];
        if (textoLimpo(item?.nome)) partes.push(`Nome: ${item.nome}`);
        if (textoLimpo(item?.local)) partes.push(`Local: ${item.local}`);
        if (textoLimpo(item?.tipoCozinha)) partes.push(`Cozinha: ${item.tipoCozinha}`);
        if (textoLimpo(item?.data)) partes.push(`Data: ${fmtData(item.data)}`);
        if (textoLimpo(item?.horario)) partes.push(`Horário: ${item.horario}`);
        if (Number(item?.qtdPessoas) > 0) partes.push(`Pessoas: ${item.qtdPessoas}`);
        if (textoLimpo(item?.voucherNome)) partes.push(`Voucher: ${item.voucherNome}`);
        if (partes.length === 0) return "";
        return `${index + 1}) ${partes.join(" | ")}`;
      })
      .filter(Boolean);

    const experienciasResumo = experienciasFonte
      .map((item: any, index: number) => {
        const partes: string[] = [];
        if (textoLimpo(item?.nome)) partes.push(`Nome: ${item.nome}`);
        if (textoLimpo(item?.local)) partes.push(`Local: ${item.local}`);
        if (textoLimpo(item?.tipo)) partes.push(`Tipo: ${item.tipo}`);
        if (textoLimpo(item?.data)) partes.push(`Data: ${fmtData(item.data)}`);
        if (textoLimpo(item?.horario)) partes.push(`Horário: ${item.horario}`);
        if (textoLimpo(item?.duracao)) partes.push(`Duração: ${item.duracao}`);
        if (textoLimpo(item?.inclui)) partes.push(`Inclui: ${item.inclui}`);
        if (textoLimpo(item?.nReserva)) partes.push(`Reserva: ${item.nReserva}`);
        if (textoLimpo(item?.pontoEncontro)) partes.push(`Ponto de encontro: ${item.pontoEncontro}`);
        if (textoLimpo(item?.voucherNome)) partes.push(`Voucher: ${item.voucherNome}`);
        if (partes.length === 0) return "";
        return `${index + 1}) ${partes.join(" | ")}`;
      })
      .filter(Boolean);

    const perfilViagemResumo = perfilFonte
      .map((item) => {
        const partes = textoLimpo(item).split("::");
        if (partes.length === 2) {
          const categoria = textoLimpo(partes[0]);
          const opcao = textoLimpo(partes[1]);
          return categoria && opcao ? `${categoria}: ${opcao}` : "";
        }
        return textoLimpo(item);
      })
      .filter(Boolean);

    const passageirosResumo = (Array.isArray(orcamentoFonte.passageiros) ? orcamentoFonte.passageiros : form.passageiros || [])
      .map((nome) => textoLimpo(nome))
      .filter(Boolean);

    const promptPerfilViagemLimpo = promptPerfilViagemIA.trim();
    const promptRoteiroLimpo = promptRoteiroIA.trim();
    const promptRoteiroUsuario = ehPromptGeradoAutomaticamente(promptRoteiroLimpo) ? "" : promptRoteiroLimpo;

    const resumoBasicoParaCampo = [
      montarSecao("Pacotes (resumo):", [
        ...pacotesVooResumo.slice(0, 2),
        ...pacotesHospedagemResumo.slice(0, 2),
        ...pacotesIngressoResumo.slice(0, 2),
      ]),
      montarSecao("Restaurantes (resumo):", restauranteResumo.slice(0, 3)),
      montarSecao("Experiências (resumo):", experienciasResumo.slice(0, 3)),
    ]
      .filter(Boolean)
      .join("\n\n");

    const promptParaCampo = [promptRoteiroUsuario, resumoBasicoParaCampo].filter(Boolean).join("\n\n");
    if (promptParaCampo && promptParaCampo !== promptRoteiroIA) {
      setPromptRoteiroIA(promptParaCampo);
    }

    const destinosTexto = destinosDosVoos.length > 0 ? destinosDosVoos.join(", ") : "";
    const destinosPacotesTexto = destinosDosPacotes.length > 0 ? destinosDosPacotes.join(", ") : "";

    const diretrizesAdicionais = [promptRoteiroUsuario, promptPerfilViagemLimpo]
      .filter(Boolean)
      .join("\n\n");

    const contextoPrompt = [
      destinoPrincipal ? `- Destino principal: ${destinoPrincipal}` : "",
      destinosPacotesTexto
        ? `- Destino(s) priorizados dos pacotes (usar como referência principal quando houver): ${destinosPacotesTexto}`
        : "",
      destinosTexto ? `- Destino(s) dos voos: ${destinosTexto}` : "",
      montarSecao("- Voos informados:", voosResumo),
      montarSecao("- Hospedagem informada:", hospedagemResumo),
      montarSecao("- Detalhes do Voo (Pacotes):", pacotesVooResumo),
      montarSecao("- Detalhes da Hospedagem (Pacotes):", pacotesHospedagemResumo),
      montarSecao("- Detalhes do Traslado (Pacotes):", pacotesTrasladoResumo),
      montarSecao("- Detalhes do Ingresso (Pacotes):", pacotesIngressoResumo),
      montarSecao("- Vouchers dos Pacotes:", vouchersPacotesResumo),
      montarSecao("- Restaurantes:", restauranteResumo),
      montarSecao("- Experiências:", experienciasResumo),
      passageirosResumo.length > 0 ? `- Passageiros: ${passageirosResumo.join(", ")}` : "",
      montarSecao("- Perfil da viagem selecionado:", perfilViagemResumo),
      diretrizesAdicionais ? `- Diretrizes adicionais para personalizar o roteiro:\n${diretrizesAdicionais}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `Você é um consultor de viagens e deve criar um roteiro personalizado para ${form.cliente || "cliente"}.

Contexto da viagem:
${contextoPrompt}

Regras:
- Use somente os dados do contexto.
- Não invente hotéis, voos, horários, atrações ou reservas que não estejam informados.
- Escreva apenas em português do Brasil.
- Se algum dado não existir, siga o roteiro sem citar ausência de dados.

Formato da resposta (texto simples):
Título do roteiro:
Resumo da viagem:
Dia a dia sugerido:
Dia 1 - ...
Dia 2 - ...
Destaques imperdíveis:
1) ...
2) ...
Dicas práticas:
Transporte:
Horários:
Segurança:
Clima:`;

    try {
      let respostaFinal = "";
      const errosProvedores: string[] = [];

      const tentarComProvedor = async (provedor: "openai" | "groq" | "gemini" | "wonderful") => {
        const data = await enviarMensagemIA(
            [{ role: "user", content: prompt }],
            provedor
        );
        return data.reply;
      };

      if (provedorRoteiroIA === "automatico") {
        const provedores: ("openai" | "groq" | "gemini" | "wonderful")[] = ["wonderful", "groq", "gemini", "openai"];
        for (const provedor of provedores) {
          try {
            respostaFinal = await tentarComProvedor(provedor);
            if (respostaFinal) {
              setIaRoteiroExibida(nomesProvedorIA[provedor]);
              break;
            }
          } catch (error) {
            const erroMsg = error instanceof Error ? error.message : JSON.stringify(error);
            errosProvedores.push(`${provedor.toUpperCase()}: ${erroMsg}`);
            console.warn(`Falha no provedor ${provedor}, tentando próximo...`, error);
          }
        }
        if (!respostaFinal) {
          const erroDetalhado = errosProvedores.join("\n\n");
          setRoteiro(`Ocorreu um erro ao tentar gerar o roteiro com a IA.\n\nTodos os provedores de IA falharam:\n\n${erroDetalhado}`);
          return;
        }
      } else {
        respostaFinal = await tentarComProvedor(provedorRoteiroIA as Exclude<typeof provedorRoteiroIA, "automatico">);
        setIaRoteiroExibida(nomesProvedorIA[provedorRoteiroIA]);
      }

      const destinosPacotes = Array.from(
        new Set(
          pacotesFonte
            .map((pacote: any) => String(pacote?.destinoIda || pacote?.destino || '').trim())
            .filter(Boolean),
        ),
      );

      const destinosFallback = Array.from(
        new Set([
          String(destinoPrincipal || '').trim(),
          ...destinosPacotes,
        ].filter(Boolean)),
      );

      const roteiroFormatado = formatarRespostaRoteiroParaCampo(respostaFinal, {
        destinosFallback,
      });
      setRoteiro(roteiroFormatado);

      const dayByDayGerado = extrairDayByDayDoRoteiro(roteiroFormatado);
      if (dayByDayGerado.length > 0) {
        setDayByDay(dayByDayGerado);
      }
      
      // Salva para o usuário apenas o prompt base preenchido com os dados do formulário.
      setPromptRoteiroIA(promptParaCampo || prompt);
    } catch (error) {
      console.error("Falha ao gerar roteiro com IA:", error);
      // Exibe mensagem de erro detalhada com todos os provedores que falharam
      const detalhesErro = error instanceof Error ? error.message : JSON.stringify(error);
      setRoteiro(
          `Ocorreu um erro ao tentar gerar o roteiro com a IA.\n\n${detalhesErro}`
      );
    } finally {
      setGerandoRoteiro(false);
    }
  }

  // ============ TELA FORMULÁRIO ============
  if (tela === "form") {
    return (
        <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="flex items-center gap-3 mb-6 flex-wrap relative">
            {form.cliente && (
              <span className="text-2xl font-bold text-indigo-700">{form.cliente}</span>
            )}
            {!editando && <h2 className="text-xl font-bold text-gray-900">Novo Orçamento</h2>}

            {/* Save/Exit button - starts as Sair and only changes to save when the form is dirty */}
            <div className="ml-auto">
              <Button
                type="button"
                onClick={houveAlteracoes ? abrirModalSalvar : voltar}
                disabled={salvando}
                className={houveAlteracoes ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-600 hover:bg-gray-700 text-white"}
              >
                {houveAlteracoes ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {salvando ? "Salvando..." : editando ? "Salvar" : "Criar roteiro"}
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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative mt-3">
                      <div className="flex flex-col md:col-span-2">
                        <Label htmlFor="cliente">Cliente *</Label>
                        <select
                            id="cliente"
                            value={form.cliente}
                            onChange={(e) => {
                              const nome = e.target.value;
                              const cliente = clientesAtivos.find((item) => (item.nomeCompleto || item.nome) === nome);
                              const funcionario = funcionariosAtivos.find((item) => item.name === nome);
                              const fornecedor = fornecedoresAtivos.find((item) => (item.nomeFantasia || item.razaoSocial) === nome);
                              setForm((prev) => ({
                                ...prev,
                                cliente: nome,
                                email: cliente?.email ?? funcionario?.email ?? fornecedor?.email ?? "",
                              }));
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
                      </div>
                      <div className="flex flex-col">
                        <Label htmlFor="agenteViagem">Agente</Label>
                        <select
                            id="agenteViagem"
                            value={form.agenteViagem || (usuarioLogado?.name || "")}
                            onChange={(e) => setForm((prev) => ({ ...prev, agenteViagem: e.target.value || undefined }))}
                            className="mt-1 flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <option value="">Selecione um agente</option>
                          {funcionariosAtivos.map((funcionario) => (
                            <option key={funcionario.id} value={funcionario.name}>{funcionario.name}</option>
                          ))}
                        </select>
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
                        <Label>Status da Viagem</Label>
                        <select
                            value={form.statusViagem || ""}
                            onChange={(e) => {
                              const novoStatus = e.target.value as StatusViagem | undefined;
                              setForm((prev) => ({ ...prev, statusViagem: novoStatus }));
                            }}
                            className="mt-1 flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <option value="">Selecione...</option>
                          <option value={STATUS_VIAGEM_NAO_INICIADA}>{STATUS_VIAGEM_NAO_INICIADA}</option>
                          <option value={STATUS_VIAGEM_EM_ANDAMENTO}>{STATUS_VIAGEM_EM_ANDAMENTO}</option>
                          <option value={STATUS_VIAGEM_FINALIZADA}>{STATUS_VIAGEM_FINALIZADA}</option>
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

              {/* Seções do voucher (sub-páginas) */}
              <Card className="p-3 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3 cursor-pointer select-none" onClick={() => setSecoesOrcamentoMinimizadas((prev) => !prev)}>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Seções do Roteiro</h3>
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
                              <PacotesForm
                                pacotes={pacotes}
                                onPacotesChange={setPacotes}
                                onSalvarPacotes={salvarPacotesDaSecao}
                                hospedagens={hospedagem}
                                onHospedagensChange={setHospedagem}
                              />
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
                              </div>
                              <div className="flex justify-between items-center mb-2 gap-3">
                                <Label htmlFor="roteiro-texto">Roteiro</Label>
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                  <div className="flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600">IA</span>
                                    <span className="text-xs font-medium text-indigo-700">{iaRoteiroExibida}</span>
                                  </div>
                                  <select
                                    value={provedorRoteiroIA}
                                    onChange={(e) => {
                                      const valor = e.target.value as typeof provedorRoteiroIA;
                                      setProvedorRoteiroIA(valor);
                                      setIaRoteiroExibida(nomesProvedorIA[valor]);
                                    }}
                                    className="px-3 py-1.5 text-sm border border-indigo-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    disabled={gerandoRoteiro}
                                  >
                                    <option value="automatico">Automático</option>
                                    <option value="gemini">Gemini</option>
                                    <option value="groq">Groq</option>
                                    <option value="openai">OpenAI</option>
                                    <option value="wonderful">Wonderful</option>
                                  </select>
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
                            <RestauranteForm
                              restaurantes={restaurante}
                              onRestaurantesChange={setRestaurante}
                              onRestauranteDelete={persistirExclusaoRestaurante}
                              destinoInicialBusca={obterDestinoPrincipalOrcamento(undefined, true)}
                            />
                        )}

                        {section === 'Experiências' && (
                            <ExperienciasForm experiencias={experiencias} onExperienciasChange={setExperiencias} />
                        )}
                      </div>
                    </>
                )}
              </Card>

              {/* Perfil da viagem */}
              {section === 'Pacotes' && (
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

                {!perfilViagemMinimizado && (
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
              )}

              {/* Roteiro */}
              <Card className="p-3 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3 cursor-pointer select-none" onClick={() => setRoteiroMinimizado((prev) => !prev)}>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /> Página de Roteiro do Cliente</h3>
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

          {modalSalvarAberto && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Deseja salvar o roteiro?</h3>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleSalvarSemSair}
                    disabled={salvando}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {salvando ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button
                    onClick={handleSalvarESair}
                    disabled={salvando}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {salvando ? "Salvando..." : "Salvar e Sair"}
                  </Button>
                  <Button
                    onClick={fecharModalSalvar}
                    variant="outline"
                    className="w-full"
                    disabled={salvando}
                  >
                    Cancelar
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
      <>
      <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Roteiros</h1>
            <p className="text-sm text-gray-500 mt-1">{lista.length} roteiros cadastrados</p>
          </div>
          <Button onClick={abrirNovo} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Roteiro</span><span className="sm:hidden">Novo</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              <Card className="w-full p-3 sm:p-4 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:shadow-md">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><Calendar className="w-4 h-4 text-slate-600" /></div>
                <p className="text-xs text-gray-500 text-center">{lista.filter((o) => o.statusViagem === STATUS_VIAGEM_NAO_INICIADA).length === 1 ? "Viagem Não Iniciada" : "Viagens Não Iniciadas"}</p>
                <p className="text-base font-bold text-gray-900 text-center">{lista.filter((o) => o.statusViagem === STATUS_VIAGEM_NAO_INICIADA).length}</p>
              </Card>
              <Card className="w-full p-3 sm:p-4 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:shadow-md">
                <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center"><Calendar className="w-4 h-4 text-sky-600" /></div>
                <p className="text-xs text-gray-500 text-center">{lista.filter((o) => o.statusViagem === STATUS_VIAGEM_EM_ANDAMENTO).length === 1 ? "Viagem Em Andamento" : "Viagens Em Andamento"}</p>
                <p className="text-base font-bold text-gray-900 text-center">{lista.filter((o) => o.statusViagem === STATUS_VIAGEM_EM_ANDAMENTO).length}</p>
              </Card>
              <Card className="w-full p-3 sm:p-4 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:shadow-md">
                <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center"><Calendar className="w-4 h-4 text-teal-600" /></div>
                <p className="text-xs text-gray-500 text-center">{lista.filter((o) => o.statusViagem === STATUS_VIAGEM_FINALIZADA).length === 1 ? "Viagem Finalizada" : "Viagens Finalizadas"}</p>
                <p className="text-base font-bold text-gray-900 text-center">{lista.filter((o) => o.statusViagem === STATUS_VIAGEM_FINALIZADA).length}</p>
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
            const linhasDescricao = montarLinhasDescricao(orc);
            const totalDescricao = calcTotal(linhasDescricao);
            const expandido = expandidos.has(orc.id);
            const destinoResumo = obterDestinoResumoOrcamento(orc);
            const periodoResumo = obterPeriodoResumoOrcamento(orc);
            return (
                <Card key={orc.id} className="overflow-hidden">
                  {/* Linha principal */}
                  <div className="p-3 sm:p-4">
                    {/* Single line layout with mobile scroll */}
                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-indigo-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-gray-900 leading-tight truncate">{orc.cliente}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {destinoResumo && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" />{destinoResumo}</span>}
                      </div>

                      {orc.statusViagem && (() => { const cfgV = statusViagemConfig[orc.statusViagem] || { bg: "bg-slate-100", cor: "text-slate-600" }; return <Badge className={`${cfgV.bg} ${cfgV.cor} hover:${cfgV.bg} text-xs flex-shrink-0`}>{orc.statusViagem}</Badge>; })()}

                      {/* Período principal prioriza voo e usa hospedagem como fallback */}
                      {periodoResumo && (
                        <div className="flex items-center gap-1 flex-shrink-0 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs">
                            {periodoResumo.ida ? fmtData(periodoResumo.ida) : "—"} à {periodoResumo.volta ? fmtData(periodoResumo.volta) : "—"}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button onClick={() => void abrirEdicao(orc)} title="Editar" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => gerarRoteiro(orc)} title="Roteiro" className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"><MapPin className="w-4 h-4" /></button>
                        <button
                          onClick={() => toggleFavorito(orc.id)}
                          title={favoritos.includes(orc.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                          className={`p-2 rounded-lg transition-colors ${favoritos.includes(orc.id) ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                        >
                          <Star className={`w-4 h-4 ${favoritos.includes(orc.id) ? 'fill-yellow-400' : ''}`} />
                        </button>
                        <button
                          onClick={() => toggleExpandir(orc.id)}
                          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                          title={expandido ? "Recolher" : "Ver detalhes"}
                        >
                          {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Itens expandidos — cards em mobile, tabela em desktop */}
                  {expandido && (
                    <div className="border-t border-gray-100 bg-gray-50 px-3 sm:px-4 py-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Descrição</h4>

                      {/* Datas de check-in e check-out dos pacotes */}
                      {orc.pacotes && orc.pacotes.length > 0 && orc.pacotes.some((p: any) => p.hospedagemCheckin || p.hospedagemCheckout) && (
                        <div className="mb-3 pb-3 border-b border-gray-200">
                          <h5 className="text-xs font-semibold text-gray-600 mb-1.5">Datas de Hospedagem</h5>
                          <div className="flex flex-wrap gap-2">
                            {orc.pacotes.map((pacote: any, idx: number) => {
                              if (pacote.hospedagemCheckin || pacote.hospedagemCheckout) {
                                return (
                                  <span key={idx} className="text-xs text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">
                                    {pacote.hospedagemNome ? `${pacote.hospedagemNome}: ` : ""}
                                    {pacote.hospedagemCheckin ? fmtData(pacote.hospedagemCheckin) : "—"} à {pacote.hospedagemCheckout ? fmtData(pacote.hospedagemCheckout) : "—"}
                                  </span>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tabela — apenas desktop */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-400 font-semibold">
                              <th className="text-left pb-2">Descrição</th>
                              <th className="text-right pb-2 w-24">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {linhasDescricao.map((item) => (
                              <tr key={item.id} className="border-t border-gray-200">
                                <td className="py-1.5 text-gray-700">{item.descricao}</td>
                                <td className="py-1.5 text-right font-semibold text-gray-800">{moeda(calcItem(item))}</td>
                              </tr>
                            ))}
                            <tr className="border-t-2 border-indigo-200">
                              <td className="py-2 font-bold text-gray-700">Total</td>
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

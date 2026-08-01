import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, X, Check, Trash2, Edit2, RefreshCw, ChevronUp, ChevronDown, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { listarClientes, type Cliente } from "../data/clientesApi";
import {
  atualizarEvento,
  criarEvento,
  listarEventos,
  removerEvento,
  type Evento,
  type EventoPayload,
  type TipoEvento,
} from "../data/eventosApi";
import { listarOrcamentos, type Orcamento } from "../data/orcamentosApi";
import { listarFuncionarios, type Funcionario } from "../data/funcionariosApi";

type FiltroPeriodo = "semana" | "mes" | "ano";

const tipoConfig: Record<TipoEvento, { cor: string; bg: string; dot: string }> = {
  "Reunião":  { cor: "text-blue-700",   bg: "bg-blue-100",   dot: "bg-blue-500" },
  "Viagem":   { cor: "text-purple-700", bg: "bg-purple-100", dot: "bg-purple-500" },
  "Tarefa":   { cor: "text-yellow-700", bg: "bg-yellow-100", dot: "bg-yellow-500" },
  "Lembrete": { cor: "text-orange-700", bg: "bg-orange-100", dot: "bg-orange-500" },
  "Outro":    { cor: "text-gray-700",   bg: "bg-gray-100",   dot: "bg-gray-400" },
};

const allTipos: TipoEvento[] = ["Reunião", "Viagem", "Tarefa", "Lembrete", "Outro"];

const hoje = new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const nomeMeses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const nomeDias  = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function getDiasDoMes(ano: number, mes: number) {
  return {
    primeiro: new Date(ano, mes, 1).getDay(),
    total:    new Date(ano, mes + 1, 0).getDate(),
  };
}

function fromDateStr(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function addDias(data: Date, dias: number) {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

function inicioDaSemana(data: Date) {
  const d = new Date(data);
  const diaSemana = d.getDay();
  const offset = diaSemana === 0 ? -6 : 1 - diaSemana;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fimDaSemana(data: Date) {
  return addDias(inicioDaSemana(data), 6);
}

const vazio: EventoPayload = { titulo: "", descricao: "", data: toDateStr(hoje), hora: "09:00", tipo: "Reunião", cliente: "", agente: "" };

function formatarData(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
// Paleta de cores para clientes — cada cliente recebe um índice fixo
const PALETA_CLIENTES = [
  { bg: "bg-sky-200",      border: "border-sky-400",      text: "text-sky-800",      dot: "bg-sky-400"      },
  { bg: "bg-emerald-200",  border: "border-emerald-400",  text: "text-emerald-800",  dot: "bg-emerald-400"  },
  { bg: "bg-violet-200",   border: "border-violet-400",   text: "text-violet-800",   dot: "bg-violet-400"   },
  { bg: "bg-amber-200",    border: "border-amber-400",    text: "text-amber-800",    dot: "bg-amber-400"    },
  { bg: "bg-rose-200",     border: "border-rose-400",     text: "text-rose-800",     dot: "bg-rose-400"     },
  { bg: "bg-teal-200",     border: "border-teal-400",     text: "text-teal-800",     dot: "bg-teal-400"     },
  { bg: "bg-orange-200",   border: "border-orange-400",   text: "text-orange-800",   dot: "bg-orange-400"   },
  { bg: "bg-pink-200",     border: "border-pink-400",     text: "text-pink-800",     dot: "bg-pink-400"     },
  { bg: "bg-lime-200",     border: "border-lime-400",     text: "text-lime-800",     dot: "bg-lime-400"     },
  { bg: "bg-cyan-200",     border: "border-cyan-400",     text: "text-cyan-800",     dot: "bg-cyan-400"     },
];

export default function Agenda() {
  const navigate = useNavigate();
  const [eventos, setEventos]           = useState<Evento[]>([]);
  const [clientes, setClientes]         = useState<Cliente[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [anoAtual, setAnoAtual]         = useState(hoje.getFullYear());
  const [mesAtual, setMesAtual]         = useState(hoje.getMonth());
  const [diaSelecionado, setDiaSel]     = useState<string | null>(toDateStr(hoje));
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>("mes");
  const [modalAberto, setModalAberto]   = useState(false);
  const [form, setForm]                 = useState<EventoPayload>(vazio);
  const [editandoId, setEditandoId]     = useState<number | null>(null);
  const [carregando, setCarregando]     = useState(true);
  const [salvando, setSalvando]         = useState(false);
  const [erro, setErro]                 = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [msgSinc, setMsgSinc]           = useState<string | null>(null);
  const [orcamentos, setOrcamentos]     = useState<Orcamento[]>([]);
  const [modalViagemCliente, setModalViagemCliente] = useState<string | null>(null);
  const [cardStates, setCardStates] = useState<{
    calendario: boolean;
    eventosDia: boolean;
    eventosPeriodo: boolean;
    proximosEventos: boolean;
  }>({
    calendario: false,
    eventosDia: false,
    eventosPeriodo: false,
    proximosEventos: false,
  });

  // Mapa cliente → índice de cor (estável, baseado na ordem de aparição)
  const corPorCliente = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const orc of orcamentos) {
      const nome = orc.cliente || "";
      if (nome && !mapa.has(nome)) {
        mapa.set(nome, mapa.size % PALETA_CLIENTES.length);
      }
    }
    return mapa;
  }, [orcamentos]);

  // Normaliza datas em qualquer formato (ISO "2026-08-15" ou BR "15/08/2026") para "yyyy-mm-dd"
  function normalizarData(valor: unknown): string | null {
    if (!valor || typeof valor !== "string") return null;
    const v = valor.trim();
    if (!v) return null;
    // já é ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    // formato BR dd/mm/yyyy
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return null;
  }

  // Intervalos checkin→checkout extraídos dos orçamentos
  // Fontes: pacotes[].hospedagemCheckin/Checkout, pacotes[].dataIda/dataVolta,
  //         hospedagem[].checkin/checkout, voos[] (agrupa IDA→VOLTA por orçamento)
  const intervalosViagem = useMemo(() => {
    const intervalos: { checkin: string; checkout: string | null; cliente: string }[] = [];

    for (const orc of orcamentos) {
      const cliente = orc.cliente || "";

      // 1. Pacotes: hospedagemCheckin/Checkout
      for (const pacote of orc.pacotes ?? []) {
        const checkin  = normalizarData(pacote.hospedagemCheckin);
        const checkout = normalizarData(pacote.hospedagemCheckout);
        if (checkin) intervalos.push({ checkin, checkout, cliente });
      }

      // 2. Pacotes: dataIda/dataVolta (quando não há hospedagem no pacote)
      for (const pacote of orc.pacotes ?? []) {
        if (pacote.hospedagemCheckin) continue; // já coberto acima
        const checkin  = normalizarData(pacote.dataIda);
        const checkout = normalizarData(pacote.dataVolta);
        if (checkin) intervalos.push({ checkin, checkout, cliente });
      }

      // 3. Hospedagem separada: checkin/checkout (vários campos possíveis)
      for (const hosp of orc.hospedagem ?? []) {
        const checkin  = normalizarData(hosp.checkin)  ?? normalizarData(hosp.checkinHotel)  ?? normalizarData(hosp.dataCheckin)  ?? null;
        const checkout = normalizarData(hosp.checkout) ?? normalizarData(hosp.checkoutHotel) ?? normalizarData(hosp.dataCheckout) ?? null;
        if (checkin) intervalos.push({ checkin, checkout, cliente });
      }

      // 4. Voos individuais: agrupa primeiro voo IDA como checkin e primeiro VOLTA como checkout
      const voosOrc: any[] = orc.voos ?? [];
      const vooIda   = voosOrc.find((v: any) => v.tipoTrecho === "IDA"   || (!v.tipoTrecho && voosOrc.indexOf(v) === 0));
      const vooVolta = voosOrc.find((v: any) => v.tipoTrecho === "VOLTA" || (!v.tipoTrecho && voosOrc.indexOf(v) === voosOrc.length - 1 && voosOrc.length > 1));
      const checkinVoo  = normalizarData(vooIda?.data);
      const checkoutVoo = normalizarData(vooVolta?.data);
      // Só adiciona voo se não houver pacote/hospedagem já cobrindo esse cliente
      const jaTemIntervalo = intervalos.some(i => i.cliente === cliente);
      if (checkinVoo && !jaTemIntervalo) {
        intervalos.push({ checkin: checkinVoo, checkout: checkoutVoo ?? null, cliente });
      }
    }

    return intervalos;
  }, [orcamentos]);

  // Para cada data, retorna status no intervalo + paleta de cor do cliente
  function statusDiaViagem(dataStr: string): {
    status: "checkin" | "checkout" | "meio" | "unico" | null;
    cliente: string;
    cor: typeof PALETA_CLIENTES[number] | null;
  } {
    for (const { checkin, checkout, cliente } of intervalosViagem) {
      const idx = corPorCliente.get(cliente) ?? 0;
      const cor = PALETA_CLIENTES[idx];
      if (!checkout) {
        if (dataStr === checkin) return { status: "unico", cliente, cor };
        continue;
      }
      if (dataStr === checkin && dataStr === checkout) return { status: "unico", cliente, cor };
      if (dataStr === checkin)  return { status: "checkin",  cliente, cor };
      if (dataStr === checkout) return { status: "checkout", cliente, cor };
      if (dataStr > checkin && dataStr < checkout) return { status: "meio", cliente, cor };
    }
    return { status: null, cliente: "", cor: null };
  }

  async function carregarEventos() {
    setErro(null);
    try {
      const lista = await listarEventos();
      setEventos(lista);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar eventos.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarOrcamentos() {
    try {
      const lista = await listarOrcamentos();
      setOrcamentos(lista);
    } catch {
      // não bloqueia a agenda se falhar
    }
  }

  async function carregarRelacionamentos() {
    try {
      const [clientesLista, funcionariosLista] = await Promise.all([
        listarClientes(),
        listarFuncionarios(),
      ]);

      setClientes(clientesLista);
      setFuncionarios(funcionariosLista.filter((funcionario) => funcionario.status === "Ativo"));
    } catch {
      setClientes([]);
      setFuncionarios([]);
    }
  }

  async function sincronizarOrcamentos() {
    setSincronizando(true);
    setMsgSinc(null);
    setErro(null);

    try {
      const orcamentos = await listarOrcamentos();
      const eventosExistentes = await listarEventos();

      // Monta conjunto de títulos já existentes por data para evitar duplicatas
      const chaveExistente = new Set(
        eventosExistentes.map((e) => `${e.data}||${e.titulo}`)
      );

      const novosEventos: EventoPayload[] = [];

      for (const orc of orcamentos) {
        const cliente = orc.cliente || "";
        const agente = orc.agenteViagem || "";
        const numero = orc.numero || String(orc.id);

        // Voos individuais
        for (const voo of orc.voos ?? []) {
          const data: string = voo.data;
          if (!data || typeof data !== "string") continue;
          const trecho = voo.tipoTrecho ? ` (${voo.tipoTrecho})` : "";
          const rota = voo.origem && voo.destino ? ` ${voo.origem} → ${voo.destino}` : "";
          const cia = voo.companhia ? ` - ${voo.companhia}` : "";
          const titulo = `✈️ Voo${trecho}${rota}${cia}`;
          const chave = `${data}||${titulo}`;
          if (!chaveExistente.has(chave)) {
            chaveExistente.add(chave);
            novosEventos.push({
              titulo,
              descricao: `Orçamento #${numero} - Cliente: ${cliente}${voo.numero ? ` - Voo: ${voo.numero}` : ""}`,
              data,
              hora: "00:00",
              tipo: "Viagem",
              cliente,
              agente,
            });
          }
        }

        // Pacotes: dataIda, dataVolta, hospedagemCheckin, hospedagemCheckout
        for (const pacote of orc.pacotes ?? []) {
          const operador = pacote.operador ? ` (${pacote.operador})` : "";
          const rotaPacote =
            pacote.origem && pacote.destino
              ? ` ${pacote.origem} → ${pacote.destino}`
              : orc.destino
              ? ` ${orc.destino}`
              : "";

          const pares: Array<[string | undefined, string]> = [
            [pacote.dataIda,             `✈️ Voo Ida${rotaPacote}${operador}`],
            [pacote.dataVolta,           `✈️ Voo Volta${rotaPacote}${operador}`],
            [pacote.hospedagemCheckin,   `🏨 Check-in${pacote.hospedagemNome ? ` - ${pacote.hospedagemNome}` : ""}${operador}`],
            [pacote.hospedagemCheckout,  `🏨 Check-out${pacote.hospedagemNome ? ` - ${pacote.hospedagemNome}` : ""}${operador}`],
          ];

          for (const [data, titulo] of pares) {
            if (!data || typeof data !== "string") continue;
            const chave = `${data}||${titulo}`;
            if (!chaveExistente.has(chave)) {
              chaveExistente.add(chave);
              novosEventos.push({
                titulo,
                descricao: `Orçamento #${numero} - Cliente: ${cliente}`,
                data,
                hora: "00:00",
                tipo: "Viagem",
                cliente,
                agente,
              });
            }
          }
        }
      }

      if (novosEventos.length === 0) {
        setMsgSinc("Nenhum evento novo encontrado. Agenda já está sincronizada.");
        return;
      }

      await Promise.allSettled(novosEventos.map((ev) => criarEvento(ev)));
      await carregarEventos();
      setMsgSinc(`${novosEventos.length} evento(s) criado(s) com sucesso!`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao sincronizar orçamentos.");
    } finally {
      setSincronizando(false);
      setTimeout(() => setMsgSinc(null), 5000);
    }
  }

  useEffect(() => {
    carregarEventos();
    carregarOrcamentos();
    carregarRelacionamentos();
  }, []);

  const { primeiro, total } = getDiasDoMes(anoAtual, mesAtual);

  const aplicarDataBase = (data: Date) => {
    setAnoAtual(data.getFullYear());
    setMesAtual(data.getMonth());
    setDiaSel(toDateStr(data));
  };

  const navegarAnterior = () => {
    if (filtroPeriodo === "semana") {
      const base = diaSelecionado ? fromDateStr(diaSelecionado) : hoje;
      aplicarDataBase(addDias(base, -7));
      return;
    }
    if (filtroPeriodo === "mes") {
      if (mesAtual === 0) {
        setMesAtual(11);
        setAnoAtual(a => a - 1);
      } else {
        setMesAtual(m => m - 1);
      }
      return;
    }
    setAnoAtual(a => a - 1);
  };

  const navegarProximo = () => {
    if (filtroPeriodo === "semana") {
      const base = diaSelecionado ? fromDateStr(diaSelecionado) : hoje;
      aplicarDataBase(addDias(base, 7));
      return;
    }
    if (filtroPeriodo === "mes") {
      if (mesAtual === 11) {
        setMesAtual(0);
        setAnoAtual(a => a + 1);
      } else {
        setMesAtual(m => m + 1);
      }
      return;
    }
    setAnoAtual(a => a + 1);
  };

  const eventosDoDia       = (data: string) => eventos.filter(e => e.data === data);
  const eventosSelecionados = diaSelecionado ? eventosDoDia(diaSelecionado) : [];

  const baseData = diaSelecionado ? fromDateStr(diaSelecionado) : hoje;
  const inicioPeriodo =
    filtroPeriodo === "semana"
      ? inicioDaSemana(baseData)
      : filtroPeriodo === "mes"
      ? new Date(anoAtual, mesAtual, 1)
      : new Date(anoAtual, 0, 1);
  const fimPeriodo =
    filtroPeriodo === "semana"
      ? fimDaSemana(baseData)
      : filtroPeriodo === "mes"
      ? new Date(anoAtual, mesAtual + 1, 0)
      : new Date(anoAtual, 11, 31);

  const inicioStr = toDateStr(inicioPeriodo);
  const fimStr = toDateStr(fimPeriodo);

  const eventosDoPeriodo = [...eventos]
    .filter(e => e.data >= inicioStr && e.data <= fimStr)
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

  const tituloPeriodo =
    filtroPeriodo === "semana"
      ? `${formatarData(inicioStr)} - ${formatarData(fimStr)}`
      : filtroPeriodo === "mes"
      ? `${nomeMeses[mesAtual]} ${anoAtual}`
      : `Ano ${anoAtual}`;

  const diasDaSemana = Array.from({ length: 7 }).map((_, i) => {
    const data = addDias(inicioDaSemana(baseData), i);
    const dataStr = toDateStr(data);
    return {
      data,
      dataStr,
      eventos: eventosDoDia(dataStr),
      isHoje: dataStr === toDateStr(hoje),
      isSel: dataStr === diaSelecionado,
    };
  });

  const abrirNovo   = () => { setErro(null); setForm({ ...vazio, data: diaSelecionado ?? toDateStr(hoje) }); setEditandoId(null); setModalAberto(true); };
  const abrirEditar = (ev: Evento) => {
    setErro(null);
    setForm({ titulo: ev.titulo, descricao: ev.descricao, data: ev.data, hora: ev.hora, tipo: ev.tipo, cliente: ev.cliente, agente: ev.agente });
    setEditandoId(ev.id);
    setModalAberto(true);
  };
  const fechar      = () => { setModalAberto(false); setForm(vazio); setEditandoId(null); };
  const salvar      = async () => {
    if (!form.titulo.trim()) return;

    setSalvando(true);
    setErro(null);

    try {
      const payload: EventoPayload = {
        ...form,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        cliente: form.cliente.trim(),
        agente: form.agente.trim(),
      };

      if (editandoId !== null) {
        await atualizarEvento(editandoId, payload);
      } else {
        await criarEvento(payload);
      }

      await carregarEventos();
      fechar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar evento.");
    } finally {
      setSalvando(false);
    }
  };
  const excluir = async (id: number) => {
    setErro(null);
    try {
      await removerEvento(id);
      await carregarEventos();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao excluir evento.");
    }
  };

  const toggleCardState = (card: keyof typeof cardStates) => {
    setCardStates(prev => ({
      ...prev,
      [card]: !prev[card]
    }));
  };

  const proximosEventos = [...eventos]
    .filter(e => e.data >= toDateStr(hoje))
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
    .slice(0, 5);

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="w-8 h-8 text-blue-600" /> Agenda
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => { aplicarDataBase(hoje); setFiltroPeriodo("mes"); }}
            className="px-3 py-1.5 text-sm rounded-full border transition-colors bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            Hoje
          </button>
          {([
            { key: "semana", label: "Semana" },
            { key: "mes", label: "Mês" },
            { key: "ano", label: "Ano" },
          ] as { key: FiltroPeriodo; label: string }[]).map((filtro) => (
            <button
              key={filtro.key}
              type="button"
              onClick={() => setFiltroPeriodo(filtro.key)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${filtroPeriodo === filtro.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
            >
              {filtro.label}
            </button>
          ))}
          <Button
            onClick={sincronizarOrcamentos}
            disabled={sincronizando}
            variant="outline"
            className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
            title="Importar datas de voo e hospedagem dos orçamentos existentes"
          >
            <RefreshCw className={`w-4 h-4 ${sincronizando ? "animate-spin" : ""}`} />
            {sincronizando ? "Sincronizando..." : ""}
          </Button>
          <Button onClick={abrirNovo} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Evento
          </Button>
        </div>
      </div>
      {erro && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      {msgSinc && <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{msgSinc}</p>}
      {carregando && <p className="text-sm text-gray-500">Carregando eventos...</p>}
      <div className="space-y-6">
        {/* Calendário — largura total */}
        <Card className={cardStates.calendario ? "h-16 overflow-hidden" : ""}>
          <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => toggleCardState('calendario')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); navegarAnterior(); }} className="p-2 rounded-md hover:bg-gray-100 transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                <CardTitle className="text-lg font-semibold">{tituloPeriodo}</CardTitle>
                <button onClick={(e) => { e.stopPropagation(); navegarProximo(); }} className="p-2 rounded-md hover:bg-gray-100 transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
              </div>
              <button onClick={(e) => { e.stopPropagation(); toggleCardState('calendario'); }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors" title="Minimizar/Maximizar">
                {cardStates.calendario ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </CardHeader>
          {!cardStates.calendario && (
          <CardContent>
            {filtroPeriodo !== "ano" && (
              <div className="grid grid-cols-7 mb-2">
                {nomeDias.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1">{d}</div>)}
              </div>
            )}

            {filtroPeriodo === "mes" && (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: primeiro }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: total }).map((_, i) => {
                  const dia     = i + 1;
                  const dataStr = `${anoAtual}-${pad(mesAtual + 1)}-${pad(dia)}`;
                  const isHoje  = dataStr === toDateStr(hoje);
                  const isSel   = dataStr === diaSelecionado;
                  const evsDia  = eventosDoDia(dataStr);
                  const { status: svStatus, cliente: svCliente, cor: svCor } = statusDiaViagem(dataStr);

                  const bgViagem = !isSel && !isHoje && svStatus && svCor
                    ? `${svCor.bg} ${svCor.border}`
                    : "";

                  return (
                    <button key={dia} onClick={() => setDiaSel(dataStr)}
                      title={svCliente ? svCliente : undefined}
                      className={`relative flex flex-col items-center justify-start pt-1 pb-1 rounded-lg min-h-[52px] text-sm font-medium transition-colors border ${
                        isSel  ? "bg-blue-600 text-white border-blue-600"
                        : isHoje ? "bg-blue-50 text-blue-700 border-blue-300"
                        : bgViagem
                        ? `text-gray-800 ${bgViagem}`
                        : "text-gray-700 border-transparent hover:bg-gray-100"}`}
                    >
                      <span>{dia}</span>
                      {svStatus && !isSel && (
                        <span className="text-[9px] leading-none font-semibold truncate max-w-full px-0.5 mt-0.5 text-gray-600">
                          {svStatus === "checkin" || svStatus === "unico" ? "▶" : svStatus === "checkout" ? "◀" : "·"}
                        </span>
                      )}
                      {evsDia.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 px-0.5">
                          {evsDia.slice(0, 3).map(ev => <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${isSel ? "bg-white" : tipoConfig[ev.tipo].dot}`} />)}
                          {evsDia.length > 3 && <span className={`text-[9px] font-bold ${isSel ? "text-white" : "text-gray-500"}`}>+{evsDia.length - 3}</span>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {filtroPeriodo === "semana" && (
              <div className="grid grid-cols-7 gap-2">
                {diasDaSemana.map(({ data, dataStr, eventos: evsDia, isHoje, isSel }) => {
                  const { status: svStatus, cliente: svCliente, cor: svCor } = statusDiaViagem(dataStr);
                  const bgViagem = !isSel && !isHoje && svStatus && svCor
                    ? `${svCor.bg} ${svCor.border}`
                    : "";
                  return (
                    <button
                      key={dataStr}
                      onClick={() => setDiaSel(dataStr)}
                      title={svCliente || undefined}
                      className={`rounded-lg border min-h-[88px] p-2 text-left transition-colors ${
                        isSel
                          ? "bg-blue-600 text-white border-blue-600"
                          : isHoje
                          ? "bg-blue-50 text-blue-700 border-blue-300"
                          : bgViagem
                          ? `text-gray-800 ${bgViagem}`
                          : "text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-xs font-semibold">{nomeDias[data.getDay()]}</div>
                      <div className="text-sm font-bold">{pad(data.getDate())}</div>
                      {svStatus && !isSel && (
                        <div className="text-[10px] font-semibold text-gray-600 mt-0.5">
                          {svStatus === "checkin" || svStatus === "unico" ? "▶ Check-in" : svStatus === "checkout" ? "◀ Check-out" : "· · ·"}
                        </div>
                      )}
                      <div className="mt-2 space-y-1">
                        {evsDia.slice(0, 2).map(ev => (
                          <div key={ev.id} className={`text-[11px] truncate rounded px-1.5 py-0.5 ${isSel ? "bg-white/20" : "bg-gray-100 text-gray-700"}`}>
                            {ev.hora} {ev.titulo}
                          </div>
                        ))}
                        {evsDia.length > 2 && (
                          <div className={`text-[11px] font-semibold ${isSel ? "text-white" : "text-gray-500"}`}>
                            +{evsDia.length - 2} eventos
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {filtroPeriodo === "ano" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Array.from({ length: 12 }).map((_, indiceMes) => {
                  const totalMes = eventos.filter(e => e.data.startsWith(`${anoAtual}-${pad(indiceMes + 1)}-`)).length;
                  const isMesAtual = indiceMes === mesAtual;
                  return (
                    <button
                      key={indiceMes}
                      type="button"
                      onClick={() => {
                        setMesAtual(indiceMes);
                        setDiaSel(`${anoAtual}-${pad(indiceMes + 1)}-01`);
                        setFiltroPeriodo("mes");
                      }}
                      className={`rounded-lg border p-3 text-left transition-colors ${isMesAtual ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                    >
                      <div className="text-sm font-semibold text-gray-800">{nomeMeses[indiceMes]}</div>
                      <div className="text-xs text-gray-500 mt-1">{totalMes} evento(s)</div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Legenda de cores de viagem */}
            {intervalosViagem.length > 0 && filtroPeriodo !== "ano" && (
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Viagens:</span>
                {Array.from(corPorCliente.entries()).map(([nome, idx]) => {
                  const cor = PALETA_CLIENTES[idx];
                  return (
                    <button
                      key={nome}
                      type="button"
                      onClick={() => setModalViagemCliente(nome)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border transition-colors hover:opacity-80 ${cor.bg} ${cor.border} ${cor.text}`}
                      title={`Ver calendário de viagem de ${nome}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${cor.dot} flex-shrink-0`} />
                      {nome}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
          )}
        </Card>

        {/* Painéis inferiores em coluna */}
        <div className="space-y-6">
          {/* Eventos do dia selecionado */}
          <Card className={cardStates.eventosDia ? "h-16 overflow-hidden" : ""}>
            <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => toggleCardState('eventosDia')}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {diaSelecionado ? formatarData(diaSelecionado) : "Selecione um dia"}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); abrirNovo(); }} className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors" title="Adicionar evento"><Plus className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); toggleCardState('eventosDia'); }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors" title="Minimizar/Maximizar">
                    {cardStates.eventosDia ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardHeader>
            {!cardStates.eventosDia && (
            <CardContent>
              {eventosSelecionados.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum evento neste dia.</p>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {eventosSelecionados.map(ev => {
                    const cfg = tipoConfig[ev.tipo];
                    return (
                      <div key={ev.id} className={`rounded-lg p-3 ${cfg.bg} flex items-start justify-between gap-2`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                            <span className={`text-xs font-semibold ${cfg.cor}`}>{ev.tipo}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800 truncate">{ev.titulo}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" />{ev.hora}</span>
                            {ev.cliente && <span className="flex items-center gap-1 text-xs text-gray-500"><User className="w-3 h-3" />{ev.cliente}</span>}
                            {ev.agente && <span className="flex items-center gap-1 text-xs text-gray-500"><User className="w-3 h-3" />{ev.agente}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => abrirEditar(ev)} className="p-1 rounded hover:bg-white/60 text-gray-500 hover:text-blue-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => excluir(ev.id)} className="p-1 rounded hover:bg-white/60 text-gray-500 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            )}
          </Card>

          {/* Eventos do período */}
          <Card className={cardStates.eventosPeriodo ? "h-16 overflow-hidden" : ""}>
            <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => toggleCardState('eventosPeriodo')}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Eventos do Período</CardTitle>
                  <p className="text-xs text-gray-500 mt-1">{tituloPeriodo}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleCardState('eventosPeriodo'); }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors" title="Minimizar/Maximizar">
                  {cardStates.eventosPeriodo ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </CardHeader>
            {!cardStates.eventosPeriodo && (
            <CardContent>
              {eventosDoPeriodo.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sem eventos no período selecionado.</p>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-scroll pr-1">
                  {eventosDoPeriodo.map(ev => {
                    const cfg = tipoConfig[ev.tipo];
                    return (
                      <div key={ev.id} onClick={() => setDiaSel(ev.data)} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{ev.titulo}</p>
                          <p className="text-xs text-gray-400">{formatarData(ev.data)} • {ev.hora}</p>
                        </div>
                        <Badge className={`text-[10px] px-1.5 py-0.5 ${cfg.bg} ${cfg.cor} border-0`}>{ev.tipo}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            )}
          </Card>

          {/* Próximos eventos */}
          <Card className={cardStates.proximosEventos ? "h-16 overflow-hidden" : ""}>
            <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => toggleCardState('proximosEventos')}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Próximos Eventos</CardTitle>
                <button onClick={(e) => { e.stopPropagation(); toggleCardState('proximosEventos'); }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors" title="Minimizar/Maximizar">
                  {cardStates.proximosEventos ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </CardHeader>
            {!cardStates.proximosEventos && (
            <CardContent>
              {proximosEventos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sem próximos eventos.</p>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-scroll pr-1">
                  {proximosEventos.map(ev => {
                    const cfg = tipoConfig[ev.tipo];
                    return (
                      <div key={ev.id} onClick={() => setDiaSel(ev.data)} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{ev.titulo}</p>
                          <p className="text-xs text-gray-400">{formatarData(ev.data)} • {ev.hora}</p>
                        </div>
                        <Badge className={`text-[10px] px-1.5 py-0.5 ${cfg.bg} ${cfg.cor} border-0`}>{ev.tipo}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Modal de calendário de viagem do cliente */}
      {modalViagemCliente && (() => {
        const clienteNome = modalViagemCliente;
        const idx = corPorCliente.get(clienteNome) ?? 0;
        const cor = PALETA_CLIENTES[idx];
        const intervalosCliente = intervalosViagem.filter(i => i.cliente === clienteNome);
        const orcamentosCliente = orcamentos.filter(o => o.cliente === clienteNome);

        // Determina o range total de todas as viagens do cliente
        const todasDatas = intervalosCliente.flatMap(i => [i.checkin, i.checkout].filter(Boolean) as string[]);
        if (todasDatas.length === 0) return null;
        todasDatas.sort();
        const primeiraData = fromDateStr(todasDatas[0]);
        const ultimaData   = fromDateStr(todasDatas[todasDatas.length - 1]);

        // Meses a exibir (do mês da primeira à última data)
        const mesesExibir: Array<{ ano: number; mes: number }> = [];
        let cur = new Date(primeiraData.getFullYear(), primeiraData.getMonth(), 1);
        const fim = new Date(ultimaData.getFullYear(), ultimaData.getMonth(), 1);
        while (cur <= fim) {
          mesesExibir.push({ ano: cur.getFullYear(), mes: cur.getMonth() });
          cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        }

        function statusViagem(dataStr: string) {
          for (const { checkin, checkout } of intervalosCliente) {
            if (!checkout) { if (dataStr === checkin) return "unico"; continue; }
            if (dataStr === checkin && dataStr === checkout) return "unico";
            if (dataStr === checkin)  return "checkin";
            if (dataStr === checkout) return "checkout";
            if (dataStr > checkin && dataStr < checkout) return "meio";
          }
          return null;
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModalViagemCliente(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full ${cor.dot}`} />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{clienteNome}</h3>
                    <p className="text-xs text-gray-500">{intervalosCliente.length} viagem(ns) cadastrada(s)</p>
                    {orcamentosCliente.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {orcamentosCliente.map(orc => (
                          <button
                            key={orc.id}
                            onClick={() => {
                              setModalViagemCliente(null);
                              setTimeout(() => {
                                window.location.href = '/financeiro/orcamentos';
                                // Store the editId in sessionStorage to retrieve after navigation
                                sessionStorage.setItem('editOrcamentoId', String(orc.id));
                              }, 50);
                            }}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors hover:opacity-80 ${cor.bg} ${cor.border} ${cor.text}`}
                            title="Abrir orçamento"
                          >
                            <ExternalLink className="w-3 h-3" />
                            #{orc.numero}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setModalViagemCliente(null)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Resumo dos intervalos */}
              <div className="flex flex-wrap gap-2 mb-5">
                {intervalosCliente.map((iv, i) => (
                  <span key={i} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${cor.bg} ${cor.border} ${cor.text}`}>
                    {formatarData(iv.checkin)}
                    {iv.checkout && iv.checkout !== iv.checkin ? ` → ${formatarData(iv.checkout)}` : ""}
                  </span>
                ))}
              </div>

              {/* Calendários mensais */}
              <div className={`grid gap-6 ${mesesExibir.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                {mesesExibir.map(({ ano, mes }) => {
                  const primeiroDia = new Date(ano, mes, 1).getDay();
                  const totalDias   = new Date(ano, mes + 1, 0).getDate();
                  return (
                    <div key={`${ano}-${mes}`}>
                      <p className="text-sm font-semibold text-gray-700 mb-2 text-center">
                        {nomeMeses[mes]} {ano}
                      </p>
                      <div className="grid grid-cols-7 mb-1">
                        {nomeDias.map(d => <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-0.5">{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-0.5">
                        {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e-${i}`} />)}
                        {Array.from({ length: totalDias }).map((_, i) => {
                          const dia     = i + 1;
                          const dataStr = `${ano}-${pad(mes + 1)}-${pad(dia)}`;
                          const sv      = statusViagem(dataStr);
                          const isHoje  = dataStr === toDateStr(hoje);
                          const bgDia   = sv ? `${cor.bg} ${cor.border}` : isHoje ? "bg-blue-50 border-blue-300" : "border-transparent";
                          return (
                            <button
                              key={dia}
                              type="button"
                              onClick={() => { setDiaSel(dataStr); aplicarDataBase(fromDateStr(dataStr)); setModalViagemCliente(null); }}
                              className={`flex flex-col items-center justify-center rounded-md min-h-[36px] text-xs font-medium border transition-colors hover:opacity-80 ${bgDia} ${sv ? cor.text : isHoje ? "text-blue-700" : "text-gray-700"}`}
                              title={sv === "checkin" || sv === "unico" ? "Check-in" : sv === "checkout" ? "Check-out" : sv === "meio" ? "Em viagem" : undefined}
                            >
                              {dia}
                              {sv && (
                                <span className="text-[8px] leading-none mt-0.5">
                                  {sv === "checkin" || sv === "unico" ? "▶" : sv === "checkout" ? "◀" : "·"}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legenda do modal */}
              <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-gray-100">
                <span className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`w-3 h-3 rounded-sm ${cor.bg} border ${cor.border} inline-block`} /> Check-in ▶
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`w-3 h-3 rounded-sm ${cor.bg} border ${cor.border} opacity-50 inline-block`} /> Período
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`w-3 h-3 rounded-sm ${cor.bg} border ${cor.border} inline-block`} /> Check-out ◀
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">{editandoId !== null ? "Editar Evento" : "Novo Evento"}</h3>
              <button onClick={fechar} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input id="titulo" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Título do evento" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <textarea id="descricao" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Detalhes do evento..." rows={2} className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="data">Data</Label><Input id="data" type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} className="mt-1" /></div>
                <div><Label htmlFor="hora">Hora</Label><Input id="hora" type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cliente">Cliente</Label>
                  <select
                    id="cliente"
                    value={form.cliente}
                    onChange={e => setForm({ ...form, cliente: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {clientes.filter((cliente) => cliente.status === "Ativo").map((cliente) => (
                      <option key={cliente.id} value={cliente.nome}>{cliente.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="agente">Agente</Label>
                  <select
                    id="agente"
                    value={form.agente}
                    onChange={e => setForm({ ...form, agente: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {funcionarios.map((funcionario) => (
                      <option key={funcionario.id} value={funcionario.name}>{funcionario.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label>Tipo</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {allTipos.map(t => {
                    const cfg  = tipoConfig[t];
                    const ativo = form.tipo === t;
                    return (
                      <button key={t} type="button" onClick={() => setForm({ ...form, tipo: t })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${ativo ? `${cfg.bg} ${cfg.cor} border-current` : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"}`}>
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />{t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={fechar}>Cancelar</Button>
              <Button onClick={salvar} disabled={salvando || !form.titulo.trim()} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                <Check className="w-4 h-4" />{editandoId !== null ? "Salvar" : "Criar Evento"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

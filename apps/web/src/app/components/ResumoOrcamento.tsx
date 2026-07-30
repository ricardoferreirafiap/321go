import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Plane, Bed, ShieldCheck, ShoppingCart, User, Mail, Share2, DollarSign, CalendarDays, Car, Utensils, Sparkles, Info, Users, Package2, MapPin, Clock, Hash, Link2, Building2, Phone, Tag, Ticket } from "lucide-react";
import { Button } from "./ui/button";
import { buscarOrcamentoPublico } from "../data/orcamentosApi";
// Tipos replicados de Orcamentos.tsx para consistência
interface ItemOrc {
  id: number;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  desconto: number;
}

interface Voo {
  id: number;
  companhia: string;
  numero: string;
  data: string;
  origem: string;
  destino: string;
  partida: string;
  chegada: string;
  duracao: string;
  documento: string | null;
  documentoTipo: "pdf" | "imagem" | null;
  documentoNome: string;
  linkVoo: string;
}

interface Hospedagem {
  id: number;
  nome: string;
  local: string;
  preco: number;
  checkin: string;
  checkout: string;
  noites: number;
}

interface Seguro {
  id: number;
  tipo: string;
  valor: number;
}

interface Transporte {
  id: number;
  tipo: string;
  origem: string;
  destino: string;
  valor: number;
}

interface Restaurante {
  id: number;
  nome: string;
  local: string;
  preco: number;
}

interface Experiencia {
  id: number;
  nome: string;
  local: string;
  preco: number;
}

interface Day {
  id: number;
  titulo: string;
  atividades: { id: number; hora: string; descricao: string }[];
}

interface Pacote {
  id: number;
  operador: string;
  ciaAerea?: string;
  origem?: string;
  destino?: string;
  reserva?: string;
  link?: string;
  descricao?: string;
  foto: string | null;
  valor?: number;
  dataIda?: string;
  dataVolta?: string;
  passageiros?: string;
  origemIda?: string;
  destinoIda?: string;
  duracaoIda?: string;
  horaSaidaIda?: string;
  horaChegadaIda?: string;
  origemVolta?: string;
  destinoVolta?: string;
  duracaoVolta?: string;
  horaSaidaVolta?: string;
  horaChegadaVolta?: string;
  politicaAlteracoesCancelamentos?: string;
  hospedagemNome?: string;
  hospedagemEndereco?: string;
  hospedagemTelefone?: string;
  hospedagemEmail?: string;
  hospedagemCheckin?: string;
  hospedagemCheckout?: string;
  hospedagemTipoQuarto?: string;
  hospedagemRegime?: string;
  hospedagemComodidades?: string;
  hospedagemPoliticasCondicoesInformacoesEspeciais?: string;
  hospedagemNoites?: string;
  hospedagemLink?: string;
  hospedagemFoto?: string | null;
  trasladoTipo?: string;
  trasladoData?: string;
  trasladoHorario?: string;
  trasladoLocalPartida?: string;
  trasladoLocalChegada?: string;
  trasladoVeiculoEmpresa?: string;
  trasladoObservacoes?: string;
  ingressoNomeAtracao?: string;
  ingressoData?: string;
  ingressoHorario?: string;
  ingressoQuantidade?: string;
  ingressoObservacoes?: string;
}

interface OrcamentoCompleto {
  numero: string;
  cliente: string;
  email: string;
  passageiros?: string[];
  status: string;
  pacotes?: Pacote[];
  voos?: Voo[];
  hospedagem?: Hospedagem[];
  seguro?: Seguro[];
  transporte?: Transporte[];
  restaurante?: Restaurante[];
  experiencias?: Experiencia[];
  roteiro?: string;
  dayByDay?: Day[];
  observacoes?: string;
  itens: ItemOrc[]; // Itens de Venda
}

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcItem(item: ItemOrc) {
  const bruto = item.quantidade * item.valorUnitario;
  const desc = bruto * (item.desconto / 100);
  return bruto - desc;
}

function fmtData(iso?: string) {
  if (!iso) return "";
  try { return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR"); } catch { return iso; }
}

export default function ResumoOrcamento() {
  const { numero } = useParams<{ numero: string }>();
  const [orcamento, setOrcamento] = useState<OrcamentoCompleto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function carregarOrcamento() {
      if (!numero) {
        if (active) {
          setOrcamento(null);
          setErroCarregamento("Número do orçamento não informado.");
          setCarregando(false);
        }
        return;
      }

      setCarregando(true);
      setErroCarregamento(null);

      try {
        const orcamentoApi = await buscarOrcamentoPublico(numero);
        if (active) {
          setOrcamento(orcamentoApi);
          setCarregando(false);
        }
        return;
      } catch (error) {
        const dados = localStorage.getItem(`orc_${numero}`);

        if (dados) {
          try {
            const parsed = JSON.parse(dados);
            if (active) {
              setOrcamento(parsed);
              setCarregando(false);
            }
            return;
          } catch {
            // segue para o estado de erro abaixo
          }
        }

        if (active) {
          setOrcamento(null);
          setErroCarregamento(error instanceof Error ? error.message : "Resumo não disponível no momento.");
          setCarregando(false);
        }
      }
    }

    carregarOrcamento();

    return () => {
      active = false;
    };
  }, [numero]);

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-700">Carregando resumo...</h1>
          <p className="text-gray-500 mt-2">Aguardando os dados do orçamento.</p>
        </div>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-700">Resumo indisponível</h1>
          <p className="text-gray-500 mt-2">{erroCarregamento || "Não foi possível carregar o orçamento deste link."}</p>
        </div>
      </div>
    );
  }

  const itensVendaAdicionados = (orcamento.itens || []).filter((item) => item.descricao?.trim());
  const totalVendas = itensVendaAdicionados.reduce((acc, i) => acc + calcItem(i), 0);
  const totalPacotes = orcamento.pacotes?.reduce((acc, p) => acc + (Number(p.valor) || 0), 0) || 0;
  const totalHospedagem = orcamento.hospedagem?.reduce((acc, h) => acc + (h.preco || 0), 0) || 0;
  const totalSeguro = orcamento.seguro?.reduce((acc, s) => acc + (s.valor || 0), 0) || 0;
  const totalTransporte = orcamento.transporte?.reduce((acc, t) => acc + (t.valor || 0), 0) || 0;
  const totalRestaurante = orcamento.restaurante?.reduce((acc, r) => acc + (r.preco || 0), 0) || 0;
  const totalExperiencias = orcamento.experiencias?.reduce((acc, e) => acc + (e.preco || 0), 0) || 0;
  const pacoteDestaque = (orcamento.pacotes || []).find((item) => Boolean(item?.foto)) || (orcamento.pacotes || [])[0] || null;

  const totalGeral = totalPacotes + totalVendas + totalHospedagem + totalSeguro + totalTransporte + totalRestaurante + totalExperiencias;

  const handleShareWhatsApp = () => {
    if (!orcamento) return;
    const message = `Olá! Aqui está o resumo do seu orçamento:\n\nCliente: ${orcamento.cliente}\nOrçamento: ${orcamento.numero}\n\nVisite: ${window.location.href}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <main className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Resumo do Orçamento</h1>
          <p className="text-lg text-indigo-600 font-mono mt-1">{orcamento.numero}</p>
        </div>

        {pacoteDestaque?.foto && (
          <Card className="mb-6 overflow-hidden">
            <img
              src={pacoteDestaque.foto}
              alt="Foto do pacote"
              className="h-64 w-full object-cover sm:h-80"
            />
            {(pacoteDestaque.origem || pacoteDestaque.destino) && (
              <CardContent className="p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Origem:</span> {pacoteDestaque.origem || "-"}
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="font-semibold">Destino:</span> {pacoteDestaque.destino || "-"}
                </p>
              </CardContent>
            )}
          </Card>
        )}

        <Card className="mb-6 p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-indigo-500" />
              <span>Dados do Cliente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="font-semibold text-gray-900">{orcamento.cliente}</p>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Mail className="w-4 h-4" /> {orcamento.email}
            </p>
          </CardContent>
        </Card>

        {Array.isArray(orcamento.passageiros) && orcamento.passageiros.length > 0 && (
          <Card className="mb-6 p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="w-5 h-5 text-indigo-500" />
                <span>Passageiros</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-wrap gap-2">
                {orcamento.passageiros.map((nome) => (
                  <span key={nome} className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700 border border-indigo-100">
                    {nome}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Pacotes / Vouchers */}
          {orcamento.pacotes && orcamento.pacotes.length > 0 && (
            <div className="space-y-4">
              {orcamento.pacotes.map((p, idx) => (
                <Card key={p.id ?? idx} className="overflow-hidden">
                  {/* Foto do pacote */}
                  {p.hospedagemFoto && (
                    <img src={p.hospedagemFoto} alt={p.hospedagemNome || "Hospedagem"} className="h-48 w-full object-cover" />
                  )}
                  {!p.hospedagemFoto && p.foto && (
                    <img src={p.foto} alt="Pacote" className="h-48 w-full object-cover" />
                  )}

                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package2 className="w-5 h-5 text-indigo-500" />
                      <span>{p.operador || "Pacote"}</span>
                      {p.reserva && (
                        <span className="ml-auto text-xs font-normal bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2 py-0.5 flex items-center gap-1">
                          <Hash className="w-3 h-3" /> Reserva: {p.reserva}
                        </span>
                      )}
                    </CardTitle>
                    {(p.origem || p.destino) && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {p.origem && <span>{p.origem}</span>}
                        {p.origem && p.destino && <span className="mx-1">→</span>}
                        {p.destino && <span>{p.destino}</span>}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    {/* Valor */}
                    {p.valor != null && Number(p.valor) > 0 && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                        <DollarSign className="w-4 h-4" />
                        {moeda(Number(p.valor))}
                      </div>
                    )}

                    {/* Passageiros */}
                    {p.passageiros?.trim() && (
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <Users className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                        <span>{p.passageiros}</span>
                      </div>
                    )}

                    {/* Voo de Ida */}
                    {(p.origemIda || p.destinoIda || p.dataIda || p.ciaAerea) && (
                      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 space-y-1">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1">
                          <Plane className="w-3.5 h-3.5" /> Voo de Ida
                        </p>
                        {p.ciaAerea && <p className="text-sm text-gray-700">{p.ciaAerea}</p>}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                          {(p.origemIda || p.destinoIda) && (
                            <span>{p.origemIda || "?"} → {p.destinoIda || "?"}</span>
                          )}
                          {p.dataIda && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{fmtData(p.dataIda)}</span>}
                        </div>
                        {(p.horaSaidaIda || p.horaChegadaIda || p.duracaoIda) && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            {p.horaSaidaIda && <span>Partida: <strong>{p.horaSaidaIda}</strong></span>}
                            {p.horaChegadaIda && <span>Chegada: <strong>{p.horaChegadaIda}</strong></span>}
                            {p.duracaoIda && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.duracaoIda}</span>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Voo de Volta */}
                    {(p.origemVolta || p.destinoVolta || p.dataVolta) && (
                      <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 space-y-1">
                        <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide flex items-center gap-1">
                          <Plane className="w-3.5 h-3.5 rotate-180" /> Voo de Volta
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                          {(p.origemVolta || p.destinoVolta) && (
                            <span>{p.origemVolta || "?"} → {p.destinoVolta || "?"}</span>
                          )}
                          {p.dataVolta && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{fmtData(p.dataVolta)}</span>}
                        </div>
                        {(p.horaSaidaVolta || p.horaChegadaVolta || p.duracaoVolta) && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            {p.horaSaidaVolta && <span>Partida: <strong>{p.horaSaidaVolta}</strong></span>}
                            {p.horaChegadaVolta && <span>Chegada: <strong>{p.horaChegadaVolta}</strong></span>}
                            {p.duracaoVolta && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.duracaoVolta}</span>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hospedagem do Pacote */}
                    {p.hospedagemNome?.trim() && (
                      <div className="rounded-lg border border-purple-100 bg-purple-50 p-3 space-y-1">
                        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5" /> Hospedagem
                        </p>
                        <p className="text-sm font-medium text-gray-800">{p.hospedagemNome}</p>
                        {p.hospedagemEndereco?.trim() && (
                          <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{p.hospedagemEndereco}</p>
                        )}
                        {(p.hospedagemTelefone?.trim() || p.hospedagemEmail?.trim()) && (
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                            {p.hospedagemTelefone?.trim() && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.hospedagemTelefone}</span>}
                            {p.hospedagemEmail?.trim() && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.hospedagemEmail}</span>}
                          </div>
                        )}
                        {(p.hospedagemCheckin || p.hospedagemCheckout) && (
                          <p className="text-xs text-gray-600">
                            Check-in: <strong>{fmtData(p.hospedagemCheckin)}</strong>
                            {p.hospedagemCheckout && <> → Check-out: <strong>{fmtData(p.hospedagemCheckout)}</strong></>}
                            {p.hospedagemNoites?.trim() && <span className="ml-1 text-gray-400">({p.hospedagemNoites} noites)</span>}
                          </p>
                        )}
                        {(p.hospedagemTipoQuarto?.trim() || p.hospedagemRegime?.trim()) && (
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-600">
                            {p.hospedagemTipoQuarto?.trim() && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> Quarto: {p.hospedagemTipoQuarto}</span>}
                            {p.hospedagemRegime?.trim() && <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Regime: {p.hospedagemRegime}</span>}
                          </div>
                        )}
                        {p.hospedagemComodidades?.trim() && (
                          <p className="text-xs text-gray-500 mt-1">{p.hospedagemComodidades}</p>
                        )}
                        {p.hospedagemLink?.trim() && (
                          <a href={p.hospedagemLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-1">
                            <Link2 className="w-3 h-3" /> Ver hospedagem
                          </a>
                        )}
                        {p.hospedagemPoliticasCondicoesInformacoesEspeciais?.trim() && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Políticas e condições</summary>
                            <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{p.hospedagemPoliticasCondicoesInformacoesEspeciais}</p>
                          </details>
                        )}
                      </div>
                    )}

                    {/* Traslado */}
                    {(p.trasladoTipo?.trim() || p.trasladoLocalPartida?.trim() || p.trasladoLocalChegada?.trim()) && (
                      <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3 space-y-1">
                        <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide flex items-center gap-1">
                          <Car className="w-3.5 h-3.5" /> Traslado
                        </p>
                        {p.trasladoTipo?.trim() && <p className="text-sm text-gray-700">{p.trasladoTipo}</p>}
                        {(p.trasladoLocalPartida?.trim() || p.trasladoLocalChegada?.trim()) && (
                          <p className="text-sm text-gray-600">{p.trasladoLocalPartida || "?"} → {p.trasladoLocalChegada || "?"}</p>
                        )}
                        {(p.trasladoData?.trim() || p.trasladoHorario?.trim()) && (
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                            {p.trasladoData?.trim() && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{fmtData(p.trasladoData)}</span>}
                            {p.trasladoHorario?.trim() && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.trasladoHorario}</span>}
                          </div>
                        )}
                        {p.trasladoVeiculoEmpresa?.trim() && (
                          <p className="text-xs text-gray-500">{p.trasladoVeiculoEmpresa}</p>
                        )}
                        {p.trasladoObservacoes?.trim() && (
                          <p className="text-xs text-gray-500 italic">{p.trasladoObservacoes}</p>
                        )}
                      </div>
                    )}

                    {/* Ingresso */}
                    {p.ingressoNomeAtracao?.trim() && (
                      <div className="rounded-lg border border-pink-100 bg-pink-50 p-3 space-y-1">
                        <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5" /> Ingresso
                        </p>
                        <p className="text-sm font-medium text-gray-800">{p.ingressoNomeAtracao}</p>
                        {(p.ingressoData?.trim() || p.ingressoHorario?.trim()) && (
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                            {p.ingressoData?.trim() && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{fmtData(p.ingressoData)}</span>}
                            {p.ingressoHorario?.trim() && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.ingressoHorario}</span>}
                          </div>
                        )}
                        {p.ingressoQuantidade?.trim() && (
                          <p className="text-xs text-gray-500">Quantidade: {p.ingressoQuantidade}</p>
                        )}
                        {p.ingressoObservacoes?.trim() && (
                          <p className="text-xs text-gray-500 italic">{p.ingressoObservacoes}</p>
                        )}
                      </div>
                    )}

                    {/* Descrição livre */}
                    {p.descricao?.trim() && (
                      <ul className="text-sm text-gray-600 border-t pt-3 mt-1 space-y-1 list-disc list-inside">
                        {p.descricao
                          .split(".")
                          .map((trecho) => trecho.trim())
                          .filter(Boolean)
                          .map((trecho, i) => (
                            <li key={i}>{trecho}.</li>
                          ))}
                      </ul>
                    )}

                    {/* Políticas gerais de alteração/cancelamento */}
                    {p.politicaAlteracoesCancelamentos?.trim() && (
                      <details className="mt-1">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 flex items-center gap-1">
                          <Info className="w-3 h-3" /> Políticas de alteração e cancelamento
                        </summary>
                        <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{p.politicaAlteracoesCancelamentos}</p>
                      </details>
                    )}

                    {/* Link do pacote */}
                    {p.link?.trim() && (
                      <a href={p.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                        <Link2 className="w-3 h-3" /> Ver pacote completo
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {/* Voos */}
          {orcamento.voos && orcamento.voos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Plane className="text-blue-500" /> Voos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                  {orcamento.voos.map(voo => (
                    <div key={voo.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{voo.companhia} {voo.numero}</p>
                          <p className="text-sm text-gray-600">{voo.origem} → {voo.destino}</p>
                        </div>
                        <span className="text-xs font-medium text-gray-500">{new Date(voo.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                        <span>Partida: <span className="font-semibold text-gray-700">{voo.partida}</span></span>
                        <span>Chegada: <span className="font-semibold text-gray-700">{voo.chegada}</span></span>
                        <span className="font-semibold text-gray-700">({voo.duracao})</span>
                      </div>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
          )}

          {/* Hospedagem */}
          {orcamento.hospedagem && orcamento.hospedagem.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Bed className="text-purple-500" /> Hospedagem</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                  {orcamento.hospedagem.map(h => (
                    <div key={h.id} className="p-2 bg-gray-50 rounded">
                      <span className="font-medium">{h.nome} - {h.local}</span>
                      <p className="text-xs text-gray-500 mt-1">{new Date(h.checkin + 'T00:00:00').toLocaleDateString('pt-BR')} → {new Date(h.checkout + 'T00:00:00').toLocaleDateString('pt-BR')} ({h.noites} noites)</p>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
          )}

          {/* Seguro */}
          {orcamento.seguro && orcamento.seguro.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><ShieldCheck className="text-green-500" /> Seguro</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                  {orcamento.seguro.map(s => (
                    <div key={s.id} className="p-2 bg-gray-50 rounded">
                      <span>{s.tipo}</span>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
          )}

          {/* Day by Day */}
          {orcamento.dayByDay && orcamento.dayByDay.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="text-purple-500" /> Dia a Dia</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {orcamento.dayByDay.map(dia => (
                  <div key={dia.id} className="p-2 bg-gray-50 rounded">
                    <p className="font-semibold text-sm text-gray-800">{dia.titulo}</p>
                    <ul className="list-disc list-inside pl-2 mt-1 text-xs text-gray-600 space-y-1">
                      {dia.atividades.map(atv => (
                        <li key={atv.id}>{atv.hora && `${atv.hora} - `}{atv.descricao}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Transporte */}
          {orcamento.transporte && orcamento.transporte.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Car className="text-yellow-500" /> Transporte</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                  {orcamento.transporte.map(t => (
                    <div key={t.id} className="p-2 bg-gray-50 rounded">
                      <span>{t.tipo}: {t.origem} → {t.destino}</span>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
          )}

          {/* Restaurantes */}
          {orcamento.restaurante && orcamento.restaurante.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Utensils className="text-red-500" /> Restaurantes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                  {orcamento.restaurante.map(r => (
                    <div key={r.id} className="p-2 bg-gray-50 rounded">
                      <span>{r.nome} - {r.local}</span>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
          )}

          {/* Experiências */}
          {orcamento.experiencias && orcamento.experiencias.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Sparkles className="text-pink-500" /> Experiências</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                  {orcamento.experiencias.map(e => (
                    <div key={e.id} className="p-2 bg-gray-50 rounded">
                      <span>{e.nome} - {e.local}</span>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
          )}

          {/* Vendas */}
          {itensVendaAdicionados.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="text-orange-500" /> Vendas</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                  {itensVendaAdicionados.map(item => (
                    <div key={item.id} className="p-2 bg-gray-50 rounded">
                      {item.descricao}
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
          )}
        </div>

        {/* Observações */}
        {orcamento.observacoes && (
          <Card className="mt-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Info className="text-amber-500" /> Observações</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-gray-600 whitespace-pre-wrap">{orcamento.observacoes}</p></CardContent>
          </Card>
        )}

        {/* Total Geral */}
        <Card className="mt-8 bg-indigo-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl">
              <span className="flex items-center gap-2"><DollarSign className="text-indigo-500" /> Valor Total da Viagem</span>
              <span className="text-2xl font-bold text-indigo-700">{moeda(totalGeral)}</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="mt-8 flex gap-2 print:hidden">
          <Button onClick={() => window.print()} className="flex-1">
            Imprimir
          </Button>
          <Button onClick={handleShareWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
            <Share2 className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
        </div>
      </main>
    </div>
  );
}
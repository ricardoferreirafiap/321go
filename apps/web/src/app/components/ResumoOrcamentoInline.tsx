import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Plane, Bed, ShieldCheck, ShoppingCart, User, Mail, Share2, DollarSign, CalendarDays, Car, Utensils, Sparkles, Info, Users, Package2, MapPin, Clock, Hash, Link2, Building2, Phone, Tag, Ticket, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import { type Orcamento } from "../data/orcamentosApi";

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
  valor?: number;
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
  hospedagemValor?: number;
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

interface ResumoOrcamentoInlineProps {
  orcamento: Orcamento;
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

export default function ResumoOrcamentoInline({ orcamento }: ResumoOrcamentoInlineProps) {
  const [expandido, setExpandido] = useState<Record<string, boolean>>({
    pacotes: true,
    voos: true,
    hospedagem: true,
    seguro: true,
    transporte: true,
    restaurante: true,
    experiencias: true,
    vendas: true,
  });

  function toggleSecao(secao: string) {
    setExpandido(prev => ({ ...prev, [secao]: !prev[secao] }));
  }

  const itensVendaAdicionados = (orcamento.itens || []).filter((item: any) => item.descricao?.trim() && item.valorUnitario > 0);
  const totalVendas = itensVendaAdicionados.reduce((acc: number, i: ItemOrc) => acc + calcItem(i), 0);
  const totalVoos = (orcamento.voos as any)?.reduce((acc: number, v: Voo) => acc + (v.valor || 0), 0) || 0;
  const totalPacotes = (orcamento.pacotes as any)?.reduce((acc: number, p: Pacote) => {
    const valorPacote = Number(p.valor) || 0;
    const valorHospedagem = Number(p.hospedagemValor) || 0;
    return acc + valorPacote + valorHospedagem;
  }, 0) || 0;
  const totalHospedagem = (orcamento.hospedagem as any)?.reduce((acc: number, h: Hospedagem) => acc + (h.preco || 0), 0) || 0;
  const totalSeguro = (orcamento.seguro as any)?.reduce((acc: number, s: Seguro) => acc + (s.valor || 0), 0) || 0;
  const totalTransporte = (orcamento.transporte as any)?.reduce((acc: number, t: Transporte) => acc + (t.valor || 0), 0) || 0;
  const totalRestaurante = (orcamento.restaurante as any)?.reduce((acc: number, r: Restaurante) => acc + (r.preco || 0), 0) || 0;
  const totalExperiencias = (orcamento.experiencias as any)?.reduce((acc: number, e: Experiencia) => acc + (e.preco || 0), 0) || 0;

  const totalGeral = totalPacotes + totalVoos + totalVendas + totalHospedagem + totalSeguro + totalTransporte + totalRestaurante + totalExperiencias;

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h4 className="text-lg font-bold text-gray-800">Resumo do Orçamento</h4>
        <p className="text-sm text-indigo-600 font-mono mt-1">{orcamento.numero}</p>
      </div>

      <Card className="p-4">
        <CardHeader className="p-0 mb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4 text-indigo-500" />
            <span>Dados do Cliente</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <p className="font-semibold text-gray-900 text-sm">{orcamento.cliente}</p>
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <Mail className="w-3 h-3" /> {orcamento.email}
          </p>
        </CardContent>
      </Card>

      {Array.isArray(orcamento.passageiros) && orcamento.passageiros.length > 0 && (
        <Card className="p-4">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Passageiros</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-wrap gap-2">
              {orcamento.passageiros.map((nome: string) => (
                <span key={nome} className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 border border-indigo-100">
                  {nome}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {/* Pacotes / Vouchers */}
        {(orcamento.pacotes as any) && (orcamento.pacotes as Pacote[]).length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => toggleSecao("pacotes")}
              className="w-full flex items-center justify-between px-3 py-2 bg-white rounded border shadow-sm hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
                <Package2 className="w-4 h-4 text-indigo-500" /> Pacotes / Vouchers
              </span>
              <div className="flex items-center gap-2">
                {totalPacotes > 0 && (
                  <span className="text-sm font-semibold text-indigo-700">{moeda(totalPacotes)}</span>
                )}
                {expandido.pacotes ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {expandido.pacotes && (orcamento.pacotes as Pacote[]).map((p, idx) => (
              <Card key={p.id ?? idx} className="overflow-hidden p-3">
                <CardHeader className="pb-2 p-0">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Package2 className="w-4 h-4 text-indigo-500" />
                    <span>{p.operador || "Pacote"}</span>
                    {p.reserva && (
                      <span className="ml-auto text-xs font-normal bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2 py-0.5 flex items-center gap-1">
                        <Hash className="w-3 h-3" /> Reserva: {p.reserva}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-2 p-0">
                  {p.valor != null && Number(p.valor) > 0 && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                      <DollarSign className="w-3 h-3" />
                      {moeda(Number(p.valor))}
                    </div>
                  )}
                  {p.descricao?.trim() && (
                    <p className="text-xs text-gray-600">{p.descricao}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Voos */}
        {(orcamento.voos as any) && (orcamento.voos as Voo[]).length > 0 && (orcamento.voos as Voo[]).some((v: Voo) => (v.valor ?? 0) > 0) && (
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg p-3"
              onClick={() => toggleSecao("voos")}
            >
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Plane className="text-blue-500 w-4 h-4" /> Voos</span>
                <div className="flex items-center gap-2">
                  {totalVoos > 0 && <span className="text-sm font-semibold text-blue-700">{moeda(totalVoos)}</span>}
                  {expandido.voos ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </CardTitle>
            </CardHeader>
            {expandido.voos && (
              <CardContent className="p-3">
                <div className="space-y-2 text-sm">
                  {(orcamento.voos as Voo[]).map(voo => (
                    <div key={voo.id} className="p-2 bg-gray-50 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{voo.companhia} {voo.numero}</p>
                          <p className="text-xs text-gray-600">{voo.origem} → {voo.destino}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-gray-500 block">{new Date(voo.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                          {(voo.valor ?? 0) > 0 && <span className="text-sm font-semibold text-gray-800">{moeda(voo.valor!)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Hospedagem */}
        {(orcamento.hospedagem as any) && (orcamento.hospedagem as Hospedagem[]).length > 0 && (orcamento.hospedagem as Hospedagem[]).some((h: Hospedagem) => h.preco > 0) && (
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg p-3"
              onClick={() => toggleSecao("hospedagem")}
            >
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Bed className="text-purple-500 w-4 h-4" /> Hospedagem</span>
                <div className="flex items-center gap-2">
                  {totalHospedagem > 0 && <span className="text-sm font-semibold text-purple-700">{moeda(totalHospedagem)}</span>}
                  {expandido.hospedagem ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </CardTitle>
            </CardHeader>
            {expandido.hospedagem && (
              <CardContent className="p-3">
                <div className="space-y-2 text-sm">
                  {(orcamento.hospedagem as Hospedagem[]).map(h => (
                    <div key={h.id} className="p-2 bg-gray-50 rounded">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-gray-900 text-sm">{h.nome}</span>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {h.local}
                          </p>
                        </div>
                        {h.preco > 0 && <span className="text-sm font-semibold text-purple-700 whitespace-nowrap">{moeda(h.preco)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Seguro */}
        {(orcamento.seguro as any) && (orcamento.seguro as Seguro[]).length > 0 && (orcamento.seguro as Seguro[]).some((s: Seguro) => s.valor > 0) && (
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg p-3"
              onClick={() => toggleSecao("seguro")}
            >
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><ShieldCheck className="text-green-500 w-4 h-4" /> Seguro</span>
                <div className="flex items-center gap-2">
                  {totalSeguro > 0 && <span className="text-sm font-semibold text-green-700">{moeda(totalSeguro)}</span>}
                  {expandido.seguro ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </CardTitle>
            </CardHeader>
            {expandido.seguro && (
              <CardContent className="p-3">
                <div className="space-y-2 text-sm">
                  {(orcamento.seguro as Seguro[]).map(s => (
                    <div key={s.id} className="p-2 bg-gray-50 rounded flex items-center justify-between gap-2">
                      <span className="text-sm">{s.tipo}</span>
                      {s.valor > 0 && <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{moeda(s.valor)}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Transporte */}
        {(orcamento.transporte as any) && (orcamento.transporte as Transporte[]).length > 0 && (orcamento.transporte as Transporte[]).some((t: Transporte) => t.valor > 0) && (
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg p-3"
              onClick={() => toggleSecao("transporte")}
            >
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Car className="text-yellow-500 w-4 h-4" /> Transporte</span>
                <div className="flex items-center gap-2">
                  {totalTransporte > 0 && <span className="text-sm font-semibold text-yellow-700">{moeda(totalTransporte)}</span>}
                  {expandido.transporte ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </CardTitle>
            </CardHeader>
            {expandido.transporte && (
              <CardContent className="p-3">
                <div className="space-y-2 text-sm">
                  {(orcamento.transporte as Transporte[]).map(t => (
                    <div key={t.id} className="p-2 bg-gray-50 rounded flex items-center justify-between gap-2">
                      <span className="text-sm">{t.tipo}: {t.origem} → {t.destino}</span>
                      {t.valor > 0 && <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{moeda(t.valor)}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Restaurantes */}
        {(orcamento.restaurante as any) && (orcamento.restaurante as Restaurante[]).length > 0 && (orcamento.restaurante as Restaurante[]).some((r: Restaurante) => r.preco > 0) && (
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg p-3"
              onClick={() => toggleSecao("restaurante")}
            >
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Utensils className="text-red-500 w-4 h-4" /> Restaurantes</span>
                <div className="flex items-center gap-2">
                  {totalRestaurante > 0 && <span className="text-sm font-semibold text-red-700">{moeda(totalRestaurante)}</span>}
                  {expandido.restaurante ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </CardTitle>
            </CardHeader>
            {expandido.restaurante && (
              <CardContent className="p-3">
                <div className="space-y-2 text-sm">
                  {(orcamento.restaurante as Restaurante[]).map(r => (
                    <div key={r.id} className="p-2 bg-gray-50 rounded flex items-center justify-between gap-2">
                      <span className="text-sm">{r.nome} - {r.local}</span>
                      {r.preco > 0 && <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{moeda(r.preco)}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Experiências */}
        {(orcamento.experiencias as any) && (orcamento.experiencias as Experiencia[]).length > 0 && (orcamento.experiencias as Experiencia[]).some((e: Experiencia) => e.preco > 0) && (
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg p-3"
              onClick={() => toggleSecao("experiencias")}
            >
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Sparkles className="text-pink-500 w-4 h-4" /> Experiências</span>
                <div className="flex items-center gap-2">
                  {totalExperiencias > 0 && <span className="text-sm font-semibold text-pink-700">{moeda(totalExperiencias)}</span>}
                  {expandido.experiencias ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </CardTitle>
            </CardHeader>
            {expandido.experiencias && (
              <CardContent className="p-3">
                <div className="space-y-2 text-sm">
                  {(orcamento.experiencias as Experiencia[]).map(e => (
                    <div key={e.id} className="p-2 bg-gray-50 rounded flex items-center justify-between gap-2">
                      <span className="text-sm">{e.nome} - {e.local}</span>
                      {e.preco > 0 && <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{moeda(e.preco)}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Vendas */}
        {itensVendaAdicionados.length > 0 && (
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg p-3"
              onClick={() => toggleSecao("vendas")}
            >
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><ShoppingCart className="text-orange-500 w-4 h-4" /> Vendas</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-orange-700">{moeda(totalVendas)}</span>
                  {expandido.vendas ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </CardTitle>
            </CardHeader>
            {expandido.vendas && (
              <CardContent className="p-3">
                <div className="space-y-2 text-sm">
                  {itensVendaAdicionados.map((item: ItemOrc) => {
                    const subtotal = calcItem(item);
                    return (
                      <div key={item.id} className="p-2 bg-gray-50 rounded flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{item.descricao}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.quantidade} {item.unidade} × {moeda(item.valorUnitario)}
                            {item.desconto > 0 && (
                              <span className="ml-2 text-green-600">− {item.desconto}% desc.</span>
                            )}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{moeda(subtotal)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>

      {/* Total Geral */}
      <Card className="bg-indigo-50 border-indigo-200 p-3">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><DollarSign className="text-indigo-500 w-4 h-4" /> Valor Total</span>
            <span className="text-lg font-bold text-indigo-700">{moeda(totalGeral)}</span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Botões de ação */}
      <div className="flex gap-2">
        <Button onClick={() => window.print()} className="flex-1" variant="outline">
          Imprimir
        </Button>
        <Button onClick={() => {
          const message = `Olá! Aqui está o resumo do seu orçamento:\n\nCliente: ${orcamento.cliente}\nOrçamento: ${orcamento.numero}\n\nTotal: ${moeda(totalGeral)}`;
          const encodedMessage = encodeURIComponent(message);
          window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
        }} className="flex-1 bg-green-600 hover:bg-green-700">
          <Share2 className="w-4 h-4 mr-2" /> WhatsApp
        </Button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Eye, Edit2, Trash2, Plus, FileText, ChevronRight, MapPin } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router";
import { listarOrcamentos, type ItemOrc, type Orcamento } from "../data/orcamentosApi";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Aprovado":
      return "bg-green-100 text-green-800";
    case "Enviado":
      return "bg-blue-100 text-blue-800";
    case "Rascunho":
      return "bg-gray-100 text-gray-800";
    case "Rejeitado":
      return "bg-red-100 text-red-800";
    case "Cancelado":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const calcularTotal = (itens: ItemOrc[]) => {
  return itens.reduce((acc, item) => {
    const subtotal = item.quantidade * item.valorUnitario;
    const desconto = (subtotal * item.desconto) / 100;
    return acc + (subtotal - desconto);
  }, 0);
};

export default function ResumoOrcamentos() {
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [expandidos, setExpandidos] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setErro(null);
      try {
        const lista = await listarOrcamentos();
        setOrcamentos(lista);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro ao carregar orçamentos.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandidos((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const gerarRoteiro = (orc: Orcamento) => {
    localStorage.setItem(`orc_${orc.numero}`, JSON.stringify(orc));
    window.open(`/financeiro/orcamentos/roteiro/${orc.publicToken || orc.numero}`, "_blank");
  };

  const abrirOrcamento = (orc: Orcamento) => {
    localStorage.setItem(`orc_${orc.numero}`, JSON.stringify(orc));
    window.open(`/financeiro/orcamentos/resumo/${orc.publicToken || orc.numero}`, "_blank");
  };

  const orcamentosRecentes = orcamentos.slice(0, 3);

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-8 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600 flex-shrink-0" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Orçamentos Recentes</h2>
        </div>
        <Button
          onClick={() => navigate("/financeiro/orcamentos")}
          className="gap-2 w-full sm:w-auto text-sm sm:text-base py-2 h-9 sm:h-10"
        >
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      {erro && <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      {carregando && <p className="text-sm text-gray-500">Carregando orçamentos...</p>}

      <div className="space-y-3">
        {orcamentosRecentes.map((orcamento) => (
          <Card key={orcamento.id} className="p-3 sm:p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900">{orcamento.numero}</h3>
                  <Badge className={`${getStatusColor(orcamento.status)} text-xs`}>
                    {orcamento.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                  <div>
                    <p className="font-medium text-gray-700 text-xs">Cliente</p>
                    <p className="truncate">{orcamento.cliente}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 text-xs">Data</p>
                    <p>{new Date(orcamento.dataCriacao).toLocaleDateString("pt-BR", { 
                      month: "2-digit", 
                      day: "2-digit" 
                    })}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 text-xs">Validade</p>
                    <p>{new Date(orcamento.dataValidade).toLocaleDateString("pt-BR", { 
                      month: "2-digit", 
                      day: "2-digit" 
                    })}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 text-xs">Total</p>
                    <p className="font-semibold text-purple-600 text-xs">
                      R$ {calcularTotal(orcamento.itens).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                {expandidos.includes(orcamento.id) && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-medium text-gray-700 mb-2">Itens:</p>
                    <div className="space-y-1 text-xs">
                      {orcamento.itens.filter(item => item.valorUnitario > 0).map((item) => (
                        <div key={item.id} className="flex justify-between text-gray-600">
                          <span className="flex-1">
                            {item.quantidade} {item.unidade} de {item.descricao}
                          </span>
                          <span className="font-medium ml-2 flex-shrink-0">
                            R${" "}
                            {(
                              item.quantidade *
                              item.valorUnitario *
                              (1 - item.desconto / 100)
                            ).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                    {orcamento.observacoes && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs">
                          <span className="font-medium text-gray-700">Obs:</span>{" "}
                          {orcamento.observacoes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0 self-start md:self-center flex-wrap justify-end">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleExpand(orcamento.id)}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  title={expandidos.includes(orcamento.id) ? "Recolher" : "Expandir"}
                >
                  {expandidos.includes(orcamento.id) ? (
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  title="Orçamento"
                  onClick={() => abrirOrcamento(orcamento)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  title="Editar"
                  onClick={() => navigate("/financeiro/orcamentos", { state: { editId: orcamento.id } })}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 text-green-600 hover:text-green-700"
                  title="Roteiro"
                  onClick={() => gerarRoteiro(orcamento)}
                >
                  <MapPin className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 text-red-600 hover:text-red-700"
                  title="Deletar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full mt-4 gap-2 text-sm sm:text-base py-2 h-9 sm:h-10"
        onClick={() => navigate("/financeiro/orcamentos")}
      >
        Ver todos os orçamentos
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

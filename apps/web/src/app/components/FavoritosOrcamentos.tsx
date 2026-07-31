import { useState, useEffect } from "react";
import { Star, PanelRightClose, FileText, ExternalLink } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router";
import { listarOrcamentos, type ItemOrc, type Orcamento } from "../data/orcamentosApi";

interface FavoritosOrcamentosProps {
  setFavoritosOpen: (open: boolean) => void;
  isMobile?: boolean;
}

const calcularTotal = (orc: Orcamento) => {
  const totalVendas = (orc.itens || []).reduce((acc, item) => {
    const sub = item.quantidade * item.valorUnitario;
    return acc + sub - (sub * item.desconto) / 100;
  }, 0);

  const totalPacotes = (orc.pacotes || []).reduce((acc, p) => {
    const valorPacote = Number(p.valor) || 0;
    const valorHospedagem = Number((p as any).hospedagemValor) || 0;
    return acc + valorPacote + valorHospedagem;
  }, 0);

  const totalHospedagem = (orc.hospedagem || []).reduce((acc, h) => acc + (h.preco || 0), 0);
  const totalTransporte = (orc.transporte || []).reduce((acc, t) => acc + (t.valor || 0), 0);
  const totalRestaurante = (orc.restaurante || []).reduce((acc, r) => acc + (r.preco || 0), 0);
  const totalExperiencias = (orc.experiencias || []).reduce((acc, e) => acc + (e.preco || 0), 0);
  const totalSeguro = (orc.seguro || []).reduce((acc, s) => acc + (s.valor || 0), 0);

  return totalVendas + totalPacotes + totalHospedagem + totalTransporte + totalRestaurante + totalExperiencias + totalSeguro;
};

const statusColor: Record<string, string> = {
  Aprovado: "bg-green-100 text-green-800",
  Enviado: "bg-blue-100 text-blue-800",
  Rascunho: "bg-gray-100 text-gray-800",
  Rejeitado: "bg-red-100 text-red-800",
  Cancelado: "bg-yellow-100 text-yellow-800",
};

export default function FavoritosOrcamentos({ setFavoritosOpen, isMobile = false }: FavoritosOrcamentosProps) {
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [favIds, setFavIds] = useState<number[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("favoritos_orcamentos") || "[]");
      return Array.isArray(stored) ? stored.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0) : [];
    }
    catch { return []; }
  });

  useEffect(() => {
    async function carregarOrcamentos() {
      setErro(null);
      try {
        const lista = await listarOrcamentos();
        setOrcamentos(lista);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro ao carregar orçamentos favoritos.");
      } finally {
        setCarregando(false);
      }
    }

    void carregarOrcamentos();
  }, []);

  useEffect(() => {
    const sync = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("favoritos_orcamentos") || "[]");
        setFavIds(Array.isArray(stored) ? stored.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0) : []);
      }
      catch { setFavIds([]); }
    };
    window.addEventListener("favoritos_orcamentos_updated", sync);
    return () => window.removeEventListener("favoritos_orcamentos_updated", sync);
  }, []);

  const favoritos = orcamentos.filter((o) => favIds.includes(o.id));

  const removerFavorito = (id: number) => {
    setFavIds((prev) => {
      const next = prev.filter((x) => x !== id);
      localStorage.setItem("favoritos_orcamentos", JSON.stringify(next));
      window.dispatchEvent(new Event("favoritos_orcamentos_updated"));
      return next;
    });
  };

  return (
    <Card className={`${isMobile ? "h-full" : "h-[80vh]"} flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
          <h3 className="font-semibold text-base text-gray-900">Orçamentos Favoritos</h3>
          <Badge variant="secondary" className="text-xs">{favoritos.length}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setFavoritosOpen(false)}
          className="h-8 w-8 text-gray-500 hover:text-gray-800"
          title="Fechar painel"
        >
          <PanelRightClose className="w-5 h-5" />
        </Button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {erro ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </div>
        ) : carregando ? (
          <p className="text-sm text-gray-500">Carregando favoritos...</p>
        ) : favoritos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-12">
            <Star className="w-12 h-12 text-gray-200" />
            <p className="text-sm text-center">Nenhum orçamento favoritado ainda.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setFavoritosOpen(false); navigate("/financeiro/orcamentos"); }}
            >
              Ver orçamentos
            </Button>
          </div>
        ) : (
          favoritos.map((orc) => (
            <div
              key={orc.id}
              className="border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow"
            >
              {/* Cabeçalho do card */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-800 truncate">#{orc.numero}</span>
                  <Badge className={`text-xs px-1.5 py-0.5 ${statusColor[orc.status]}`}>
                    {orc.status}
                  </Badge>
                </div>
                <button
                  onClick={() => removerFavorito(orc.id)}
                  className="text-yellow-400 hover:text-yellow-200 transition-colors flex-shrink-0"
                  title="Remover dos favoritos"
                >
                  <Star className="w-4 h-4 fill-yellow-400 hover:fill-yellow-200" />
                </button>
              </div>

              {/* Cliente */}
              <p className="text-sm text-gray-600 mb-1 truncate">{orc.cliente}</p>

              {/* Itens resumidos */}
              <p className="text-xs text-gray-400 mb-2 truncate">
                {orc.itens.map((i) => i.descricao).join(", ")}
              </p>

              {/* Rodapé: total + data + link */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">
                    {new Date(orc.dataCriacao + "T00:00:00").toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {calcularTotal(orc).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 gap-1"
                  onClick={() => {
                    setFavoritosOpen(false);
                    navigate("/financeiro/orcamentos");
                  }}
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {favoritos.length > 0 && (
        <div className="border-t px-4 py-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-gray-500 hover:text-gray-800"
            onClick={() => { setFavoritosOpen(false); navigate("/financeiro/orcamentos"); }}
          >
            Ver todos os orçamentos
          </Button>
        </div>
      )}
    </Card>
  );
}

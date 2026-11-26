import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  Plus,
  Trash2,
  Search,
  MapPin,
  Pencil,
  Star,
  Globe,
  Utensils,
  Clock,
  Phone,
  FileText,
  Image,
  Upload,
  X,
  Package2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { buscarRestaurantesDestino } from "../data/destinationsApi";

interface Restaurante {
  id: number;
  nome: string;
  local: string;
  endereco: string;
  tipoCozinha: string;
  data: string;
  horario: string;
  qtdPessoas: number;
  preco: number;
  telefone: string;
  website: string;
  urlMaps: string;
  observacoes: string;
  voucher: string | null;
  voucherTipo: "pdf" | "imagem" | null;
  voucherNome: string;
}

interface RestauranteFormProps {
  restaurantes: Restaurante[];
  onRestaurantesChange: (restaurantes: Restaurante[]) => void;
  destinoInicialBusca?: string;
  onRestauranteDelete?: (restaurantes: Restaurante[]) => Promise<void> | void;
}

const tiposCozinha = [
  "Brasileira",
  "Italiana",
  "Japonesa",
  "Mexicana",
  "Francesa",
  "Árabe",
  "Chinesa",
  "Tailandesa",
  "Portuguesa",
  "Espanhola",
  "Peruana",
  "Mediterrânea",
  "Vegetariana",
  "Vegana",
  "Frutos do Mar",
  "Hamburgueria",
  "Pizzaria",
  "Churrascaria",
  "Café",
  "Sorveteria",
  "Confeitaria",
  "Outros",
];

export default function RestauranteForm({
  restaurantes,
  onRestaurantesChange,
  destinoInicialBusca,
  onRestauranteDelete,
}: RestauranteFormProps) {
  const getMensagemFallbackRestaurante = (fallbackReason?: string) => {
    switch (String(fallbackReason || '').trim()) {
      case 'ai-groq':
      case 'ai-wonderful':
      case 'ai':
        return 'Sugestoes geradas por IA para esta busca.';
      case 'quota-exceeded':
        return 'Limite da busca externa atingido. Exibindo sugestoes temporarias.';
      case 'legacy-dataset':
        return 'Exibindo sugestoes de base local enquanto a busca principal nao responde.';
      case 'local-fallback':
      case 'static-fallback':
        return 'Exibindo sugestoes temporarias de fallback.';
      default:
        return 'Resultados temporarios.';
    }
  };

  const construirSugestaoRefinamento = (consulta: string, missingInformation?: string[]) => {
    const normalizedConsulta = String(consulta || "").trim();
    if (!normalizedConsulta) return "";

    const normalizedMissing = (missingInformation || []).map((item) =>
      String(item || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
    );

    const needsRegion = normalizedMissing.some(
      (item) => item.includes("cidade") || item.includes("regiao") || item.includes("amplo"),
    );
    if (!needsRegion) return "";

    const normalizedQuery = normalizedConsulta
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (normalizedQuery === "paraguai") return "Asuncion, Paraguai";
    if (normalizedQuery === "argentina") return "Buenos Aires, Argentina";
    if (normalizedQuery === "chile") return "Santiago, Chile";

    return "";
  };

  const [busca, setBusca] = useState(() => String(destinoInicialBusca || "").trim());
  const [filtroCozinha, setFiltroCozinha] = useState("");
  const [filtroFaixaPreco, setFiltroFaixaPreco] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [avisoTemporario, setAvisoTemporario] = useState("");
  const [sugestaoRefinamento, setSugestaoRefinamento] = useState("");
  const [buscou, setBuscou] = useState(false);
  const [selecionado, setSelecionado] = useState<any | null>(null);
  const [restauranteParaExcluir, setRestauranteParaExcluir] = useState<number | null>(null);
  const [excluindoRestaurante, setExcluindoRestaurante] = useState(false);
  const [erroExclusaoRestaurante, setErroExclusaoRestaurante] = useState("");
  const [mostrarManual, setMostrarManual] = useState(false);
  const [formDetalhes, setFormDetalhes] = useState({
    id: null as number | null,
    data: "",
    horario: "",
    qtdPessoas: 2,
    preco: 0,
  });
  const [formManual, setFormManual] = useState({
    nome: "",
    local: "",
    endereco: "",
    tipoCozinha: "",
    telefone: "",
    website: "",
    urlMaps: "",
    observacoes: "",
  });
  const [voucher, setVoucher] = useState<{
    base64: string;
    tipo: "pdf" | "imagem";
    nome: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formManualRef = useRef<HTMLDivElement>(null);
  const [vouchersMinimizado, setVouchersMinimizado] = useState(false);

  useEffect(() => {
    const destino = String(destinoInicialBusca || "").trim();
    if (!destino) return;
    if (!busca.trim()) {
      setBusca(destino);
    }
  }, [destinoInicialBusca, busca]);

  const buscarRestaurante = async () => {
    if (!busca.trim()) {
      setErro("Digite local, cidade ou nome do restaurante.");
      return;
    }

    setCarregando(true);
    setErro("");
    setResultados([]);
    setBuscou(false);
    setMostrarManual(false);
    setAvisoTemporario("");
    setSugestaoRefinamento("");

    try {
      const resposta = await buscarRestaurantesDestino(busca, {
        tipoCozinha: filtroCozinha,
        faixaPreco: filtroFaixaPreco,
      });
      const itens = Array.isArray(resposta?.itens) ? resposta.itens : [];
      setResultados(itens);
      if (resposta?.fallback) {
        setAvisoTemporario(getMensagemFallbackRestaurante(resposta?.fallbackReason));
      }

      if (itens.length === 0) {
        if (Array.isArray(resposta?.missingInformation) && resposta.missingInformation.length > 0) {
          setErro(resposta.missingInformation.join(" "));
          const sugestao = construirSugestaoRefinamento(busca, resposta.missingInformation);
          setSugestaoRefinamento(sugestao);
        } else {
          setErro("Nenhum restaurante encontrado. Adicione manualmente ou tente outra busca.");
        }
        setMostrarManual(true);
      }
    } catch (err) {
      console.error("Erro ao buscar restaurantes:", err);
      setErro(
        "Erro ao buscar restaurantes. Você pode adicionar manualmente."
      );
      setMostrarManual(true);
    } finally {
      setCarregando(false);
      setBuscou(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPDF = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");

    if (!isPDF && !isImage) {
      setErro("Apenas arquivos PDF ou imagem (JPG, PNG, etc.) são permitidos.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setVoucher({
        base64,
        tipo: isPDF ? "pdf" : "imagem",
        nome: file.name,
      });
      setVouchersMinimizado(true);
      setErro("");
    };
    reader.readAsDataURL(file);
  };

  const removerVoucher = () => {
    setVoucher(null);
    setVouchersMinimizado(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const abrirDetalhes = (rest: any) => {
    setSelecionado(rest);
    setVouchersMinimizado(false);
    setErro("");
  };

  const adicionarRestaurante = () => {
    if (!selecionado) {
      setErro("Selecione um restaurante da busca primeiro.");
      return;
    }

    const novoRestaurante: Restaurante = {
      id: Date.now(),
      nome: selecionado.nome,
      local: selecionado.local,
      endereco: selecionado.endereco,
      tipoCozinha: "",
      data: formDetalhes.data,
      horario: formDetalhes.horario,
      qtdPessoas: formDetalhes.qtdPessoas,
      preco: formDetalhes.preco,
      telefone: selecionado.telefone || "",
      website: selecionado.website || "",
      urlMaps: selecionado.urlMaps || "",
      observacoes: "",
      voucher: voucher?.base64 || null,
      voucherTipo: voucher?.tipo || null,
      voucherNome: voucher?.nome || "",
    };

    onRestaurantesChange([...restaurantes, novoRestaurante]);

    // Mantem a lista de resultados para permitir incluir outros restaurantes sem nova busca.
    setSelecionado(null);
    setFormDetalhes({ id: null, data: "", horario: "", qtdPessoas: 2, preco: 0 });
    setVoucher(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const adicionarRestauranteManual = () => {
    if (!formManual.nome.trim()) {
      setErro("O campo Nome do Restaurante é obrigatório.");
      return;
    }

    if (formDetalhes.id) {
      const restauranteAtualizado: Restaurante = {
        id: formDetalhes.id,
        nome: formManual.nome,
        local: formManual.local,
        endereco: formManual.endereco,
        tipoCozinha: formManual.tipoCozinha,
        data: formDetalhes.data,
        horario: formDetalhes.horario,
        qtdPessoas: formDetalhes.qtdPessoas,
        preco: formDetalhes.preco,
        telefone: formManual.telefone,
        website: formManual.website,
        urlMaps: formManual.urlMaps,
        observacoes: formManual.observacoes,
        voucher: voucher?.base64 || null,
        voucherTipo: voucher?.tipo || null,
        voucherNome: voucher?.nome || "",
      };

      onRestaurantesChange(
        restaurantes.map((r) => (r.id === formDetalhes.id ? restauranteAtualizado : r))
      );

      limparFormularioManual();
      setMostrarManual(false);
      return;
    }

    const novoRestaurante: Restaurante = {
      id: Date.now(),
      nome: formManual.nome,
      local: formManual.local,
      endereco: formManual.endereco,
      tipoCozinha: formManual.tipoCozinha,
      data: formDetalhes.data,
      horario: formDetalhes.horario,
      qtdPessoas: formDetalhes.qtdPessoas,
      preco: formDetalhes.preco,
      telefone: formManual.telefone,
      website: formManual.website,
      urlMaps: formManual.urlMaps,
      observacoes: formManual.observacoes,
      voucher: voucher?.base64 || null,
      voucherTipo: voucher?.tipo || null,
      voucherNome: voucher?.nome || "",
    };

    onRestaurantesChange([...restaurantes, novoRestaurante]);

    limparFormularioManual();
  };

  const limparFormularioManual = () => {
    setFormManual({
      nome: "",
      local: "",
      endereco: "",
      tipoCozinha: "",
      telefone: "",
      website: "",
      urlMaps: "",
      observacoes: "",
    });
    setFormDetalhes({ id: null, data: "", horario: "", qtdPessoas: 2, preco: 0 });
    setVoucher(null);
    setMostrarManual(false);
    setErro("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removerRestaurante = async (indice: number) => {
    const restaurantesAtualizados = restaurantes.filter((_, idx) => idx !== indice);

    onRestaurantesChange(restaurantesAtualizados);
    setRestauranteParaExcluir(null);

    if (!onRestauranteDelete) {
      return;
    }

    setErroExclusaoRestaurante("");
    setExcluindoRestaurante(true);

    try {
      await onRestauranteDelete(restaurantesAtualizados);
    } catch (error) {
      // Reverte a exclusao local quando a persistencia remota falha.
      onRestaurantesChange(restaurantes);
      setErroExclusaoRestaurante(error instanceof Error ? error.message : "Erro ao excluir restaurante no servidor.");
    } finally {
      setExcluindoRestaurante(false);
    }
  };

  const editarRestaurante = (rest: Restaurante) => {
    setMostrarManual(true);
    setResultados([]);
    setSelecionado(null);
    setErro("");
    setBuscou(false);
    setVouchersMinimizado(false);

    setFormManual({
      nome: rest.nome,
      local: rest.local,
      endereco: rest.endereco,
      tipoCozinha: rest.tipoCozinha,
      telefone: rest.telefone,
      website: rest.website,
      urlMaps: rest.urlMaps,
      observacoes: rest.observacoes,
    });

    setFormDetalhes({
      id: rest.id,
      data: rest.data,
      horario: rest.horario,
      qtdPessoas: rest.qtdPessoas,
      preco: rest.preco,
    });
    setVoucher(
      rest.voucher
        ? {
            base64: rest.voucher,
            tipo: rest.voucherTipo || "pdf",
            nome: rest.voucherNome || "Voucher",
          }
        : null,
    );
  };

  const abrirFormManual = () => {
    setMostrarManual(true);
    setResultados([]);
    setSelecionado(null);
    setErro("");
    setBuscou(false);
    setVouchersMinimizado(false);
    // Scroll para o formulário manual
    setTimeout(() => formManualRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  return (
    <div className="space-y-4">
      {/* Vouchers / Ingressos */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="flex items-center gap-2 font-semibold text-gray-900">
            <Package2 className="h-4 w-4 text-indigo-500" />
            Vouchers / Ingressos
          </h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setVouchersMinimizado((prev) => !prev)}
            className="gap-2 text-gray-600 hover:text-gray-900"
          >
            {vouchersMinimizado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>

        {!vouchersMinimizado && (
          <div className="space-y-3 mb-4">
            {voucher ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {voucher.tipo === "pdf" ? (
                  <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={voucher.base64}
                      alt="Voucher"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {voucher.nome}
                  </p>
                  <p className="text-xs text-gray-500">
                    {voucher.tipo === "pdf" ? "Documento PDF" : "Imagem"}
                  </p>
                </div>
                <button
                  onClick={removerVoucher}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
              >
                <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                <p className="text-xs text-gray-500">
                  Clique para anexar arquivos
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  PDF, ZIP, JPG, PNG, etc.
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </Card>

      {/* Busca */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-4">
          <Utensils className="w-4 h-4 inline-block mr-2 text-indigo-500" />
          Buscar Restaurante
        </h4>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Local / Cidade / Restaurante</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Ex: Paris, Jardins SP ou Fasano"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && buscarRestaurante()
                }
                className="flex-1"
              />
              <Button
                onClick={buscarRestaurante} 
                disabled={carregando}
                size="icon"
                className="w-auto gap-2 px-4"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo de Cozinha (filtro)</Label>
              <select
                value={filtroCozinha}
                onChange={(e) => setFiltroCozinha(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Todas</option>
                {tiposCozinha.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Faixa de Preço (filtro)</Label>
              <select
                value={filtroFaixaPreco}
                onChange={(e) => setFiltroFaixaPreco(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Todas</option>
                <option value="$">$ (econômico)</option>
                <option value="$$">$$ (intermediário)</option>
                <option value="$$$">$$$ (premium)</option>
              </select>
            </div>
          </div>
          {erro && (
            <p className="text-xs text-red-500">{erro}</p>
          )}
          {sugestaoRefinamento && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setBusca(sugestaoRefinamento);
                setErro("");
                setMostrarManual(false);
                setSugestaoRefinamento("");
              }}
            >
              Usar sugestao: {sugestaoRefinamento}
            </Button>
          )}
          {avisoTemporario && (
            <p className="text-xs text-amber-600">{avisoTemporario}</p>
          )}
        </div>
      </Card>
      <div className="text-center">
        <Button variant="link" onClick={abrirFormManual} className="text-indigo-600 text-sm">
          Não encontrou o restaurante? Adicionar manualmente
        </Button>
      </div>

      {/* Resultados da busca */}
      {resultados.length > 0 && !selecionado && (
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">
              <Globe className="w-4 h-4 inline-block mr-1 text-blue-500" />
              Restaurantes Encontrados ({resultados.length})
              {avisoTemporario && (
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  Temporário
                </span>
              )}
            </h4>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {resultados.map((rest, idx) => (
              <button
                key={rest.placeId || idx}
                onClick={() => abrirDetalhes(rest)}
                className="w-full text-left p-3 border rounded-lg hover:bg-white hover:border-blue-500 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="font-medium text-gray-900 truncate">
                        {rest.nome}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{rest.endereco}</span>
                    </p>
                    {rest.urlMaps && (
                      <p className="mt-1 text-xs text-blue-600">
                        <a href={rest.urlMaps} target="_blank" rel="noopener noreferrer">
                          Abrir no Google Maps
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    {rest.classificacao > 0 && (
                      <p className="font-semibold text-indigo-600 text-sm">
                        <Star className="w-3 h-3 inline-block text-yellow-500" />{" "}
                        {rest.classificacao.toFixed(1)}
                        {rest.totalAvaliacoes && (
                          <span className="text-xs text-gray-400 font-normal">
                            {" "}
                            ({rest.totalAvaliacoes})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {resultados.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMostrarManual(true);
                  setResultados([]);
                }}
                className="text-xs text-indigo-600 w-full"
              >
                Não encontrou o ideal?{" "}
                <strong className="ml-1">Adicionar manualmente</strong>
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Sem resultados */}
      {buscou && resultados.length === 0 && !selecionado && !mostrarManual && (
        <Card className="p-6 text-center">
          <Utensils className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500 mb-3">
            Nenhum restaurante encontrado para "{busca}".
          </p>
          <Button onClick={() => setMostrarManual(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Manualmente
          </Button>
        </Card>
      )}

      {/* Detalhes do selecionado */}
      {selecionado && (
        <Card className="p-4 bg-green-50 border border-green-200">
          <h4 className="font-semibold text-gray-900 mb-3">
            <Utensils className="w-4 h-4 inline-block mr-1" />
            {selecionado.nome}
          </h4>

          <div className="bg-white p-3 rounded mb-3 text-sm">
            <p className="font-medium text-gray-900">{selecionado.local}</p>
            <p className="text-xs text-gray-500">{selecionado.endereco}</p>
            {selecionado.classificacao > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  <Star className="w-3 h-3 inline-block mr-0.5" />
                  {selecionado.classificacao.toFixed(1)}
                </span>
              </div>
            )}
            {(selecionado.telefone || selecionado.website || selecionado.urlMaps) && (
              <div className="mt-2 space-y-0.5">
                {selecionado.telefone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selecionado.telefone}
                  </p>
                )}
                {selecionado.website && (
                  <p className="text-xs text-blue-500 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <a
                      href={selecionado.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {selecionado.website}
                    </a>
                  </p>
                )}
                {selecionado.urlMaps && (
                  <p className="text-xs text-blue-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <a
                      href={selecionado.urlMaps}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver no Google Maps
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-xs">
                Data da Reserva <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formDetalhes.data}
                onChange={(e) =>
                  setFormDetalhes({ ...formDetalhes, data: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">
                Horário
              </Label>
              <Input
                type="time"
                value={formDetalhes.horario}
                onChange={(e) =>
                  setFormDetalhes({ ...formDetalhes, horario: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Nº de Pessoas</Label>
              <Input
                type="number"
                min="1"
                value={formDetalhes.qtdPessoas}
                onChange={(e) =>
                  setFormDetalhes({
                    ...formDetalhes,
                    qtdPessoas: parseInt(e.target.value) || 1,
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Preço Estimado (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={formDetalhes.preco || ""}
                onChange={(e) =>
                  setFormDetalhes({
                    ...formDetalhes,
                    preco: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1"
              />
            </div>
          </div>

          {erro && selecionado && (
            <p className="text-xs text-red-500 mb-3">{erro}</p>
          )}

          <div className="flex gap-2">
            <Button
              onClick={adicionarRestaurante}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Adicionar Restaurante
            </Button>
            <Button
              onClick={() => setSelecionado(null)}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Formulário manual */}
      {mostrarManual && !selecionado && (
        <Card ref={formManualRef} className="p-4 border-2 border-dashed border-indigo-300 bg-indigo-50/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              <Utensils className="w-4 h-4 inline-block mr-1 text-indigo-500" />
              Adicionar Restaurante Manualmente
            </h4>
            <button
              onClick={() => {
                setMostrarManual(false);
                setBuscou(false);
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-xs">
                Nome do Restaurante <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Ex: Le Comptoir"
                value={formManual.nome}
                onChange={(e) =>
                  setFormManual({ ...formManual, nome: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">
                Local / Cidade
              </Label>
              <Input
                placeholder="Ex: Paris, França"
                value={formManual.local}
                onChange={(e) =>
                  setFormManual({ ...formManual, local: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Endereço</Label>
              <Input
                placeholder="Ex: Rua Exemplo, 123"
                value={formManual.endereco}
                onChange={(e) =>
                  setFormManual({ ...formManual, endereco: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Tipo de Cozinha</Label>
              <select
                value={formManual.tipoCozinha}
                onChange={(e) =>
                  setFormManual({ ...formManual, tipoCozinha: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Selecione</option>
                {tiposCozinha.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input
                placeholder="+55 11 99999-9999"
                value={formManual.telefone}
                onChange={(e) =>
                  setFormManual({ ...formManual, telefone: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Website</Label>
              <Input
                placeholder="https://..."
                value={formManual.website}
                onChange={(e) =>
                  setFormManual({ ...formManual, website: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Preço Estimado (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={formDetalhes.preco || ""}
                onChange={(e) =>
                  setFormDetalhes({
                    ...formDetalhes,
                    preco: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">
                Data da Reserva
              </Label>
              <Input
                type="date"
                value={formDetalhes.data}
                onChange={(e) =>
                  setFormDetalhes({ ...formDetalhes, data: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">
{/*  */}                Horário
              </Label>
              <Input
                type="time"
                value={formDetalhes.horario}
                onChange={(e) =>
                  setFormDetalhes({ ...formDetalhes, horario: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Nº de Pessoas</Label>
              <Input
                type="number"
                min="1"
                value={formDetalhes.qtdPessoas}
                onChange={(e) =>
                  setFormDetalhes({
                    ...formDetalhes,
                    qtdPessoas: parseInt(e.target.value) || 1,
                  })
                }
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">URL do Google Maps</Label>
              <div className="relative mt-1">
                <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="https://maps.app.goo.gl/..."
                  value={formManual.urlMaps}
                  onChange={(e) =>
                    setFormManual({ ...formManual, urlMaps: e.target.value })
                  }
                  className="pl-8"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Observações</Label>
              <textarea
                value={formManual.observacoes}
                onChange={(e) =>
                  setFormManual({ ...formManual, observacoes: e.target.value })
                }
                placeholder="Restrições alimentares, preferências, etc."
                rows={2}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring resize-none"
              />
            </div>
          </div>

          {erro && mostrarManual && (
            <p className="text-xs text-red-500 mb-3">{erro}</p>
          )}

          <div className="flex gap-2">
            <Button
              onClick={adicionarRestauranteManual}
              className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Adicionar Restaurante
            </Button>
            <Button
              onClick={() => {
                setMostrarManual(false);
                setBuscou(false);
              }}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Lista de restaurantes adicionados */}
      {restaurantes.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            <Utensils className="w-4 h-4 inline-block mr-1 text-green-500" />
            Restaurantes Adicionados ({restaurantes.length})
          </h4>
          {erroExclusaoRestaurante && (
            <p className="mb-3 text-xs text-red-500">{erroExclusaoRestaurante}</p>
          )}
          <div className="space-y-2">
            {restaurantes.map((rest, index) => (
              <div
                key={`${rest.id}-${index}`}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">
                      {rest.nome}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {rest.local}
                    </span>
                    {rest.tipoCozinha && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                        {rest.tipoCozinha}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    <Clock className="w-3 h-3 inline-block mr-0.5" />
                    {rest.data} às {rest.horario} • {rest.qtdPessoas} pessoa
                    {rest.qtdPessoas !== 1 ? "s" : ""}
                  </p>
                  {rest.endereco && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {rest.endereco}
                    </p>
                  )}
                  {rest.preco > 0 && (
                    <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                      R${" "}
                      {rest.preco.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  )}
                  {rest.observacoes && (
                    <p className="text-xs text-gray-500 mt-0.5 italic">
                      {rest.observacoes}
                    </p>
                  )}
                  {rest.voucher && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {rest.voucherTipo === "pdf" ? (
                        <FileText className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Image className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        {rest.voucherNome}
                      </span>
                      <button
                        onClick={() => {
                          if (rest.voucher) {
                            const win = window.open("");
                            win?.document.write(
                              rest.voucherTipo === "pdf"
                                ? `<iframe src="${rest.voucher}" style="width:100%;height:100%;border:none;"></iframe>`
                                : `<img src="${rest.voucher}" style="max-width:100%;max-height:100vh;display:block;margin:auto;" />`
                            );
                          }
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                      >
                        Visualizar
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 ml-3 flex-shrink-0">
                  <button
                    onClick={() => editarRestaurante(rest)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <AlertDialog
                    open={restauranteParaExcluir === index}
                    onOpenChange={(open) => !open && setRestauranteParaExcluir(null)}
                  >
                    <AlertDialogTrigger asChild>
                      <button
                        onClick={() => setRestauranteParaExcluir(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
                        <AlertDialogDescription>
                          Deseja realmente excluir o restaurante "{rest.nome || "Sem nome"}"? Esta acao nao pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removerRestaurante(index)}
                          disabled={excluindoRestaurante}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {excluindoRestaurante ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-semibold text-gray-900">
              Total Restaurantes: R${" "}
              {restaurantes
                .reduce((sum, r) => sum + (r.preco || 0), 0)
                .toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </div>
        </Card>
      )}

      {restaurantes.length === 0 && !mostrarManual && !selecionado && !carregando && (
        <div className="text-center py-8 text-gray-500 text-sm">
          Nenhum restaurante adicionado. Busque acima ou adicione manualmente.
        </div>
      )}
    </div>
  );
}
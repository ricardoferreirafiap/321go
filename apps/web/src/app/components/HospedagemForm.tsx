import { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import {
  Plus,
  Trash2,
  Search,
  MapPin,
  FileText,
  Image,
  Upload,
  X,
  Pencil,
  Building2,
  Star,
  ChevronDown,
  ChevronUp,
  Globe,
  Sparkles,
} from "lucide-react";
import { buscarHospedagensDestino } from "../data/destinationsApi";
import { enviarMensagemIA } from "../data/aiChatApi";

interface Hospedagem {
  id: number;
  nome: string;
  local: string;
  endereco: string;
  linkOperadora: string;
  telefoneHotel: string;
  emailHotel: string;
  horarioCheckinHotel: string;
  horarioCheckoutHotel: string;
  regimeHotel: string;
  politicasCondicoesInformacoesEspeciais: string;
  checkin: string;
  checkout: string;
  tipoQuarto: string;
  preco: number;
  noites: number;
  classificacao: number;
  amenidades: string[];
  fotosHospedagem?: string[];
  fotoHospedagem: string | null;
  voucher: string | null;
  voucherTipo: "pdf" | "imagem" | null;
  voucherNome: string;
}

interface HospedagemFormProps {
  hospedagens: Hospedagem[];
  onHospedagensChange: (hospedagens: Hospedagem[]) => void;
}

const destinosPopulares = [
  "Rio de Janeiro, Brasil",
  "São Paulo, Brasil",
  "Salvador, Brasil",
  "Florianópolis, Brasil",
  "Gramado, Brasil",
  "Foz do Iguaçu, Brasil",
  "Fortaleza, Brasil",
  "Recife, Brasil",
  "Manaus, Brasil",
  "Curitiba, Brasil",
  "Belo Horizonte, Brasil",
  "Brasília, Brasil",
  "Lisboa, Portugal",
  "Porto, Portugal",
  "Paris, França",
  "Roma, Itália",
  "Veneza, Itália",
  "Florença, Itália",
  "Nova York, EUA",
  "Orlando, EUA",
  "Miami, EUA",
  "Los Angeles, EUA",
  "Londres, Reino Unido",
  "Madri, Espanha",
  "Barcelona, Espanha",
  "Amsterdã, Holanda",
  "Berlim, Alemanha",
  "Atenas, Grécia",
  "Tóquio, Japão",
  "Buenos Aires, Argentina",
  "Cancún, México",
  "Dubai, Emirados Árabes Unidos",
  "Bangkok, Tailândia",
  "Sydney, Austrália",
];

export default function HospedagemForm({
  hospedagens,
  onHospedagensChange,
}: HospedagemFormProps) {
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [avisoTemporario, setAvisoTemporario] = useState("");
  const [buscou, setBuscou] = useState(false);
  const [selecionado, setSelecionado] = useState<any | null>(null);
  const [mostrarManual, setMostrarManual] = useState(false);
  const [formQuarto, setFormQuarto] = useState({
    tipoQuarto: "",
    checkin: "",
    checkout: "",
    noites: 1,
  });
  const [formManual, setFormManual] = useState({
    nome: "",
    local: "",
    endereco: "",
    linkOperadora: "",
    telefoneHotel: "",
    emailHotel: "",
    horarioCheckinHotel: "",
    horarioCheckoutHotel: "",
    regimeHotel: "",
    politicasCondicoesInformacoesEspeciais: "",
    tipoQuarto: "",
    precoNoite: 0,
    classificacao: 0,
  });
  const [voucher, setVoucher] = useState<{
    base64: string;
    tipo: "pdf" | "imagem";
    nome: string;
  } | null>(null);
  const [fotoHospedagemLink, setFotoHospedagemLink] = useState("");
  const [fotosHospedagem, setFotosHospedagem] = useState<string[]>([]);
  const [hospedagemEditandoId, setHospedagemEditandoId] = useState<number | null>(null);
  const [buscandoLinkIA, setBuscandoLinkIA] = useState(false);

  const buscarLinkHotelIA = async (nome: string, endereco: string, onSuccess: (url: string) => void) => {
    const nomeTrimmed = nome.trim();
    if (!nomeTrimmed) {
      setErro("Informe o nome do hotel antes de buscar o link.");
      return;
    }

    setBuscandoLinkIA(true);
    setErro("");

    try {
      const prompt = `Você é um assistente de viagens especializado. Preciso do site oficial (URL) do seguinte hotel:\n\nNome: ${nomeTrimmed}${endereco.trim() ? `\nEndereço: ${endereco.trim()}` : ""}\n\nResponda SOMENTE com a URL completa do site oficial do hotel (ex: https://www.nomehotel.com). Se não encontrar o site oficial, responda com a URL do Google Maps ou Booking.com para este hotel. Não adicione explicações, apenas a URL.`;

      const resposta = await enviarMensagemIA([{ role: "user", content: prompt }]);
      const conteudo = resposta?.reply?.trim() ?? "";
      const urlMatch = conteudo.match(/https?:\/\/[^\s"'<>]+/);

      if (urlMatch) {
        onSuccess(urlMatch[0]);
      } else {
        setErro("A IA não conseguiu encontrar o link. Tente preencher manualmente.");
      }
    } catch {
      setErro("Erro ao consultar a IA. Tente novamente.");
    } finally {
      setBuscandoLinkIA(false);
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formManualRef = useRef<HTMLDivElement>(null);
  const buscarHospedagem = async (termoBusca?: string, silencioso = false) => {
    const termo = String(termoBusca ?? busca).trim();

    if (!termo) {
      if (!silencioso) {
        setResultados([]);
        setBuscou(false);
      }
      setErro("Digite um local para buscar");
      return;
    }

    setCarregando(true);
    setErro("");
    setResultados([]);
    setBuscou(false);
    setMostrarManual(false);
    setAvisoTemporario("");

    try {
      const resposta = await buscarHospedagensDestino(termo);
      const itens = Array.isArray(resposta?.itens) ? resposta.itens : [];
      setResultados(itens);
      if (resposta?.fallback) {
        setAvisoTemporario("Resultados temporários.");
      }

      if (itens.length === 0) {
        if (!silencioso) {
          setErro("Nenhuma hospedagem encontrada. Você pode adicionar manualmente.");
          setMostrarManual(true);
        }
      }
    } catch (err) {
      if (!silencioso) {
        setErro("Não foi possível buscar agora. Adicione manualmente.");
        setMostrarManual(true);
      }
    } finally {
      setCarregando(false);
      setBuscou(true);
    }
  };

  useEffect(() => {
    if (!busca.trim() || selecionado) {
      return;
    }

    const timer = setTimeout(() => {
      void buscarHospedagem(busca, true);
    }, 500);

    return () => clearTimeout(timer);
  }, [busca, selecionado]);

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
      setErro("");
    };
    reader.readAsDataURL(file);
  };

  const removerVoucher = () => {
    setVoucher(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const normalizarFotosHospedagem = (hosp: Pick<Hospedagem, "fotosHospedagem" | "fotoHospedagem">) => {
    const fotosNovas = Array.isArray(hosp.fotosHospedagem) ? hosp.fotosHospedagem : [];
    const fotoAntiga = typeof hosp.fotoHospedagem === "string" && hosp.fotoHospedagem.trim()
      ? [hosp.fotoHospedagem.trim()]
      : [];

    return Array.from(
      new Set(
        [...fotosNovas, ...fotoAntiga]
          .map((foto) => foto.trim())
          .filter(Boolean)
      )
    );
  };

  const adicionarFotoHospedagem = () => {
    const foto = fotoHospedagemLink.trim();

    if (!foto) {
      return;
    }

    if (fotosHospedagem.includes(foto)) {
      setErro("Essa foto já foi adicionada.");
      return;
    }

    setFotosHospedagem([...fotosHospedagem, foto]);
    setFotoHospedagemLink("");
    setErro("");
  };

  const removerFotoHospedagem = (foto: string) => {
    setFotosHospedagem(fotosHospedagem.filter((item) => item !== foto));
  };

  const calcularNoites = (checkin: string, checkout: string) => {
    if (!checkin || !checkout) return 1;
    const inicio = new Date(checkin);
    const fim = new Date(checkout);
    const noites = Math.ceil(
      (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(1, noites);
  };

  const adicionarHospedagem = () => {
    if (!selecionado || !formQuarto.tipoQuarto || !formQuarto.checkin || !formQuarto.checkout) {
      setErro("Preencha todos os campos");
      return;
    }

    const noites = calcularNoites(formQuarto.checkin, formQuarto.checkout);
    const precoTotal = selecionado.precoBase * noites;

    const novaHospedagem: Hospedagem = {
      id: Date.now(),
      nome: selecionado.nome,
      local: selecionado.local,
      endereco: selecionado.endereco,
      linkOperadora: selecionado.linkOperadora || "",
      telefoneHotel: selecionado.telefoneHotel || selecionado.telefone || "",
      emailHotel: selecionado.emailHotel || selecionado.email || "",
      horarioCheckinHotel: selecionado.horarioCheckinHotel || selecionado.horarioCheckin || "",
      horarioCheckoutHotel: selecionado.horarioCheckoutHotel || selecionado.horarioCheckout || "",
      regimeHotel: selecionado.regimeHotel || selecionado.regime || "",
      politicasCondicoesInformacoesEspeciais: selecionado.politicasCondicoesInformacoesEspeciais || selecionado.politicas || "",
      tipoQuarto: formQuarto.tipoQuarto,
      checkin: formQuarto.checkin,
      checkout: formQuarto.checkout,
      noites,
      preco: precoTotal,
      classificacao: selecionado.classificacao,
      amenidades: selecionado.amenidades || [],
      fotosHospedagem,
      fotoHospedagem: fotoHospedagemLink.trim() || null,
      voucher: voucher?.base64 || null,
      voucherTipo: voucher?.tipo || null,
      voucherNome: voucher?.nome || "",
    };

    onHospedagensChange([...hospedagens, novaHospedagem]);

    // Limpar formulário
    setSelecionado(null);
    setFormQuarto({ tipoQuarto: "", checkin: "", checkout: "", noites: 1 });
    setResultados([]);
    setBusca("");
    setFotoHospedagemLink("");
    setFotosHospedagem([]);
    setVoucher(null);
    setBuscou(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const adicionarHospedagemManual = () => {
    if (
      !formManual.nome.trim() ||
      !formManual.local.trim() ||
      !formQuarto.checkin ||
      !formQuarto.checkout
    ) {
      setErro("Preencha os campos obrigatórios: Nome, Local, Check-in e Check-out.");
      return;
    }

    const noites = calcularNoites(formQuarto.checkin, formQuarto.checkout);
    const precoTotal = formManual.precoNoite * noites;

    if (hospedagemEditandoId !== null) {
      const hospedagemAtual = hospedagens.find((h) => h.id === hospedagemEditandoId);
      const hospedagemAtualizada: Hospedagem = {
        id: hospedagemEditandoId,
        nome: formManual.nome,
        local: formManual.local,
        endereco: formManual.endereco,
        linkOperadora: formManual.linkOperadora,
          telefoneHotel: formManual.telefoneHotel,
          emailHotel: formManual.emailHotel,
          horarioCheckinHotel: formManual.horarioCheckinHotel,
          horarioCheckoutHotel: formManual.horarioCheckoutHotel,
          regimeHotel: formManual.regimeHotel,
          politicasCondicoesInformacoesEspeciais: formManual.politicasCondicoesInformacoesEspeciais,
          tipoQuarto: formManual.tipoQuarto || "Standard",
          checkin: formQuarto.checkin,
          checkout: formQuarto.checkout,
          noites,
          preco: precoTotal,
          classificacao: formManual.classificacao,
          amenidades: hospedagemAtual?.amenidades || [],
          fotosHospedagem,
          fotoHospedagem: fotoHospedagemLink.trim() || null,
          voucher: voucher?.base64 || null,
          voucherTipo: voucher?.tipo || null,
          voucherNome: voucher?.nome || "",
        };

      onHospedagensChange(
        hospedagens.map((h) => (h.id === hospedagemEditandoId ? hospedagemAtualizada : h))
      );

      setFormManual({
        nome: "",
        local: "",
        endereco: "",
        linkOperadora: "",
        telefoneHotel: "",
        emailHotel: "",
        horarioCheckinHotel: "",
        horarioCheckoutHotel: "",
        regimeHotel: "",
        politicasCondicoesInformacoesEspeciais: "",
        tipoQuarto: "",
        precoNoite: 0,
        classificacao: 0,
      });
      setFormQuarto({ tipoQuarto: "", checkin: "", checkout: "", noites: 1 });
      setFotoHospedagemLink("");
      setFotosHospedagem([]);
      setVoucher(null);
      setHospedagemEditandoId(null);
      setMostrarManual(false);
      setErro("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const novaHospedagem: Hospedagem = {
      id: Date.now(),
      nome: formManual.nome,
      local: formManual.local,
      endereco: formManual.endereco,
      linkOperadora: formManual.linkOperadora,
      telefoneHotel: formManual.telefoneHotel,
      emailHotel: formManual.emailHotel,
      horarioCheckinHotel: formManual.horarioCheckinHotel,
      horarioCheckoutHotel: formManual.horarioCheckoutHotel,
      regimeHotel: formManual.regimeHotel,
      politicasCondicoesInformacoesEspeciais: formManual.politicasCondicoesInformacoesEspeciais,
      tipoQuarto: formManual.tipoQuarto || "Standard",
      checkin: formQuarto.checkin,
      checkout: formQuarto.checkout,
      noites,
      preco: precoTotal,
      classificacao: formManual.classificacao,
      amenidades: [],
      fotosHospedagem,
      fotoHospedagem: fotoHospedagemLink.trim() || null,
      voucher: voucher?.base64 || null,
      voucherTipo: voucher?.tipo || null,
      voucherNome: voucher?.nome || "",
    };

    onHospedagensChange([...hospedagens, novaHospedagem]);

    // Limpar formulário
    setFormManual({
      nome: "",
      local: "",
      endereco: "",
      linkOperadora: "",
      telefoneHotel: "",
      emailHotel: "",
      horarioCheckinHotel: "",
      horarioCheckoutHotel: "",
      regimeHotel: "",
      politicasCondicoesInformacoesEspeciais: "",
      tipoQuarto: "",
      precoNoite: 0,
      classificacao: 0,
    });
    setFormQuarto({ tipoQuarto: "", checkin: "", checkout: "", noites: 1 });
    setFotoHospedagemLink("");
    setFotosHospedagem([]);
    setVoucher(null);
    setMostrarManual(false);
    setErro("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removerHospedagem = (id: number) => {
    onHospedagensChange(hospedagens.filter((h) => h.id !== id));
  };

  // Abrir formulário de detalhes de um resultado da busca
  const abrirDetalhes = (hotel: any) => {
    setSelecionado(hotel);
    setErro("");
  };

  const abrirFormManual = () => {
    setHospedagemEditandoId(null);
    setFormManual({
      nome: "",
      local: "",
      endereco: "",
      linkOperadora: "",
      telefoneHotel: "",
      emailHotel: "",
      horarioCheckinHotel: "",
      horarioCheckoutHotel: "",
      regimeHotel: "",
      politicasCondicoesInformacoesEspeciais: "",
      tipoQuarto: "",
      precoNoite: 0,
      classificacao: 0,
    });
    setFormQuarto({ tipoQuarto: "", checkin: "", checkout: "", noites: 1 });
    setFotoHospedagemLink("");
    setFotosHospedagem([]);
    setVoucher(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setMostrarManual(true);
    setResultados([]);
    setSelecionado(null);
    setErro("");
    setBuscou(false);
    // Scroll para o formulário manual
    setTimeout(() => formManualRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  const editarHospedagem = (hosp: Hospedagem) => {
    setHospedagemEditandoId(hosp.id);
    setFormManual({
      nome: hosp.nome,
      local: hosp.local,
      endereco: hosp.endereco,
      linkOperadora: hosp.linkOperadora || "",
      telefoneHotel: hosp.telefoneHotel || "",
      emailHotel: hosp.emailHotel || "",
      horarioCheckinHotel: hosp.horarioCheckinHotel || "",
      horarioCheckoutHotel: hosp.horarioCheckoutHotel || "",
      regimeHotel: hosp.regimeHotel || "",
      politicasCondicoesInformacoesEspeciais: hosp.politicasCondicoesInformacoesEspeciais || "",
      tipoQuarto: hosp.tipoQuarto || "",
      precoNoite: hosp.noites > 0 ? Number((hosp.preco / hosp.noites).toFixed(2)) : hosp.preco,
      classificacao: hosp.classificacao || 0,
    });
    setFormQuarto({
      tipoQuarto: hosp.tipoQuarto || "",
      checkin: hosp.checkin,
      checkout: hosp.checkout,
      noites: hosp.noites || 1,
    });
    setVoucher(
      hosp.voucher && hosp.voucherTipo
        ? {
            base64: hosp.voucher,
            tipo: hosp.voucherTipo,
            nome: hosp.voucherNome || "Voucher",
          }
        : null
    );
      setFotosHospedagem(normalizarFotosHospedagem(hosp));
      setFotoHospedagemLink("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSelecionado(null);
    setResultados([]);
    setMostrarManual(true);
    setErro("");
    setTimeout(() => formManualRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="space-y-4">
      {/* Busca */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-4">
          <Search className="w-4 h-4 inline-block mr-2 text-indigo-500" />
          Buscar Hospedagem
        </h4>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Local / Cidade / Hotel</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Ex: Rio de Janeiro, Lisboa, Paris..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && buscarHospedagem()
                }
                className="flex-1"
                list="destinos-populares-list"
              />
              <datalist id="destinos-populares-list">
                {destinosPopulares.map((destino) => (
                  <option key={destino} value={destino} />
                ))}
              </datalist>
              <Button 
                onClick={() => buscarHospedagem()}
                disabled={carregando}
                size="icon"
                className="w-auto gap-2 px-4"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {erro && (
            <p className="text-xs text-red-500">{erro}</p>
          )}
          {avisoTemporario && (
            <p className="text-xs text-amber-600">{avisoTemporario}</p>
          )}
        </div>
      </Card>
      <div className="text-center">
        <Button variant="link" onClick={abrirFormManual} className="text-indigo-600 text-sm">
          Não encontrou a hospedagem? Adicionar manualmente
        </Button>
      </div>

      {/* Resultados da busca via API */}
      {resultados.length > 0 && !selecionado && (
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">
              <Globe className="w-4 h-4 inline-block mr-1 text-blue-500" />
              Hospedagens Encontradas ({resultados.length})
            </h4>
            {buscou && resultados.length === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMostrarManual(true)}
                className="text-xs"
              >
                + Adicionar manualmente
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {resultados.map((hotel, idx) => (
              <button
                key={hotel.placeId || idx}
                onClick={() => abrirDetalhes(hotel)}
                className="w-full text-left p-3 border rounded-lg hover:bg-white hover:border-blue-500 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="font-medium text-gray-900 truncate">
                        {hotel.nome}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{hotel.endereco}</span>
                    </p>
                    {hotel.amenidades && hotel.amenidades.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        {hotel.amenidades.slice(0, 4).join(" • ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    {hotel.classificacao > 0 && (
                      <p className="font-semibold text-indigo-600 text-sm">
                        <Star className="w-3 h-3 inline-block text-yellow-500" />{" "}
                        {hotel.classificacao.toFixed(1)}
                        {hotel.totalAvaliacoes && (
                          <span className="text-xs text-gray-400 font-normal">
                            {" "}
                            ({hotel.totalAvaliacoes})
                          </span>
                        )}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">a partir de</p>
                    <p className="font-bold text-gray-900">
                      R$ {hotel.precoBase}
                    </p>
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
                Não encontrou o ideal? <strong className="ml-1">Adicionar manualmente</strong>
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Mensagem quando não encontra resultados */}
      {buscou && resultados.length === 0 && !selecionado && !mostrarManual && (
        <Card className="p-6 text-center">
          <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500 mb-3">
            Nenhuma hospedagem encontrada para "{busca}".
          </p>
          <Button
            onClick={() => setMostrarManual(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Manualmente
          </Button>
        </Card>
      )}

      {/* Formulário de detalhes (quando seleciona um resultado) */}
      {selecionado && (
        <Card className="p-4 bg-green-50 border border-green-200">
          <h4 className="font-semibold text-gray-900 mb-3">
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
                {selecionado.amenidades &&
                  selecionado.amenidades.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {selecionado.amenidades.join(" • ")}
                    </span>
                  )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 mb-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Tipo de Quarto</Label>
              <select
                value={formQuarto.tipoQuarto}
                onChange={(e) =>
                  setFormQuarto({ ...formQuarto, tipoQuarto: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Selecione um quarto</option>
                {selecionado.tiposQuarto.map((tipo: string) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Preço/Noite</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={selecionado.precoBase || ""}
                onChange={(e) =>
                  setSelecionado({
                    ...selecionado,
                    precoBase: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Check-in</Label>
              <Input
                type="date"
                value={formQuarto.checkin}
                onChange={(e) => {
                  setFormQuarto({ ...formQuarto, checkin: e.target.value });
                  if (formQuarto.checkout) {
                    const noites = calcularNoites(
                      e.target.value,
                      formQuarto.checkout
                    );
                    setFormQuarto((f) => ({ ...f, noites }));
                  }
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Check-out</Label>
              <Input
                type="date"
                value={formQuarto.checkout}
                onChange={(e) => {
                  setFormQuarto({ ...formQuarto, checkout: e.target.value });
                  if (formQuarto.checkin) {
                    const noites = calcularNoites(
                      formQuarto.checkin,
                      e.target.value
                    );
                    setFormQuarto((f) => ({ ...f, noites }));
                  }
                }}
                className="mt-1"
              />
            </div>
          </div>

          <div className="mb-3">
            <Label className="text-xs">Link do Hotel</Label>
            <div className="mt-1 flex gap-2">
              <Input
                type="url"
                placeholder="https://..."
                value={selecionado.linkOperadora || ""}
                onChange={(e) =>
                  setSelecionado({
                    ...selecionado,
                    linkOperadora: e.target.value,
                  })
                }
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={buscandoLinkIA}
                onClick={() =>
                  buscarLinkHotelIA(selecionado.nome, selecionado.endereco || "", (url) =>
                    setSelecionado({ ...selecionado, linkOperadora: url })
                  )
                }
                title="Buscar link do hotel com IA"
                className="shrink-0 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              >
                {buscandoLinkIA ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-xs">Telefone do Hotel</Label>
              <Input
                value={selecionado.telefoneHotel || selecionado.telefone || ""}
                onChange={(e) => setSelecionado({ ...selecionado, telefoneHotel: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">E-mail do Hotel</Label>
              <Input
                type="email"
                value={selecionado.emailHotel || selecionado.email || ""}
                onChange={(e) => setSelecionado({ ...selecionado, emailHotel: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Horário de Check-in</Label>
              <Input
                value={selecionado.horarioCheckinHotel || selecionado.horarioCheckin || ""}
                onChange={(e) => setSelecionado({ ...selecionado, horarioCheckinHotel: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Horário de Check-out</Label>
              <Input
                value={selecionado.horarioCheckoutHotel || selecionado.horarioCheckout || ""}
                onChange={(e) => setSelecionado({ ...selecionado, horarioCheckoutHotel: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Regime / Pensão</Label>
              <Input
                value={selecionado.regimeHotel || selecionado.regime || ""}
                onChange={(e) => setSelecionado({ ...selecionado, regimeHotel: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Políticas, Condições e Informações Especiais</Label>
              <textarea
                rows={3}
                value={selecionado.politicasCondicoesInformacoesEspeciais || selecionado.politicas || ""}
                onChange={(e) => setSelecionado({ ...selecionado, politicasCondicoesInformacoesEspeciais: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-3">
            <Label className="text-xs">Link da Foto da Hospedagem</Label>
            <div className="mt-1 flex gap-2">
              <Input
                type="url"
                placeholder="https://..."
                value={fotoHospedagemLink}
                onChange={(e) => setFotoHospedagemLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    adicionarFotoHospedagem();
                  }
                }}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={adicionarFotoHospedagem} className="shrink-0 gap-2">
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            </div>
            {fotosHospedagem.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {fotosHospedagem.map((foto) => (
                  <div key={foto} className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <a href={foto} target="_blank" rel="noreferrer" title="Abrir foto da hospedagem">
                      <img src={foto} alt="Foto da hospedagem" className="h-24 w-full object-cover" />
                    </a>
                    <button
                      type="button"
                      onClick={() => removerFotoHospedagem(foto)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                      title="Remover foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voucher */}
          <div className="mb-3">
            <Label className="text-xs">Voucher (PDF ou Imagem)</Label>
            <div className="mt-1">
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
                    Clique para fazer upload do voucher
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    PDF ou imagem (JPG, PNG)
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
          </div>

          {erro && selecionado && (
            <p className="text-xs text-red-500 mb-3">{erro}</p>
          )}

          <div className="flex gap-2">
            <Button
              onClick={adicionarHospedagem}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Adicionar Hospedagem
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

      {/* Formulário manual (quando não encontra resultados ou clica em "Adicionar manualmente") */}
      {mostrarManual && !selecionado && (
        <Card ref={formManualRef} className="p-4 border-2 border-dashed border-indigo-300 bg-indigo-50/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              <Building2 className="w-4 h-4 inline-block mr-1 text-indigo-500" />
              {hospedagemEditandoId !== null ? "Editar Hospedagem" : "Adicionar Hospedagem Manualmente"}
            </h4>
            <button
              onClick={() => {
                setMostrarManual(false);
                setHospedagemEditandoId(null);
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
                Nome do Hotel / Propriedade <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Ex: Hotel Exemplo"
                value={formManual.nome}
                onChange={(e) =>
                  setFormManual({ ...formManual, nome: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">
                Local / Cidade <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Ex: São Paulo, Brasil"
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
                placeholder="Ex: Av. Paulista, 1000"
                value={formManual.endereco}
                onChange={(e) =>
                  setFormManual({ ...formManual, endereco: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Tipo de Quarto</Label>
              <Input
                placeholder="Ex: Standard, Suíte"
                value={formManual.tipoQuarto}
                onChange={(e) =>
                  setFormManual({ ...formManual, tipoQuarto: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Preço por Noite (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={formManual.precoNoite || ""}
                onChange={(e) =>
                  setFormManual({
                    ...formManual,
                    precoNoite: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Classificação (0-5)</Label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                placeholder="Ex: 4.5"
                value={formManual.classificacao || ""}
                onChange={(e) =>
                  setFormManual({
                    ...formManual,
                    classificacao: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Check-in</Label>
              <Input
                type="date"
                value={formQuarto.checkin}
                onChange={(e) => {
                  setFormQuarto({ ...formQuarto, checkin: e.target.value });
                  if (formQuarto.checkout) {
                    const noites = calcularNoites(
                      e.target.value,
                      formQuarto.checkout
                    );
                    setFormQuarto((f) => ({ ...f, noites }));
                  }
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Check-out</Label>
              <Input
                type="date"
                value={formQuarto.checkout}
                onChange={(e) => {
                  setFormQuarto({ ...formQuarto, checkout: e.target.value });
                  if (formQuarto.checkin) {
                    const noites = calcularNoites(
                      formQuarto.checkin,
                      e.target.value
                    );
                    setFormQuarto((f) => ({ ...f, noites }));
                  }
                }}
                className="mt-1"
              />
            </div>
          </div>

          <div className="mb-3">
            <Label className="text-xs">Site do Hotel</Label>
            <div className="mt-1 flex gap-2">
              <Input
                type="url"
                placeholder="https://..."
                value={formManual.linkOperadora}
                onChange={(e) =>
                  setFormManual({ ...formManual, linkOperadora: e.target.value })
                }
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={buscandoLinkIA}
                onClick={() =>
                  buscarLinkHotelIA(formManual.nome, formManual.endereco, (url) =>
                    setFormManual({ ...formManual, linkOperadora: url })
                  )
                }
                title="Buscar link do hotel com IA"
                className="shrink-0 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              >
                {buscandoLinkIA ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-xs">Telefone do Hotel</Label>
              <Input
                placeholder="Ex: +55 11 99999-9999"
                value={formManual.telefoneHotel}
                onChange={(e) => setFormManual({ ...formManual, telefoneHotel: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">E-mail do Hotel</Label>
              <Input
                type="email"
                placeholder="Ex: reservas@hotel.com"
                value={formManual.emailHotel}
                onChange={(e) => setFormManual({ ...formManual, emailHotel: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Horário de Check-in</Label>
              <Input
                placeholder="Ex: 14:00"
                value={formManual.horarioCheckinHotel}
                onChange={(e) => setFormManual({ ...formManual, horarioCheckinHotel: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Horário de Check-out</Label>
              <Input
                placeholder="Ex: 12:00"
                value={formManual.horarioCheckoutHotel}
                onChange={(e) => setFormManual({ ...formManual, horarioCheckoutHotel: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Regime / Pensão</Label>
              <Input
                placeholder="Ex: Café da manhã"
                value={formManual.regimeHotel}
                onChange={(e) => setFormManual({ ...formManual, regimeHotel: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Políticas, Condições e Informações Especiais</Label>
              <textarea
                rows={3}
                placeholder="Informe regras, cancelamentos, observações, taxas e condições do hotel."
                value={formManual.politicasCondicoesInformacoesEspeciais}
                onChange={(e) => setFormManual({ ...formManual, politicasCondicoesInformacoesEspeciais: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-3">
            <Label className="text-xs">Link da Foto da Hospedagem</Label>
            <div className="mt-1 flex gap-2">
              <Input
                type="url"
                placeholder="https://..."
                value={fotoHospedagemLink}
                onChange={(e) => setFotoHospedagemLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    adicionarFotoHospedagem();
                  }
                }}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={adicionarFotoHospedagem} className="shrink-0 gap-2">
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            </div>
            {fotosHospedagem.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {fotosHospedagem.map((foto) => (
                  <div key={foto} className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <a href={foto} target="_blank" rel="noreferrer" title="Abrir foto da hospedagem">
                      <img src={foto} alt="Foto da hospedagem" className="h-24 w-full object-cover" />
                    </a>
                    <button
                      type="button"
                      onClick={() => removerFotoHospedagem(foto)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                      title="Remover foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voucher */}
          <div className="mb-3">
            <Label className="text-xs">Voucher (PDF ou Imagem)</Label>
            <div className="mt-1">
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
                    Clique para fazer upload do voucher
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    PDF ou imagem (JPG, PNG)
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
          </div>

          {erro && mostrarManual && (
            <p className="text-xs text-red-500 mb-3">{erro}</p>
          )}

          <div className="flex gap-2">
            <Button
              onClick={adicionarHospedagemManual}
              className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {hospedagemEditandoId !== null ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {hospedagemEditandoId !== null ? "Salvar edição" : "Adicionar Hospedagem"}
            </Button>
            <Button
              onClick={() => {
                setMostrarManual(false);
                setHospedagemEditandoId(null);
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

      {/* Lista de hospedagens adicionadas */}
      {hospedagens.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            <Building2 className="w-4 h-4 inline-block mr-1 text-green-500" />
            Hospedagens Adicionadas ({hospedagens.length})
          </h4>
          <div className="space-y-2">
            {hospedagens.map((hosp, idx) => (
              <div
                key={hosp.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">
                      {hosp.nome}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {hosp.local}
                    </span>
                    {hosp.classificacao > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                        <Star className="w-3 h-3 inline-block mr-0.5" />
                        {hosp.classificacao.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {hosp.tipoQuarto} • {hosp.checkin} → {hosp.checkout} •{" "}
                    {hosp.noites} noite{hosp.noites !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{hosp.endereco}</p>
                  {hosp.linkOperadora && (
                    <a
                      href={hosp.linkOperadora}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Site do hotel
                    </a>
                  )}
                  {hosp.amenidades && hosp.amenidades.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {hosp.amenidades.join(" • ")}
                    </p>
                  )}
                  {normalizarFotosHospedagem(hosp).length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {normalizarFotosHospedagem(hosp).map((foto) => (
                        <a
                          key={foto}
                          href={foto}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-md border border-gray-200 bg-white"
                          title="Abrir foto"
                        >
                          <img src={foto} alt={`Foto da hospedagem ${hosp.nome}`} className="h-20 w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  {hosp.voucher && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {hosp.voucherTipo === "pdf" ? (
                        <FileText className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Image className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        {hosp.voucherNome}
                      </span>
                      <button
                        onClick={() => {
                          if (hosp.voucher) {
                            const win = window.open("");
                            win?.document.write(
                              hosp.voucherTipo === "pdf"
                                ? `<iframe src="${hosp.voucher}" style="width:100%;height:100%;border:none;"></iframe>`
                                : `<img src="${hosp.voucher}" style="max-width:100%;max-height:100vh;display:block;margin:auto;" />`
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
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="font-bold text-indigo-700 text-sm">
                    R${" "}
                    {hosp.preco.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <button
                    onClick={() => editarHospedagem(hosp)}
                    className="mt-1 p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Editar hospedagem"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removerHospedagem(hosp.id)}
                    className="mt-1 p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Excluir hospedagem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-semibold text-gray-900">
              Total Hospedagem: R${" "}
              {hospedagens
                .reduce((sum, h) => sum + h.preco, 0)
                .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </Card>
      )}

      {hospedagens.length === 0 && !selecionado && !mostrarManual && !carregando && (
        <div className="text-center py-8 text-gray-500 text-sm">
          <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          Nenhuma hospedagem adicionada. Busque acima ou{" "}
          <button
            onClick={() => {
              setMostrarManual(true);
              setBuscou(false);
            }}
            className="text-indigo-600 hover:text-indigo-800 underline font-medium"
          >
            adicione manualmente
          </button>
          .
        </div>
      )}
    </div>
  );
}
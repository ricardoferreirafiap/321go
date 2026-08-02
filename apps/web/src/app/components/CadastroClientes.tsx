import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Phone, Mail, MapPin, X, Copy } from "lucide-react";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import {
  atualizarCliente,
  criarCliente,
  listarClientes,
  type Cliente,
} from "../data/clientesApi";

type ClienteForm = Omit<Cliente, "id">;

const clienteVazio: ClienteForm = {
  nome: "",
  nomeCompleto: "",
  email: "",
  telefone: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  cidade: "",
  estado: "",
  status: "Ativo",
  cpfCnpj: "",
  rg: "",
  dataNascimento: "",
  documentoNome: "",
};

export default function CadastroClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"Todos" | "Ativo" | "Inativo">("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState<ClienteForm>(clienteVazio);
  const [sobrenome, setSobrenome] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function montarNomeCompleto(nome: string, sobrenomeValue: string) {
    return `${nome.trim()} ${sobrenomeValue.trim()}`.trim();
  }

  function extrairSobrenome(nome: string, nomeCompleto: string) {
    const nomeLimpo = nome.trim();
    const nomeCompletoLimpo = nomeCompleto.trim();

    if (!nomeCompletoLimpo) return "";

    if (nomeLimpo && nomeCompletoLimpo.toLowerCase().startsWith(nomeLimpo.toLowerCase())) {
      return nomeCompletoLimpo.slice(nomeLimpo.length).trim();
    }

    if (!nomeLimpo) {
      const partes = nomeCompletoLimpo.split(/\s+/);
      if (partes.length > 1) {
        return partes.slice(1).join(" ");
      }
    }

    return "";
  }

  async function carregarClientes() {
    setErro(null);
    try {
      const itens = await listarClientes();
      setClientes(itens);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar clientes.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  const clientesFiltrados = clientes.filter((c) => {
    const termo = busca.toLowerCase();
    const matchBusca =
      c.nomeCompleto.toLowerCase().includes(termo) ||
      c.nome.toLowerCase().includes(termo) ||
      c.email.toLowerCase().includes(termo) ||
      c.telefone.includes(termo) ||
      c.cep.includes(termo) ||
      c.endereco.toLowerCase().includes(termo) ||
      c.cidade.toLowerCase().includes(termo) ||
      c.rg.includes(termo) ||
      c.cpfCnpj.includes(termo);
    const matchStatus = filtroStatus === "Todos" || c.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  function abrirNovo() {
    setErro(null);
    setEditando(null);
    setSobrenome("");
    setForm(clienteVazio);
    setModalAberto(true);
  }

  function abrirEdicao(cliente: Cliente) {
    setErro(null);
    setEditando(cliente);
    const sobrenomeInicial = extrairSobrenome(cliente.nome, cliente.nomeCompleto);
    setSobrenome(sobrenomeInicial);
    setForm({
      nome: cliente.nome,
      nomeCompleto: montarNomeCompleto(cliente.nome, sobrenomeInicial) || cliente.nomeCompleto,
      email: cliente.email,
      telefone: cliente.telefone,
      cep: cliente.cep,
      endereco: cliente.endereco,
      numero: cliente.numero,
      complemento: cliente.complemento,
      cidade: cliente.cidade,
      estado: cliente.estado,
      status: cliente.status,
      cpfCnpj: cliente.cpfCnpj,
      rg: cliente.rg || "",
      dataNascimento: cliente.dataNascimento,
      documentoNome: cliente.documentoNome,
    });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(null);
  }

  async function salvar() {
    const nomeCompletoComposto = `${form.nome.trim()} ${sobrenome.trim()}`.trim();
    if (!nomeCompletoComposto) return;

    setSalvando(true);
    setErro(null);

    try {
      const payload = {
        ...form,
        nomeCompleto: montarNomeCompleto(form.nome, sobrenome).trim(),
        email: form.email.trim(),
        estado: form.estado.trim().toUpperCase().slice(0, 2),
      };

      if (editando) {
        await atualizarCliente(editando.id, payload);
      } else {
        await criarCliente(payload);
      }

      await carregarClientes();
      fecharModal();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar cliente.");
    } finally {
      setSalvando(false);
    }
  }

  async function copiarNomeCompleto() {
    const valor = form.nomeCompleto.trim();
    if (!valor) return;

    try {
      await navigator.clipboard.writeText(valor);
    } catch {
      setErro("Não foi possível copiar o nome completo.");
    }
  }

  function normalizarTelefoneWhatsApp(telefone: string) {
    const digitos = telefone.replace(/\D/g, "");

    if (!digitos) return null;

    if (digitos.startsWith("55") && digitos.length >= 12) {
      return digitos;
    }

    if (digitos.length === 10 || digitos.length === 11) {
      return `55${digitos}`;
    }

    return digitos;
  }

  function linkWhatsApp(telefone: string) {
    const numero = normalizarTelefoneWhatsApp(telefone);
    if (!numero) return null;
    return `https://wa.me/${numero}`;
  }

  async function buscarEnderecoPorCep(cepDigitado: string) {
    const cepLimpo = cepDigitado.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      return;
    }

    setBuscandoCep(true);
    setErro(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

      if (!response.ok) {
        throw new Error("Falha ao consultar CEP.");
      }

      const data = await response.json();

      if (data?.erro) {
        setErro("CEP não encontrado.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        cep: `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`,
        endereco: data.logradouro || prev.endereco,
        complemento: prev.complemento || data.complemento || "",
        cidade: data.localidade || prev.cidade,
        estado: String(data.uf || prev.estado).toUpperCase().slice(0, 2),
      }));
    } catch {
      setErro("Não foi possível buscar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cadastro de Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">{clientes.length} clientes cadastrados</p>
        </div>
        <Button onClick={abrirNovo} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Barra de pesquisa + filtros */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Pesquisar por nome, e-mail, CPF/CNPJ, cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 pr-9"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {(["Todos", "Ativo", "Inativo"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltroStatus(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                  filtroStatus === f
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {busca && (
          <p className="text-xs text-gray-500 mt-2">
            {clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? "s" : ""} encontrado{clientesFiltrados.length !== 1 ? "s" : ""}
          </p>
        )}
      </Card>

      {/* Tabela */}
      <Card className="overflow-hidden">
        {erro && <p className="m-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
        {carregando && <p className="m-4 text-sm text-gray-500">Carregando clientes...</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Nome</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold hidden md:table-cell">CPF / CNPJ</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold hidden lg:table-cell">Contato</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold hidden lg:table-cell">CEP</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold hidden xl:table-cell">Localização</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Status</th>
                <th className="text-right px-4 py-3 text-gray-600 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!carregando && clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Nenhum cliente encontrado</p>
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente, idx) => (
                  <tr
                    key={cliente.id}
                    className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                          {(cliente.nomeCompleto || cliente.nome).charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{cliente.nomeCompleto || cliente.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{cliente.cpfCnpj}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Mail className="w-3 h-3" />
                          {cliente.email}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Phone className="w-3 h-3" />
                          {cliente.telefone}
                          {linkWhatsApp(cliente.telefone) && (
                            <a
                              href={linkWhatsApp(cliente.telefone) || "#"}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Abrir WhatsApp de ${cliente.nome}`}
                              title="Abrir no WhatsApp"
                              className="ml-1 inline-flex items-center justify-center rounded text-green-600 hover:text-green-700"
                            >
                              <WhatsAppIcon fontSize="inherit" className="text-base" />
                            </a>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{cliente.cep || "-"}</td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex items-start gap-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <div>
                          <p>{[cliente.endereco, cliente.numero].filter(Boolean).join(", ") || "-"}</p>
                          <p className="text-xs text-gray-500">
                            {[cliente.complemento, cliente.cidade, cliente.estado].filter(Boolean).join(" - ") || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          cliente.status === "Ativo"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-red-100 text-red-600 hover:bg-red-100"
                        }
                      >
                        {cliente.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => abrirEdicao(cliente)}
                          className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de cadastro/edição — sem Portal/Radix Dialog */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={fecharModal}
          />
          {/* Painel */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
            {/* Título */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editando ? "Editar Cliente" : "Novo Cliente"}
              </h2>
              <button onClick={fecharModal} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) => {
                      const novoNome = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        nome: novoNome,
                        nomeCompleto: montarNomeCompleto(novoNome, sobrenome),
                      }));
                    }}
                    placeholder="Nome ou apelido"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sobrenome">Sobrenome</Label>
                  <Input
                    id="sobrenome"
                    value={sobrenome}
                    onChange={(e) => {
                      const novoSobrenome = e.target.value;
                      setSobrenome(novoSobrenome);
                      setForm((prev) => ({
                        ...prev,
                        nomeCompleto: montarNomeCompleto(prev.nome, novoSobrenome),
                      }));
                    }}
                    placeholder="Sobrenome"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="nomeCompleto">Nome completo *</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    id="nomeCompleto"
                    value={form.nomeCompleto}
                    placeholder="Nome do cliente"
                    disabled
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void copiarNomeCompleto();
                    }}
                    disabled={!form.nomeCompleto.trim()}
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:col-span-2 xl:col-span-2">
                <div>
                  <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    value={form.cpfCnpj}
                    onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })}
                    placeholder="000.000.000-00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={form.rg}
                    onChange={(e) => setForm({ ...form, rg: e.target.value })}
                    placeholder="00.000.000-0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="md:col-span-2 xl:col-span-1">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="cliente@email.com"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2 xl:col-span-1">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={form.cep}
                    onChange={(e) => setForm({ ...form, cep: e.target.value })}
                    onBlur={(e) => {
                      void buscarEnderecoPorCep(e.target.value);
                    }}
                    placeholder="00000-000"
                    className="mt-1"
                  />
                  {buscandoCep && <p className="text-xs text-gray-500 mt-1">Buscando endereço pelo CEP...</p>}
                </div>
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    placeholder="123"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="md:col-span-2 xl:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  placeholder="Rua, avenida, etc."
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2 xl:col-span-1">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={form.complemento}
                  onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                  placeholder="Apto, bloco, referência"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2 xl:col-span-1">
                <div>
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={form.dataNascimento}
                    onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="documento">Documento (RG/CPF)</Label>
                  <Input
                    id="documento"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const arquivo = e.target.files?.[0];
                      setForm({ ...form, documentoNome: arquivo ? arquivo.name : "" });
                    }}
                    className="mt-1"
                  />
                  {form.documentoNome && (
                    <p className="text-xs text-gray-500 mt-1">Arquivo selecionado: {form.documentoNome}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2 xl:col-span-1">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    placeholder="Cidade"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="md:col-span-2 xl:col-span-1">
                <Label>Status</Label>
                <div className="flex gap-2 mt-1">
                  {(["Ativo", "Inativo"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                        form.status === s
                          ? s === "Ativo"
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-red-500 text-white border-red-500"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rodapé */}
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={fecharModal}>
                Cancelar
              </Button>
              <Button
                onClick={salvar}
                disabled={salvando || !`${form.nome.trim()} ${sobrenome.trim()}`.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

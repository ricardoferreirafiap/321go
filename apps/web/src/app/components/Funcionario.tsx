import { useEffect, useState, type ChangeEvent } from "react";
import { User, UserCheck, UserX, Plus, Edit2, X, Camera, Maximize2, Minimize2 } from "lucide-react";
import { Card } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  atualizarFuncionario,
  criarFuncionario,
  listarFuncionarios,
  type Funcionario,
} from "../data/funcionariosApi";

const funcionarioVazio: Omit<Funcionario, 'id' | 'initials'> = { name: "", role: "", department: "", status: "Ativo", accessLevel: "Agente", email: "", saudacoes: "", password: "" };

export default function Funcionario() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [form, setForm] = useState<Omit<Funcionario, 'id' | 'initials'>>(funcionarioVazio);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [saudacoesExpandido, setSaudacoesExpandido] = useState(false);

  async function carregarDados() {
    setErro(null);
    try {
      const itens = await listarFuncionarios();
      setFuncionarios(itens);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar dados.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function abrirNovo() { setErro(null); setEditando(null); setForm(funcionarioVazio); setSaudacoesExpandido(false); setModalAberto(true); }
  function abrirEdicao(func: Funcionario) { setErro(null); setEditando(func); setForm({ ...func, saudacoes: func.saudacoes || "", password: "" }); setSaudacoesExpandido(false); setModalAberto(true); }
  function fecharModal() { setModalAberto(false); setEditando(null); setSaudacoesExpandido(false); }

  function selecionarFoto(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo || !arquivo.type.startsWith("image/")) return;

    const leitor = new FileReader();
    leitor.onload = () => setForm((atual) => ({ ...atual, photo: String(leitor.result) }));
    leitor.readAsDataURL(arquivo);
  }

  async function salvar() {
    if (!form.name.trim() || !form.email.trim()) return;

    setSalvando(true);
    setErro(null);

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        saudacoes: String(form.saudacoes || "").trim(),
      };

      if (editando) {
        await atualizarFuncionario(editando.id, payload);
      } else {
        await criarFuncionario(payload);
      }

      await carregarDados();
      fecharModal();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar funcionário.");
    } finally {
      setSalvando(false);
    }
  }

  const totalAprovado = orcamentos
    .filter((o) => o.status === "Aprovado")
    .reduce((acc, o) => acc + calcularTotalOrcamento(o), 0);

  const totalNaoAprovado = orcamentos
    .filter((o) => o.status !== "Aprovado")
    .reduce((acc, o) => acc + calcularTotalOrcamento(o), 0);

  const stats = [
    {
      icon: User,
      title: "Total de Funcionários",
      value: String(funcionarios.length),
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      isMoeda: false,
    },
    {
      icon: UserCheck,
      title: "Funcionários Ativos",
      value: String(funcionarios.filter((f) => f.status === "Ativo").length),
      color: "text-green-600",
      bgColor: "bg-green-100",
      isMoeda: false,
    },
    {
      icon: UserX,
      title: "Funcionários Inativos",
      value: String(funcionarios.filter((f) => f.status === "Inativo").length),
      color: "text-red-600",
      bgColor: "bg-red-100",
      isMoeda: false,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Funcionários</h1>
          <p className="text-sm text-gray-600 mt-1">Gerencie informações dos colaboradores</p>
        </div>
        <Button onClick={abrirNovo} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4" /> Novo Funcionário</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
              <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Equipe</h3>
        {erro && <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
        {carregando && <p className="text-sm text-gray-500">Carregando funcionários...</p>}
        {!carregando && funcionarios.length === 0 && <p className="text-sm text-gray-500">Nenhum funcionário cadastrado.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {funcionarios.map((employee) => (
            <div
              key={employee.id}
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Avatar>
                {employee.photo && <AvatarImage src={employee.photo} alt={`Foto de ${employee.name}`} />}
                <AvatarFallback className="bg-blue-600 text-white">
                  {employee.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{employee.name}</p>
                <p className="text-sm text-gray-600">{employee.role}</p>
                <p className="text-xs text-gray-500">{employee.department}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${employee.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${employee.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {employee.status}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => abrirEdicao(employee)} className="h-7 w-7 text-blue-600 hover:text-blue-600"><Edit2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal de Cadastro/Edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{editando ? "Editar Funcionário" : "Novo Funcionário"}</h2>
              <Button variant="ghost" size="icon" onClick={fecharModal} className="h-8 w-8 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid gap-4">
              <div>
                <Label>Foto do Funcionário</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Avatar className="size-16">
                    {form.photo && <AvatarImage src={form.photo} alt="Prévia da foto do funcionário" />}
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg">
                      {form.name ? form.name.split(" ").map((nome) => nome[0]).slice(0, 2).join("").toUpperCase() : <Camera className="w-5 h-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-wrap gap-2">
                    <label htmlFor="foto-funcionario" className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-white px-3 text-sm font-medium hover:bg-gray-50">
                      <Camera className="w-4 h-4" /> Anexar foto
                    </label>
                    <input id="foto-funcionario" type="file" accept="image/*" onChange={selecionarFoto} className="hidden" />
                    {form.photo && <Button type="button" variant="ghost" onClick={() => setForm({ ...form, photo: undefined })} className="h-9 text-red-600 hover:text-red-700">Remover</Button>}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do funcionário" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-mail de Acesso *</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@321go.com" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editando ? "Deixe em branco para não alterar" : "Senha de acesso"} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Cargo</Label>
                  <Input id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ex: Gerente de Vendas" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Input id="department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Ex: Comercial" className="mt-1" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="saudacoes">Saudações (frase para o cliente no Roteiro)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSaudacoesExpandido((atual) => !atual)}
                    className="h-8 gap-1"
                  >
                    {saudacoesExpandido ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    {saudacoesExpandido ? "Minimizar" : "Maximizar"}
                  </Button>
                </div>
                <Textarea
                  id="saudacoes"
                  value={form.saudacoes || ""}
                  onChange={(e) => setForm({ ...form, saudacoes: e.target.value })}
                  placeholder={"Escreva 3 parágrafos para saudação do cliente no roteiro.\n\nParágrafo 1...\n\nParágrafo 2...\n\nParágrafo 3..."}
                  className={`mt-1 transition-all ${saudacoesExpandido ? "min-h-56" : "min-h-28"}`}
                />
                <p className="mt-1 text-xs text-gray-500">Recomendado: 3 parágrafos para aparecer no roteiro do cliente.</p>
              </div>
              <div>
                <Label>Status</Label>
                <div className="flex gap-2 mt-1">
                  {(["Ativo", "Inativo"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
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
              <div>
                <Label>Nível de Acesso</Label>
                <div className="flex gap-2 mt-1">
                  {(["Administrador", "Agente"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setForm({ ...form, accessLevel: level })}
                      className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                        form.accessLevel === level ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={fecharModal}>Cancelar</Button>
              <Button onClick={salvar} disabled={salvando || !form.name.trim() || !form.email.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                {salvando ? "Salvando..." : editando ? "Salvar Alterações" : "Cadastrar Funcionário"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

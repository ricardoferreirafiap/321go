import { API_CONFIG } from "../data/apiConfig";
import { Users, UserPlus, Package, CheckSquare, Briefcase } from "lucide-react";
import { Card } from "./ui/card";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

interface Counts {
  clientes: number;
  fornecedores: number;
  produtos: number;
  tarefas: number;
  funcionarios: number;
}

const API_BASE_URL = API_CONFIG.apiBase;

const cadastroOptions = [
  {
    icon: Users,
    title: "Clientes",
    description: "Gerenciar cadastro de clientes",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    countKey: "clientes" as keyof Counts,
    route: "/cadastros/clientes",
  },
  {
    icon: UserPlus,
    title: "Fornecedores",
    description: "Gerenciar fornecedores",
    color: "text-green-600",
    bgColor: "bg-green-100",
    countKey: "fornecedores" as keyof Counts,
    route: "/cadastros/fornecedores",
  },
  {
    icon: Package,
    title: "Produtos",
    description: "Cadastro de produtos e serviços",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    countKey: "produtos" as keyof Counts,
    route: "/cadastros/produtos",
  },
  {
    icon: CheckSquare,
    title: "Tarefas",
    description: "Gerenciar tarefas e atividades",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    countKey: "tarefas" as keyof Counts,
    route: "/cadastros/tarefas",
  },
  {
    icon: Briefcase,
    title: "Funcionários",
    description: "Gerencie os usuários e colaboradores.",
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    countKey: "funcionarios" as keyof Counts,
    route: "/funcionario",
  },
];

export default function Cadastros() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/counts`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Counts) => setCounts(data))
      .catch(() => {/* silencia erro — os cards ficam sem contagem */});
  }, []);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Cadastros</h1>
      <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">Gerencie todos os cadastros do sistema</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cadastroOptions.map((option) => {
          const Icon = option.icon;
          const count = counts ? counts[option.countKey] : null;

          return (
            <Card
              key={option.title}
              onClick={() => navigate(option.route)}
              className="p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer hover:border-blue-300 active:scale-95"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${option.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${option.color}`} />
                </div>
                {count !== null && (
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${option.bgColor} ${option.color}`}>
                    {count.toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{option.title}</h3>
              <p className="text-xs sm:text-sm text-gray-500">{option.description}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
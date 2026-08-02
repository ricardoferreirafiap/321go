export interface Cliente {
  id: number;
  nome: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  cidade: string;
  estado: string;
  status: "Ativo" | "Inativo";
  cpfCnpj: string;
  rg: string;
  dataNascimento: string;
  documentoNome: string;
}

export type ClienteForm = Omit<Cliente, "id">;

export const clientesIniciais: Cliente[] = [
  { id: 1, nome: "", nomeCompleto: "Ana Paula Souza", email: "ana.souza@email.com", telefone: "(11) 99876-5432", cep: "", endereco: "", numero: "", complemento: "", cidade: "São Paulo", estado: "SP", status: "Ativo", cpfCnpj: "123.456.789-00", rg: "", dataNascimento: "", documentoNome: "" },
  { id: 2, nome: "", nomeCompleto: "Carlos Mendes", email: "carlos.mendes@empresa.com", telefone: "(21) 98765-4321", cep: "", endereco: "", numero: "", complemento: "", cidade: "Rio de Janeiro", estado: "RJ", status: "Ativo", cpfCnpj: "987.654.321-00", rg: "", dataNascimento: "", documentoNome: "" },
  { id: 3, nome: "", nomeCompleto: "Fernanda Lima", email: "fernanda@loja.com.br", telefone: "(31) 97654-3210", cep: "", endereco: "", numero: "", complemento: "", cidade: "Belo Horizonte", estado: "MG", status: "Inativo", cpfCnpj: "456.789.123-00", rg: "", dataNascimento: "", documentoNome: "" },
  { id: 4, nome: "", nomeCompleto: "João Victor Reis", email: "joao.reis@mail.com", telefone: "(41) 96543-2109", cep: "", endereco: "", numero: "", complemento: "", cidade: "Curitiba", estado: "PR", status: "Ativo", cpfCnpj: "321.654.987-00", rg: "", dataNascimento: "", documentoNome: "" },
  { id: 5, nome: "", nomeCompleto: "Mariana Costa", email: "mariana.costa@email.com", telefone: "(51) 95432-1098", cep: "", endereco: "", numero: "", complemento: "", cidade: "Porto Alegre", estado: "RS", status: "Ativo", cpfCnpj: "654.321.098-00", rg: "", dataNascimento: "", documentoNome: "" },
  { id: 6, nome: "", nomeCompleto: "Ricardo Alves", email: "r.alves@negocio.com", telefone: "(85) 94321-0987", cep: "", endereco: "", numero: "", complemento: "", cidade: "Fortaleza", estado: "CE", status: "Inativo", cpfCnpj: "789.012.345-00", rg: "", dataNascimento: "", documentoNome: "" },
];

const CHAVE_CLIENTES = "clientes";

export function obterClientes(): Cliente[] {
  const armazenados = localStorage.getItem(CHAVE_CLIENTES);
  if (!armazenados) return clientesIniciais;

  try {
    return JSON.parse(armazenados);
  } catch {
    return clientesIniciais;
  }
}

export function salvarClientes(clientes: Cliente[]) {
  localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(clientes));
}

import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import Cadastros from "./components/Cadastros";
import CadastroClientes from "./components/CadastroClientes";
import CadastroFornecedores from "./components/CadastroFornecedores";
import CadastroProdutos from "./components/CadastroProdutos";
import CadastroTarefas from "./components/CadastroTarefas";
import Financeiro from "./components/Financeiro";
import Orcamentos from "./components/Orcamentos";
import Voucher from "./components/Voucher";
import Relatorios from "./components/Relatorios";
import RelatorioVendas from "./components/RelatorioVendas";
import RelatorioFinanceiro from "./components/RelatorioFinanceiro";
import RelatorioClientes from "./components/RelatorioClientes";
import RelatorioOrcamentos from "./components/RelatorioOrcamentos";
import RoteiroOrcamento from "./components/RoteiroOrcamento";
import CRM from "./components/CRM";
import Marketing from "./components/Marketing";
import Funcionario from "./components/Funcionario";
import LeadDashboard from "./components/LeadDashboard";
import LeadList from "./components/LeadList";
import ResumoOrcamento from "./components/ResumoOrcamento";
import Login from "./components/Login";
import AuthLayout from "./components/AuthLayout";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/",
        Component: Root,
        children: [
          { index: true, Component: LeadDashboard },
          { path: "leads/list", Component: LeadList },
          { path: "crm", Component: CRM },
          { path: "cadastros", Component: Cadastros },
          { path: "cadastros/clientes", Component: CadastroClientes },
          { path: "cadastros/fornecedores", Component: CadastroFornecedores },
          { path: "cadastros/produtos", Component: CadastroProdutos },
          { path: "cadastros/tarefas", Component: CadastroTarefas },
          { path: "financeiro", Component: Financeiro },
          { path: "financeiro/voucher", Component: Voucher },
          { path: "financeiro/orcamentos", Component: Orcamentos },
          { path: "relatorios", Component: Relatorios },
          { path: "relatorios/vendas", Component: RelatorioVendas },
          { path: "relatorios/financeiro", Component: RelatorioFinanceiro },
          { path: "relatorios/clientes", Component: RelatorioClientes },
          { path: "relatorios/orcamentos", Component: RelatorioOrcamentos },
          { path: "marketing", Component: Marketing },
          { path: "funcionario", Component: Funcionario },
        ],
      },
    ],
  },
  {
    path: "/financeiro/orcamentos/roteiro/:numero",
    Component: RoteiroOrcamento,
  },
  {
    path: "/roteiro/:numero",
    Component: RoteiroOrcamento,
  },
  {
    path: "/financeiro/orcamentos/resumo/:numero",
    Component: ResumoOrcamento,
  },
]);

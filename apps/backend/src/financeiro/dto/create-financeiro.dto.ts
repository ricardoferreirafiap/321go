export class CreateFinanceiroDto {
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number | string;
  comissaoPercentual?: number | null;
  comissaoValor?: number | null;
  data: string;
  oculto?: boolean;
  orcamentoPago?: boolean;
  formaPagamento?: string;
  parcelas?: number | null;
  orcamentoId?: number | null;
  orcamentoNumero?: string | null;
  cliente?: string | null;
}


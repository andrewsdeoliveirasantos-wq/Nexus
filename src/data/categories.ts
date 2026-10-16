import { CategoryInfo } from '../types.ts';

export const EXPENSE_CATEGORIES: CategoryInfo[] = [
  { id: 'alimentacao', name: 'Alimentação & Mercado', color: '#f97316', type: 'expense' },
  { id: 'moradia', name: 'Moradia & Contas', color: '#3b82f6', type: 'expense' },
  { id: 'transporte', name: 'Transporte & Mobilidade', color: '#8b5cf6', type: 'expense' },
  { id: 'saude', name: 'Saúde & Farmácia', color: '#ef4444', type: 'expense' },
  { id: 'lazer', name: 'Lazer & Restaurantes', color: '#ec4899', type: 'expense' },
  { id: 'educacao', name: 'Educação & Livros', color: '#06b6d4', type: 'expense' },
  { id: 'servicos', name: 'Assinaturas & Conectividade', color: '#6366f1', type: 'expense' },
  { id: 'compras', name: 'Vestuário & Compras', color: '#14b8a6', type: 'expense' },
  { id: 'outros_gastos', name: 'Outras Despesas', color: '#64748b', type: 'expense' },
];

export const INCOME_CATEGORIES: CategoryInfo[] = [
  { id: 'salario_5_dia_util', name: 'Salário (5º Dia Útil)', color: '#10b981', type: 'income' },
  { id: 'adiantamento_salarial', name: 'Adiantamento Salarial (Vale)', color: '#059669', type: 'income' },
  { id: 'entradas_diversas', name: 'Entradas Diversas / Renda Extra', color: '#3b82f6', type: 'income' },
  { id: 'freelance', name: 'Freelance & Bicos', color: '#34d399', type: 'income' },
  { id: 'salario', name: 'Salário Principal', color: '#14b8a6', type: 'income' },
  { id: 'investimentos', name: 'Dividendos & Rendimentos', color: '#06b6d4', type: 'income' },
  { id: 'reembolsos', name: 'Reembolsos & Outros', color: '#0d9488', type: 'income' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const PAYMENT_METHODS: { id: string; label: string }[] = [
  { id: 'pix', label: 'Pix' },
  { id: 'credit_card', label: 'Cartão de Crédito' },
  { id: 'debit_card', label: 'Cartão de Débito' },
  { id: 'bank_slip', label: 'Boleto Bancário' },
  { id: 'cash', label: 'Dinheiro / Espécie' },
];

export function getCategoryColor(name: string): string {
  const found = ALL_CATEGORIES.find(c => c.name.toLowerCase() === name.toLowerCase());
  return found ? found.color : '#64748b';
}

export function getPaymentMethodLabel(method: string): string {
  const found = PAYMENT_METHODS.find(m => m.id === method);
  return found ? found.label : method;
}

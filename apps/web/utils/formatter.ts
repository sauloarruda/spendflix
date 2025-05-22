const dayFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit' });
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: '2-digit',
  weekday: 'short',
});
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' });
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function transactionAmountClass(amount: number) {
  return amount >= 0 ? 'text-green-900' : 'text-red-900';
}

export { dayFormatter, dateFormatter, monthFormatter, currencyFormatter, transactionAmountClass };

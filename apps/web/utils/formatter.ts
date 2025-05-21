const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit' });
const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const currencyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export { dateFormat, monthFormat, currencyFormat };

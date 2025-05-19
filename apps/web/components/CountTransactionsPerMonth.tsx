import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { useEffect, useState } from 'react';

import { countTransactionsPerMonthAction } from '@/actions/accounts';

interface Props {
  accountId: string;
  ts: number;
}

export default function CountTransactionsPerMonth({ accountId, ts }: Props) {
  const [transactionsPerMonth, setTransactionsPerMonth] = useState<
    { month: Date; _count: number; _sum: number }[] | undefined
  >();

  useEffect(() => {
    console.log('useEffect triggered', { ts, accountId });

    const fetchData = async () => {
      const data = await countTransactionsPerMonthAction(accountId);
      setTransactionsPerMonth(data);
    };

    if (accountId && ts > 0) {
      fetchData();
    }
  }, [ts, accountId]);

  if (!transactionsPerMonth) return <></>;

  return (
    <DataTable value={transactionsPerMonth} stripedRows>
      <Column field="month" header="Ano / Mês" />
      <Column
        header="Lançamentos"
        align="center"
        body={(row) => row._count.toLocaleString('pt-BR')}
      />
      <Column header="Total" align="center" body={(row) => row._sum.toLocaleString('pt-BR')} />
    </DataTable>
  );
}

import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { useEffect, useState } from 'react';

import { countTransactionsPerMonthAction } from '@/actions/accounts';
import { getSessionCookie } from '@/utils/cookie';

interface Props {
  accountId: string;
  ts: number;
  onUpdate: (monthsCount: number) => void;
}

export default function CountTransactionsPerMonth({ accountId, ts, onUpdate }: Props) {
  const [transactionsPerMonth, setTransactionsPerMonth] = useState<
    { month: Date; _count: number; _sum: number }[] | undefined
  >();

  useEffect(() => {
    const fetchData = async () => {
      const data = await countTransactionsPerMonthAction(getSessionCookie(), accountId);
      setTransactionsPerMonth(data);
      onUpdate(data.length);
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

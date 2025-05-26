import { Accordion, AccordionTab } from 'primereact/accordion';
import { Skeleton } from 'primereact/skeleton';
import { useState } from 'react';

import { Account } from '@/prisma';

import SourceFile from '../inputs/SourceFile';
import CountTransactionsPerMonth from '../reports/CountTransactionsPerMonth';

type AccountAccordionProps = {
  account: Account;
  onUpdate: (count: number) => void;
};
export default function AccountAccordion({ account, onUpdate }: AccountAccordionProps) {
  const [accountTs, setAccountTs] = useState(1);

  if (!account) return <Skeleton width="10rem"></Skeleton>;

  return (
    <Accordion multiple activeIndex={null}>
      <AccordionTab
        header={
          <div className="flex justify-between items-center w-full">
            <span className={`text-${account.color}`}>{account.name}</span>
            <span className="text-blue-500 text-xs hover:underline">Como obter o extrato?</span>
          </div>
        }
      >
        <SourceFile accountId={account.id} onSuccess={() => setAccountTs(new Date().getTime())} />
        <CountTransactionsPerMonth accountId={account.id} ts={accountTs} onUpdate={onUpdate} />
      </AccordionTab>
    </Accordion>
  );
}

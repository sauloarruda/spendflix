import { TransactionsFilter, transactionsService } from '@/modules/transactions';
import { NextRequest, NextResponse } from 'next/server';

import { InvalidAuthenticationError } from '@/actions/InvalidAuthenticationError';
import { authorizeAction } from '@/actions/serverActions';
import { TransactionDto } from '@/actions/transactions';

async function getTransactionsByFilterAction(
  filter: TransactionsFilter,
): Promise<TransactionDto[]> {
  return (await transactionsService.getTransactionsByFilter(filter)).map((transaction) => ({
    id: transaction.id,
    date: transaction.date,
    description: transaction.description,
    amount: transaction.amount,
    categoryName: transaction.category?.name ?? 'Sem categoria',
    categoryColor: transaction.category?.color ?? 'red-900',
    accountName: transaction.account!.name,
    accountColor: transaction.account!.color,
    notes: transaction.notes,
    isHidden: transaction.isHidden,
    updatedAt: transaction.updatedAt,
  }));
}

export async function GET(req: NextRequest) {
  try {
    // Get session cookie from the request
    const sessionCookie = req.cookies.get('session')?.value;
    const transactions = await authorizeAction(sessionCookie, async () => {
      let userId: number | undefined;

      const { searchParams } = new URL(req.url);
      const userIdParam = searchParams.get('userId');
      if (userIdParam) userId = parseInt(userIdParam, 10);
      if (!userId) {
        throw new Error('Missing userId');
      }

      // Fetch transactions
      const txs = await getTransactionsByFilterAction({ userId });
      // Find the latest updatedAt in memory
      const lastModified = txs.length
        ? new Date(Math.max(...txs.map((tx) => new Date(tx.updatedAt).getTime()))).toUTCString()
        : undefined;
      const ifModifiedSince = req.headers.get('if-modified-since');
      if (lastModified && ifModifiedSince && new Date(lastModified) <= new Date(ifModifiedSince)) {
        return new NextResponse(null, { status: 304 });
      }
      const response = NextResponse.json(txs);
      if (lastModified) {
        response.headers.set('Last-Modified', lastModified);
      }
      return response;
    });
    return transactions;
  } catch (error) {
    if (error instanceof InvalidAuthenticationError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Missing userId') {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

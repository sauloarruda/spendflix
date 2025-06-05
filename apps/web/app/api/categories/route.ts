import { NextResponse } from 'next/server';

import { getCategoriesAction } from '@/actions/categories';
import type { Category } from '@/prisma';

// In-memory cache
let cachedCategories: Category[] | null = null;
let lastFetch: number | null = null;
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours (adjust as needed)

export async function GET() {
  try {
    const now = Date.now();
    if (!cachedCategories || !lastFetch || now - lastFetch > CACHE_TTL) {
      cachedCategories = await getCategoriesAction();
      lastFetch = now;
    }
    return NextResponse.json(cachedCategories, {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

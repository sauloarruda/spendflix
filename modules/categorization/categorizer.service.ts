import { CategoryRule } from '@/prisma';

import getLogger from '@/common/logger';
import getPrisma from '@/common/prisma';

const logger = getLogger().child({ module: 'categorizer' });

function sanitizeDescription(description: string): string {
  // 1. Remove "Parcela X/X" pattern
  let sanitized = description.replace(/Parcela\s+\d+\/\d+/gi, '');

  // 2. Remove non-alphanumeric characters (except spaces)
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, '');

  // 3. Replace accented characters with their non-accented equivalents
  sanitized = sanitized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 4. Apply trim
  sanitized = sanitized.trim();

  return sanitized;
}

async function inferCategory(
  description: string,
  accountId: string,
): Promise<CategoryRule | undefined> {
  const sanitizedDescription = sanitizeDescription(description);
  const rules = await getPrisma().$queryRawUnsafe<CategoryRule[]>(
    `
    SELECT
      r.*,
      GREATEST(
        similarity($1, r."keyword"),
        CASE WHEN $1 ILIKE '%' || r.keyword || '%' THEN 1.0 ELSE 0 END
      ) AS "score"
    FROM
      "category_rules" r
    WHERE 
      similarity($1, r.keyword) > 0.3
      OR $1 ILIKE '%' || r.keyword || '%'
    ORDER BY "score" desc, "ocurrences" desc, "updatedAt" desc
    `,
    sanitizedDescription,
  );
  logger.debug({ sanitizeDescription, accountId, rules }, 'Categories matched');
  return rules.length ? rules[0] : undefined;
}

async function findOrCreateUserRule(description: string, categoryId: string, userId: number) {
  const sanitizedDescription = sanitizeDescription(description);
  const data = {
    keyword: sanitizedDescription,
    userId,
    categoryId,
  };
  return getPrisma().categoryRule.upsert({
    where: {
      keyword_userId_categoryId: data,
    },
    update: {},
    create: data,
  });
}

const categorizerService = { inferCategory, sanitizeDescription, findOrCreateUserRule };
export default categorizerService;

import { CategoryRule } from '@/prisma';
import { PrismaClient } from '@prisma/client';

import getLogger from '@/common/logger';
import getPrisma from '@/common/prisma';

function sanitizeDescription(description: string): string {
  // 1. Remove "Parcela X/X" pattern
  let sanitized = description.replace(/Parcela\s+\d+\/\d+/gi, '');

  // 2. Replace accented characters with their non-accented equivalents
  sanitized = sanitized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 3. Remove non-alphanumeric characters (except spaces)
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, '');

  // 4. Collapse multiple spaces into one
  sanitized = sanitized.replace(/\s+/g, ' ');

  // 5. Apply trim and lowercase
  sanitized = sanitized.trim().toLowerCase();

  return sanitized;
}

// eslint-disable-next-line max-lines-per-function
async function findCategory(description: string, accountId: string, amount: number) {
  const logger = getLogger().child({ module: 'categorizer' });
  const sanitizedDescription = sanitizeDescription(description);
  const exactMatchSql = "$1 ~* ('\\m' || r.\"keyword\" || '\\M')";
  const sql = `
    SELECT
      r.*,
      GREATEST(
        similarity($1, r."keyword"),
        CASE WHEN ${exactMatchSql} THEN 1.0 ELSE 0 END
      ) AS "score"
    FROM
      "category_rules" r
    WHERE 
      (r."accountId" = $2 OR r."accountId" IS NULL)
      AND (similarity($1, r."keyword") > 0.3
      OR ${exactMatchSql})
    ORDER BY "accountId", "score" desc, "ocurrences" desc, "updatedAt" desc
    `;
  const rules = await getPrisma().$queryRawUnsafe<CategoryRule[]>(
    sql,
    sanitizedDescription,
    accountId,
  );
  logger.debug({ sanitizeDescription, accountId, rules }, 'Categories matched');
  return rules.length
    ? categoryRuleToMatch(rules[0] as CategoryRuleWithScore)
    : inferCategoryByAmount(amount, accountId);
}

const INCOMING_CATEGORY_NAME = 'Receitas';
async function inferCategoryByAmount(
  amount: number,
  accountId: string,
): Promise<CategorizerMatch | undefined> {
  if (amount > 0) {
    const category = await getPrisma().category.findUnique({
      where: { name: INCOMING_CATEGORY_NAME },
    });
    if (!category) return undefined;
    return {
      categoryRuleId: null,
      categoryId: category.id,
      accountId,
      score: 0,
    };
  }
  return undefined;
}

export type CategorizerMatch = {
  categoryId: string;
  categoryRuleId: string | null;
  score: number;
  accountId: string | null;
};

type CategoryRuleWithScore = CategoryRule & { score: number };

function categoryRuleToMatch(rule: CategoryRuleWithScore): CategorizerMatch {
  return {
    categoryId: rule.categoryId,
    categoryRuleId: rule.id,
    accountId: rule.accountId,
    score: rule.score,
  };
}

async function inferCategory(
  description: string,
  accountId: string,
  amount: number,
): Promise<CategorizerMatch | undefined> {
  // make sure that account exists
  await getPrisma().account.findFirstOrThrow({ where: { id: accountId } });
  return findCategory(description, accountId, amount);
}

// eslint-disable-next-line max-params
async function findOrCreateUserRule(
  description: string,
  categoryId: string,
  accountId: string,
  tx: PrismaClient,
) {
  const sanitizedDescription = sanitizeDescription(description);
  const data = {
    keyword: sanitizedDescription,
    accountId,
    categoryId,
  };
  return tx.categoryRule.upsert({
    where: {
      keyword_accountId_categoryId: data,
    },
    update: {},
    create: data,
  });
}

const categorizerService = { inferCategory, sanitizeDescription, findOrCreateUserRule };
export default categorizerService;

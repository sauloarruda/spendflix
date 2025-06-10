import type { User, Account, Category } from '@/prisma';

import getPrisma from '@/common/prisma';

import {
  userFactory,
  accountFactory,
  categoryFactory,
  categoryRuleFactory,
} from '../test/factories';

import categorizerService from './categorizer.service';

const uid = Math.random().toString(36).slice(2);

describe('categorizerService', () => {
  let user: User;
  let account: Account;
  let category: Category;
  let account2: Account;
  const testCategoryName = `Alimentação-test-${uid}`;

  beforeAll(async () => {
    user = await userFactory.create({ email: `user-${uid}@test.com` });
    account = await accountFactory.create({
      user: { connect: { id: user.id } },
      name: `Conta-${uid}`,
    });
    account2 = await accountFactory.create({
      user: { connect: { id: user.id } },
      name: `Conta2-${uid}`,
    });
    category = await categoryFactory.create({ name: testCategoryName });
  });

  afterEach(async () => {
    await getPrisma().categoryRule.deleteMany({ where: { keyword: { contains: uid } } });
  });

  afterAll(async () => {
    await getPrisma().categoryRule.deleteMany({ where: { keyword: { contains: uid } } });
    await getPrisma().account.deleteMany({ where: { name: { contains: uid } } });
    await getPrisma().user.deleteMany({ where: { email: { contains: uid } } });
    await getPrisma().category.deleteMany({ where: { name: { contains: uid } } });
  });

  it('matches with category rules without accountId (global rule)', async () => {
    const keyword = `adega-${uid}`;
    const rule = await categoryRuleFactory.create({
      keyword,
      category: { connect: { id: category.id } },
      account: undefined,
    });
    const match = await categorizerService.inferCategory(keyword, account.id, 0);
    expect(match).toBeDefined();
    expect(match!.categoryRuleId).toBe(rule.id);
    expect(match!.categoryId).toBe(category.id);
    expect(match!.accountId).toBeNull();
    expect(match!.score).toBeGreaterThan(0.7);
  });

  it('matches with category rules with and without accountId (prefers account-specific)', async () => {
    const keyword = `bistro-${uid}`;
    await categoryRuleFactory.create({
      keyword,
      category: { connect: { id: category.id } },
      account: undefined,
      ocurrences: 1,
    });
    const userRule = await categoryRuleFactory.create({
      keyword,
      category: { connect: { id: category.id } },
      account: { connect: { id: account.id } },
      ocurrences: 2,
    });
    // Should prefer the account-specific rule
    const match = await categorizerService.inferCategory(keyword, account.id, 0);
    expect(match).toBeDefined();
    expect(match!.categoryRuleId).toBe(userRule.id);
    expect(match!.accountId).toBe(account.id);
    expect(match!.score).toBeGreaterThan(0.7);
  });

  it('matches with exact match and similarity, prefers higher score', async () => {
    // Similarity > 0.3 but not exact
    const simKeyword = `burger-${uid}`;
    await categoryRuleFactory.create({
      keyword: simKeyword,
      category: { connect: { id: category.id } },
      account: { connect: { id: account.id } },
      ocurrences: 1,
    });
    // Exact match
    const exactKeyword = `burger king-${uid}`;
    await categoryRuleFactory.create({
      keyword: exactKeyword,
      category: { connect: { id: category.id } },
      account: { connect: { id: account.id } },
      ocurrences: 2,
    });
    // Match for similarity
    const simMatch = await categorizerService.inferCategory(simKeyword, account.id, 0);
    // Match for exact
    const exactMatch = await categorizerService.inferCategory(exactKeyword, account.id, 0);
    expect(simMatch).toBeDefined();
    expect(exactMatch).toBeDefined();
    expect(simMatch!.score).toBeGreaterThan(0.7);
    expect(exactMatch!.score).toBeGreaterThan(0.7);
    expect(exactMatch!.score).toBeGreaterThan(simMatch!.score);
  });

  it('orders by score, ocurrences, updatedAt', async () => {
    // Use different accounts to avoid unique constraint
    const keyword = `padaria-${uid}`;
    const rule1 = await categoryRuleFactory.create({
      keyword,
      category: { connect: { id: category.id } },
      account: { connect: { id: account.id } },
      ocurrences: 1,
    });
    const rule2 = await categoryRuleFactory.create({
      keyword,
      category: { connect: { id: category.id } },
      account: { connect: { id: account2.id } },
      ocurrences: 3,
    });
    // Update rule1 to have newer updatedAt
    await getPrisma().categoryRule.update({
      where: { id: rule1.id },
      data: { updatedAt: new Date(Date.now() + 1000) },
    });
    const match = await categorizerService.inferCategory(keyword, account2.id, 0);
    // Should prefer rule2 (higher ocurrences)
    expect(match).toBeDefined();
    expect(match!.categoryRuleId).toBe(rule2.id);
  });

  it('returns undefined if no match', async () => {
    const match = await categorizerService.inferCategory(`NoMatchKeyword-${uid}`, account.id, 0);
    expect(match).toBeUndefined();
  });

  it('returns Receitas category when value is positive and there is no matching rule', async () => {
    // Ensure Receitas category exists
    const receitasCategory = await getPrisma().category.findFirst({ where: { name: 'Receitas' } });
    const description = `NoMatchKeyword-${uid}`;
    const amount = 100;
    // No category rules created for this description
    const match = await categorizerService.inferCategory(description, account.id, amount);
    expect(match).toBeDefined();
    expect(match!.categoryId).toBe(receitasCategory?.id);
    expect(match!.categoryRuleId).toBeNull();
    expect(match!.score).toBe(0);
    expect(match!.accountId).toBe(account.id);
  });
});

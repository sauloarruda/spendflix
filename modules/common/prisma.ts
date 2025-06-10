import { Prisma, PrismaClient } from '@/prisma';
import chalk from 'chalk';

import getConfig from './config';
import getLogger from './logger';

const logger = getLogger().child({ module: 'prisma' });

const prismaClientPropertyName = '__prevent-name-collision__prisma';
type GlobalThisWithPrismaClient = typeof globalThis & {
  [prismaClientPropertyName]: PrismaClient;
};

// SQL keywords for syntax highlighting
const SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'AND',
  'OR',
  'ORDER BY',
  'GROUP BY',
  'LIMIT',
  'OFFSET',
  'INSERT INTO',
  'UPDATE',
  'DELETE FROM',
  'VALUES',
  'SET',
  'JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'INNER JOIN',
  'ON',
  'AS',
  'IN',
  'BETWEEN',
  'LIKE',
  'IS NULL',
  'IS NOT NULL',
  'DISTINCT',
  'COUNT',
  'SUM',
  'AVG',
  'MAX',
  'MIN',
  'HAVING',
  'UNION',
  'ALL',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'EXISTS',
  'NOT EXISTS',
  'INTO',
  'CREATE TABLE',
  'ALTER TABLE',
  'DROP TABLE',
  'INDEX',
  'PRIMARY KEY',
  'FOREIGN KEY',
  'REFERENCES',
  'CONSTRAINT',
  'DEFAULT',
  'UNIQUE',
  'CHECK',
  'CASCADE',
  'RESTRICT',
  'NO ACTION',
  'SET NULL',
  'SET DEFAULT',
].join('|');

function formatSqlKeywords(query: string): string {
  return query.replace(new RegExp(`\\b(${SQL_KEYWORDS})\\b`, 'g'), (match) => chalk.blue(match));
}

function formatTableNames(query: string): string {
  return query.replace(/"(public"."([^"]+)")|("t\d+")/g, (match) => chalk.yellow(match));
}

function replaceParameters(query: string, params: unknown[]): string {
  return query.replace(/\$(\d+)/g, (_, index) => {
    const param = params[Number(index) - 1];
    let value = String(param);
    if (param === null) value = 'NULL';
    if (typeof param === 'string') value = `'${param.replace(/'/g, "''")}'`;
    if (Array.isArray(param)) value = `'${JSON.stringify(param).replace(/'/g, "''")}'`;
    if (typeof param === 'object') value = `'${JSON.stringify(param).replace(/'/g, "''")}'`;
    return chalk.cyan(value);
  });
}

function formatQueryLog(query: string, params: unknown[], duration: number): string {
  const formattedQuery = formatTableNames(formatSqlKeywords(query));
  const executableQuery = replaceParameters(formattedQuery, params);

  return [
    chalk.cyan('prisma.query'),
    '-> [',
    executableQuery,
    // eslint-disable-next-line no-magic-numbers
    ['] in', duration > 10 ? chalk.red(duration) : chalk.green(duration), 'ms'].join(' '),
  ].join(' ');
}

let prismaClient: PrismaClient;
// eslint-disable-next-line max-lines-per-function
function createClient() {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: getConfig().DATABASE_URL,
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'stdout',
          level: 'error',
        },
        {
          emit: 'stdout',
          level: 'info',
        },
        {
          emit: 'stdout',
          level: 'warn',
        },
      ],
    });
    prismaClient.$on('query' as never, (e: Prisma.QueryEvent) => {
      const { query: rawQuery, params: rawParams, duration } = e;
      const query = rawQuery.replace(/\s+/g, ' ').trim();
      const params = rawParams ? JSON.parse(rawParams) : [];
      logger.debug(formatQueryLog(query, params, duration));
    });
  }
  return prismaClient;
}

export default function getPrisma(): PrismaClient {
  if (process.env.NODE_ENV !== 'production') {
    const newGlobalThis = globalThis as GlobalThisWithPrismaClient;
    if (!newGlobalThis[prismaClientPropertyName]) {
      newGlobalThis[prismaClientPropertyName] = createClient();
    }
    return newGlobalThis[prismaClientPropertyName];
  }
  return createClient();
}

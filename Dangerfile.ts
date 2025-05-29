import { danger, warn, fail, message } from 'danger';

// 1. Check if the PR description is filled out
if (!danger.github.pr.body ?? danger.github.pr.body.length < 10) {
  fail('⚠️ Pull Request must have a proper description explaining the changes.');
}

// 2. Warn if sensitive files were modified
const sensitiveFiles = ['serverless.ts', '.env', '.env.example'];
const modifiedSensitiveFiles = danger.git.modified_files.filter((file) =>
  sensitiveFiles.some((sensitive) => file.includes(sensitive)),
);
if (modifiedSensitiveFiles.length > 0) {
  warn(`🛡️ Attention! You modified sensitive files: ${modifiedSensitiveFiles.join(', ')}`);
}

// 3. Warn if openapi.yaml changed but types were not updated
const openapiChanged = danger.git.modified_files.includes('services/auth/openapi.yaml');
const typesChanged = danger.git.modified_files.some((f) =>
  f.includes('services/auth/src/types/api.d.ts'),
);

if (openapiChanged && !typesChanged) {
  warn(
    '📝 You modified `openapi.yaml` but did not update the types. Please run `pnpm generate:types`.',
  );
}

// 4. Congratulate on small PRs
const bigPRThreshold = 600; // lines
const additions = danger.github.pr.additions ?? 0;
const deletions = danger.github.pr.deletions ?? 0;
const changedLines = additions + deletions;

if (changedLines < bigPRThreshold) {
  message('🎉 Great job keeping this PR small and easy to review!');
}

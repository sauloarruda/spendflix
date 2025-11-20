# Configurações do VSCode/Cursor

Este diretório contém as configurações do workspace para garantir formatação e lint automáticos.

## Extensões Recomendadas

Quando você abrir este workspace, o VSCode/Cursor irá sugerir instalar as seguintes extensões:

### Essenciais
- **ESLint** (`dbaeumer.vscode-eslint`) - Linting para JavaScript/TypeScript/Svelte
- **Prettier** (`esbenp.prettier-vscode`) - Formatação de código
- **Go** (`golang.go`) - Suporte completo para Go
- **Svelte** (`svelte.svelte-vscode`) - Suporte para Svelte

### Úteis
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) - Autocomplete para Tailwind
- **GitLens** (`eamodio.gitlens`) - Melhor visualização do Git
- **Playwright** (`ms-playwright.playwright`) - Suporte para testes E2E

## Funcionalidades Configuradas

### Formatação Automática
- ✅ Formatação ao salvar habilitada
- ✅ Prettier configurado para JavaScript/TypeScript/Svelte
- ✅ Go format configurado com `goimports`
- ✅ Tabs configurados (2 espaços para JS/TS, 1 tab para Go)

### Linting Automático
- ✅ ESLint executa ao salvar
- ✅ golangci-lint configurado para Go
- ✅ Correções automáticas aplicadas ao salvar

### Organização de Imports
- ✅ Imports organizados automaticamente ao salvar
- ✅ Imports não utilizados removidos

## Comandos Úteis

### Atalhos de Teclado

- **Format Document**: `Shift + Alt + F` (ou `Shift + Option + F` no Mac)
- **Fix All**: `Ctrl + Shift + P` → "Fix All Auto-fixable Problems"
- **Organize Imports**: `Shift + Alt + O` (ou `Shift + Option + O` no Mac)

### Tasks Disponíveis

Acesse via `Ctrl + Shift + P` → "Tasks: Run Task":

- **Go: Lint** - Executa golangci-lint
- **Go: Lint Fix** - Executa golangci-lint com auto-fix
- **Go: Test** - Executa testes Go
- **Web: Lint** - Executa ESLint
- **Web: Lint Fix** - Executa ESLint com auto-fix
- **Web: Format** - Formata código com Prettier
- **Web: Test** - Executa testes Playwright

### Debug Configurations

Configurações de debug disponíveis:

- **Debug Go API** - Debug do servidor Go
- **Debug Go Tests** - Debug de testes Go
- **Debug SvelteKit** - Debug do servidor SvelteKit

## Configurações Específicas

### Go
- Linter: `golangci-lint`
- Formatter: `goimports`
- Lint on save: Habilitado
- Organize imports: Automático

### TypeScript/JavaScript/Svelte
- Linter: ESLint 9 (flat config)
- Formatter: Prettier
- Format on save: Habilitado
- Fix on save: Habilitado

## Troubleshooting

### ESLint não está funcionando
1. Certifique-se de que a extensão ESLint está instalada
2. Verifique se `npm install` foi executado em `services/web`
3. Recarregue a janela: `Ctrl + Shift + P` → "Developer: Reload Window"

### Prettier não está formatando
1. Certifique-se de que a extensão Prettier está instalada
2. Verifique se há um arquivo `.prettierrc.cjs` no projeto
3. Verifique se `prettier.requireConfig` está como `true` nas configurações

### Go não está formatando
1. Certifique-se de que a extensão Go está instalada
2. Execute `Go: Install/Update Tools` no Command Palette
3. Verifique se `golangci-lint` está instalado: `make install-linter` em `services/auth`

## Notas

- As configurações são específicas deste workspace
- Algumas configurações podem ser sobrescritas por configurações do usuário
- Sempre execute `npm install` e `go mod tidy` após clonar o repositório

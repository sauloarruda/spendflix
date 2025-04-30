# Spendflix

Spendflix is a personal finance companion designed to help people take control of their money by understanding exactly where it goes each month. Focused on simplicity and real impact, it works by analyzing 3–6 months of bank statements (starting with Nubank), automatically categorizing most transactions, and offering clear, actionable insights. Whether you're chasing a dream or digging out of debt, Spendflix shows you how your spending habits align with your goals — and what to do next.

This project also serves as a technical showcase for a modern, scalable architecture using a monorepo structure and microservices. It includes a web application built with React and Next.js (App Router), user authentication via AWS Cognito, serverless backend with AWS Lambda and API Gateway, and data persistence using PostgreSQL. The infrastructure is deployed with AWS Amplify, and development workflows are optimized with Cursor AI. The architecture is designed with maintainability and scalability in mind, following best practices like domain-driven design (DDD), background processing with queues (e.g., SQS), and modular service boundaries to support future growth.

## 🚀 Tech Stack

- **Frontend**: Next.js (in `apps/web`)
- **Backend**: Node.js and Serverless Framework (in `services/`)
- **Package Manager**: pnpm
- **Build System**: Turborepo (monorepo)
- **Code Quality**: ESLint, Prettier, TypeScript
- **CI/CD**: GitHub Actions
- **Deployment**: AWS Amplify and Lambda
- **Database**: PostgreSQL and AWS DynamoDB
- **Authentication**: AWS Cognito
- **Message Queue**: AWS SQS
- **API Gateway**: AWS API Gateway
- **Infrastructure**: AWS CDK

## 📁 Project Structure

```
spendflix/
├── apps/
│   └── web/          # Next.js frontend application
├── services/
│   └── auth/         # Authentication service
├── scripts/          # Utility scripts
├── .github/          # GitHub Actions workflows
├── .husky/           # Git hooks configuration
├── .vscode/          # Editor settings
└── package.json      # Root package.json
```

## 🛠️ Development

### Prerequisites

- Node.js (20.19.1)
- pnpm (10.9.0)
- PostgreSQL (17.4)
- AWS CLI (latest)
- Serverless Framework (latest)

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/sauloarruda/spendflix.git
   cd spendflix
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Set up AWS credentials:

   ```bash
   aws configure
   ```

5. Set up PostgreSQL:

   ```bash
   # Create database
   createdb spendflix
   # Run migrations
   pnpm migrate
   ```

6. Start development servers:
   ```bash
   pnpm dev
   ```

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all applications and services
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Run ESLint across all packages
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm format` - Format code with Prettier
- `pnpm generate:types` - Generate TypeScript types
- `pnpm migrate` - Run database migrations

## 🔒 Authentication

The authentication service (`services/auth`) handles user authentication and authorization using AWS Cognito. It's deployed separately using:

```bash
pnpm deploy-auth
```

## 📝 Code Quality

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Husky for git hooks
- Danger for automated code review
- GitHub Actions for CI/CD

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the CC-BY-NC-4.0 License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**[Saulo Arruda](https://www.linkedin.com/in/sauloarruda/)**

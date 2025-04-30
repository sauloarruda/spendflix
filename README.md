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

The authentication service uses AWS Cognito for user management. For local development, we use `cognito-local` to emulate Cognito functionality.

### Prerequisites

Before using the Cognito scripts, you need to install:

#### macOS (using Homebrew)

```bash
# Install jq for JSON processing
brew install jq

# Install AWS CLI
brew install awscli

# Configure AWS CLI (use any values for local development)
aws configure
```

#### Windows (using PowerShell)

```powershell
# Install jq using Chocolatey
choco install jq

# Install AWS CLI using MSI installer
# Download from: https://aws.amazon.com/cli/

# Configure AWS CLI (use any values for local development)
aws configure
```

#### Linux (Ubuntu/Debian)

```bash
# Install jq
sudo apt-get update
sudo apt-get install jq

# Install AWS CLI
curl "https://aws.amazon.com/cli/latest/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI (use any values for local development)
aws configure
```

Note: For local development, you can use any values when configuring AWS CLI as we're using cognito-local. However, you need to have the AWS CLI installed and configured.

### Local Cognito Setup

1. First-time setup (creates user pool and client):

   ```bash
   pnpm cognito:setup
   ```

   This will:

   - Start cognito-local
   - Create a user pool named "SpendflixLocal"
   - Create a client named "local"
   - Save the pool and client IDs in `services/auth/.env.local`

   You can run this command anytime to reset your user pool to a fresh state.

2. Starting the auth service:
   ```bash
   cd services/auth
   pnpm dev
   ```
   This will:
   - Start cognito-local in the background
   - Start the serverless offline server
   - Automatically clean up cognito-local when the server stops

### Available Cognito Scripts

- `pnpm cognito:setup` - Initial setup of local Cognito (creates pool and client)
- `pnpm cognito:start` - Just starts cognito-local without setup

### Important Notes

- You only need to run `cognito:setup` once, but you can run it anytime to reset your user pool to a fresh state
- All cognito-local data is stored in `services/auth/.cognito`
- The confirmation code for all users is always `123123`

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

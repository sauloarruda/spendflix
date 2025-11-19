# Spendflix

Spendflix is a personal finance management application designed to help users track their expenses, manage budgets, and gain insights into their spending habits. The platform provides an intuitive interface for users to monitor their financial health and make informed decisions about their money.

## What Spendflix Does

Spendflix empowers users to:
- **Track Expenses**: Record and categorize daily expenses with ease
- **Manage Budgets**: Set and monitor budgets for different spending categories
- **Gain Insights**: Visualize spending patterns through charts and reports
- **Control Finances**: Make data-driven decisions to improve financial well-being

The application follows a modern architecture with a serverless backend and a responsive web frontend, ensuring scalability and a great user experience.

## Documentation

For comprehensive project documentation, including requirements, use cases, and architecture details, please refer to our Notion documentation:

- **[Full Documentation](https://www.notion.so/1e8f4163a77e80b9887ac59218dba7a4?v=1ebf4163a77e8006b152000ced8f3495)** - Complete project documentation
- **[Software Requirements Specification (SRS)](https://www.notion.so/1e8f4163a77e80b9887ac59218dba7a4?v=1ebf4163a77e8006b152000ced8f3495)** - Detailed requirements and specifications
- **[Use Cases](https://www.notion.so/1e8f4163a77e80b9887ac59218dba7a4?v=1ebf4163a77e8006b152000ced8f3495)** - User stories and use case scenarios

## Project Structure

This repository is organized as a monorepo with the following services:

```
spendflix-go/
├── services/
│   ├── auth/          # Go backend service (AWS Lambda)
│   └── web/           # SvelteKit frontend application
├── .cursor/           # Cursor AI rules for each service
├── .vscode/           # VSCode/Cursor workspace settings
└── Makefile           # Monorepo commands
```

### Services

- **`services/auth`** - Go backend service for authentication and user management, deployed on AWS Lambda. See [Auth Service README](services/auth/README.md) for details.

- **`services/web`** - SvelteKit frontend application with TypeScript, TailwindCSS, and Preline UI components. See [Web Service README](services/web/README.md) for details.

## Quick Start

### Prerequisites

- **Go** 1.21+ (for auth service)
- **Node.js** 20+ and npm (for web service)
- **PostgreSQL** (for local development)
- **Docker** (for running tests with testcontainers)

### Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd spendflix-go
```

2. **Install dependencies:**

```bash
make install-deps
```

This will install dependencies for both services.

3. **Set up environment variables:**

- Auth service: Copy `services/auth/.env.example` to `services/auth/.env` and configure
- Web service: No environment variables needed for local development

4. **Start development servers:**

```bash
make dev
```

This starts both services:
- Auth API: `http://localhost:3000`
- Web app: `http://localhost:8080`

## Available Commands

To see all available commands, run:

```bash
make help
```

Each service also has its own `Makefile` with additional commands. Navigate to the service directory to see service-specific commands:

```bash
cd services/auth && make help
cd services/web && make help
```

## Development Workflow

1. **Start both services:**
   ```bash
   make dev
   ```

2. **Run tests:**
   ```bash
   make test
   ```

3. **Run linters:**
   ```bash
   make lint
   ```

4. **Format code:**
   ```bash
   make format-web  # For web service
   cd services/auth && make lint-fix  # For auth service
   ```

## Project Documentation

- [Auth Service Documentation](services/auth/README.md) - Go backend service details
- [Web Service Documentation](services/web/README.md) - SvelteKit frontend details

## Technology Stack

### Auth Service
- **Language:** Go 1.21+
- **Framework:** AWS Lambda
- **Database:** PostgreSQL
- **Authentication:** AWS Cognito
- **Testing:** testify, testcontainers-go
- **Linting:** golangci-lint

### Web Service
- **Framework:** SvelteKit 2.0
- **Language:** TypeScript
- **Styling:** TailwindCSS + Preline UI
- **Testing:** Playwright
- **Linting:** ESLint + Prettier
- **API Client:** Generated from OpenAPI spec

## Contributing

1. Create a branch from `main`
2. Make your changes
3. Run tests and linters: `make test && make lint`
4. Commit using conventional commits (e.g., `feat: add new feature`)
5. Push and create a pull request

## License

This project is licensed under the [Creative Commons Attribution-NonCommercial 4.0 International Public License](https://creativecommons.org/licenses/by-nc/4.0/legalcode).

You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made
- **NonCommercial** — You may not use the material for commercial purposes
- **No additional restrictions** — You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits

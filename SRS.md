# _Spendflix_: Software Requirement Specification

# 1. Introduction

## **1.1 Purpose**

This Software Requirements Specification (SRS) document describes the functional and non-functional requirements for _Spendflix_, a personal finance platform designed to help individuals take control of their financial lives. Its purpose is to provide a shared reference for all stakeholders, ensuring clarity in expectations, alignment in development efforts, and a roadmap for testing and validation. It outlines the system’s core functionalities, limitations, and target audience.

## **1.2 Scope**

Spendflix is a web-based personal finance application focused on three core pillars:

- **Discover**: Centralize all expenses and income in a single, searchable database.
- **Organize**: Categorize transactions and establish a monthly budget.
- **Achieve**: Set financial goals, track progress, and take actionable steps toward dreams or debt freedom.

Spendflix will offer tools for inputting and editing transactions, visualizing financial data, tracking goals, and staying within budget. The system is designed for individual use and will prioritize usability, clarity, and practical insights.

The software will **not**:

- Offer real-time bank integrations or automatic transaction imports in its initial version.
- Include multi-user access or shared financial planning features.
- Provide investment tracking or tax calculation tools.

## **1.3 Audience**

This document is intended for the following readers:

- **Developers**: To understand the functional scope and implement features accordingly.
- **Testers**: To design test cases that ensure system reliability and accuracy.
- **Project managers**: To monitor progress and ensure alignment with project goals.
- **Stakeholders**: To validate that the software meets user needs and delivers meaningful value.

# **2. Overall Description**

## **2.1 Product Perspective**

_Spendflix_ is a standalone, web-based personal finance application. It is not part of a larger system, but it is being designed with future integrations in mind (e.g., bank APIs, notification systems, and open finance platforms). For the MVP, it operates independently, using a modern serverless architecture with a PostgreSQL database and scalable backend services such as AWS Lambda.

The product follows a monorepo architecture, separating the frontend (Next.js), backend (Node.js with Serverless Framework), and infrastructure components. The backend exposes a REST API that serves both the frontend and potential external integrations.

This open-source project showcases the author’s and collaborators’ skills in modern software development. It is licensed under the [Creative Commons Attribution-NonCommercial 4.0](https://creativecommons.org/licenses/by-nc/4.0/) license, which does not allow commercial use. The [project README on GitHub](https://github.com/sauloarruda/spendflix) provides more information.

### **2.2 Product Features**

_Spendflix_ is centered around three core pillars: **Discover, Organize, and Realize**. The major MVP features include:

- **Transaction Management**:
  - Manually import income and expenses using bank-exported CSV files.
  - Only Nubank account and credit card CSV files will be supported.
  - View and search transaction history.
  - Assign categories and tags to transactions.
- **Categorization**:
  - At least 70% of records must be automatically categorized.
  - Users will need to manually assign categories for the remaining transactions.
  - The category tree is predefined and cannot be modified by users.
- **Budgeting**:
  - Set monthly spending limits by category.
  - Track budget consumption in real time.
- **Financial Goals**:
  - Define financial goals (e.g., save R$ 5,000 for a trip).
  - Link goals to specific categories or savings targets.
- **Insights & Reports**:
  - Visual dashboards showing monthly financial summaries.
  - Highlight top spending areas and trends over time.
- **User Account**:
  - Secure login with email and password.
  - Multi-factor authentication (MFA) support (optional in MVP, but infrastructure-ready).

# **3. Specific Requirements**

## **3.1 Functional Requirements**

The system shall:

### **Transaction Management**

- Allow users to upload CSV files exported from Nubank (credit card and bank account).
- Provide instructions on how to export the CSV file from the Nubank app.
- Parse uploaded CSV files and extract transaction data (date, description, amount, identifier).
- Store the file checksum and imported transactions in the user’s account to prevent duplicates.
- Prevent users from manually adding, editing, or deleting transactions.
- Allow users to view, search, and filter transactions by period, category, and keyword.

### **Categorization**

- Enforce the use of a predefined, non-editable category tree.
- Automatically assign categories to at least 70% of imported transactions using keyword-based rules or matching heuristics.
- Update user-specific categorization rules based on manual input.
- Allow users to manually assign categories to uncategorized transactions and override automatically categorized ones.
- Generate a **categorization index** to inform users about categorization quality, calculated as the monthly percentage of uncategorized transactions over the total number of transactions.

### **Budgeting**

- Allow users to set monthly spending limits per category and subcategory, segmented by revenue, essential, and non-essential expenses.
- Track and display current spending against defined limits in real time.
- Suggest a budget based on the median of the last three months’ data.
- Notify users visually when a budget limit is exceeded.
- Generate a **budget index** to inform users about budgeting quality, considering the median monthly percentage of budgeted categories/subcategories.

### **Financial Goals**

- Allow users to define goals with a title, description, target amount, and optional deadline.
- Let users link goals to specific categories or saving strategies (e.g., progress based on leftover budget).
- Track goal progress over time and display it visually on the dashboard.

### **Insights & Reports**

- Generate monthly and cumulative reports of income, expenses, and category summaries.
- Display visual dashboards with charts, top spending categories, and long-term trends.

### **User Account**

- Allow users to sign up with an email and password.
- Allow users to log in and log out securely.
- Support multi-factor authentication (MFA), starting with email-based verification.
- Store user profile settings, including preferred currency and language.

## **3.2 Non-Functional Requirements**

- **Performance**:
  - The system must import up to 2,000 transactions in under 10 seconds.
  - 99% of API requests must respond in under 1 second.
- **Availability**:
  - The system must maintain 99.9% uptime on a monthly basis.
- **Security**:
  - Use AWS Cognito as the authentication provider.
  - All API communication must occur over HTTPS.
- **Scalability**:
  - The system must support at least 1,000 concurrent users during the MVP phase.
- **Usability**:
  - The interface must be mobile-first, intuitive, and accessible to users without financial expertise.
- **Compliance**:
  - The system must comply with the Brazilian General Data Protection Law (LGPD).
- **Maintainability**:
  - The codebase must:
    - Follow clean architecture principles.
    - Be fully typed using TypeScript.
    - Enforce strict and standardized linting and formatting rules.
    - Include automated tests with at least 90% line coverage.

## **3.3 External Interface Requirements**

- **File Input Interface**:
  - Accept .csv files matching Nubank’s export structure.
  - Show validation errors if the file is malformed or incomplete.
  - Store the uploaded file temporarily and enqueue it for background processing.
  - Automatically delete uploaded files 30 days after processing.
- **API Interface**:
  - Provide RESTful endpoints for all core operations (e.g., /transactions, /budgets, /goals).
  - Return consistent and well-documented JSON responses following the OpenAPI specification.
- **Authentication Interface**:
  - Use JWT-based authentication to secure API access.
  - Support refresh tokens for persistent sessions.

## **3.4 User Interface Requirements**

The system must provide the following user interfaces:

- A **dashboard** showing financial summary, budget status, and goal progress.
- A **transaction list** with filters by date, category, and search input.
- A **goal management** screen to create, view, and edit financial goals.
- A **budget configuration** screen to set and monitor budget allocations.

## **3.5 Quality Assurance and Testing Requirements**

- Each feature must be covered by automated unit and integration tests, with at least 90% line coverage.
- Manual test plans must be executed for UI flows before every release.
- Critical flows—such as login, transaction import, and budget management—must pass end-to-end tests as part of the CI pipeline before deployment.

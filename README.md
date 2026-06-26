# Dental Clinic Management System (DCMS) Backend

A production-ready Modular Monolith backend for a Dental Clinic Management System (DCMS), built with Node.js, Express, PostgreSQL, Prisma ORM, and Docker.

---

## 🏛 Architecture

This project is built using a **Modular Monolith** architecture pattern. This isolates each business domain (such as patients, appointments, billing, and inventory) into its own module folder while sharing core infrastructure (`common/`) and routes.

```
src/
 ├── modules/                # Domain-specific modules
 │    ├── auth/              # JWT, Authentication & login
 │    └── [other-modules]    # Each module: controller, service, repository, validator, routes, dto, types
 ├── common/                 # Shared infrastructure & utilities
 │    ├── config/            # Environment variable validation
 │    ├── database/          # Prisma client connections
 │    ├── errors/            # Centralized API error classes
 │    ├── logger/            # Winston logger setup
 │    ├── middleware/        # Security, validation, logging & RBAC middleware
 │    └── utils/             # Helper utilities (JWT, password hashes)
 ├── routes/                 # Express routing aggregation
 ├── app.js                  # Application bootstrap and middleware composition
 └── server.js               # Entry point (graceful shutdowns, listeners)
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v22+ or v24+)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

### Local Installation

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Setup Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. **Start PostgreSQL Container:**
   ```bash
   docker compose up -d db
   ```
   *Note: This starts PostgreSQL mapped to port `5434` to prevent port conflicts with any native PostgreSQL running on port `5432`.*

4. **Run Database Migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Seed Default Administrator:**
   ```bash
   npm run prisma:seed
   ```
   - **Admin Email:** `admin@dcms.com`
   - **Admin Password:** `AdminPass123!`

6. **Start the Dev Server:**
   ```bash
   npm run dev
   ```
   The backend will be available at `http://localhost:5000`.

---

## 🐳 Docker Deployment

To spin up the entire application stack (PostgreSQL + Express Backend):
```bash
docker compose up --build
```

The server will start on port `5000`, and the database will be preserved in a Docker volume.

---

## 📜 API Documentation & Swagger

When the server is running, the interactive Swagger OpenAPI documentation is available at:
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

---

## 🧪 Running Tests

The test suite covers environment validation, Winston logging, database connection health, JWT/bcrypt security helpers, and Express routing.

Run tests with:
```bash
npm run test
```

---

## 🧹 Linting and Formatting

We use ESLint Flat Config and Prettier to ensure high code quality:
- Run Linter: `npm run lint`
- Auto-Fix Linting: `npm run lint:fix`
- Auto-Format Code: `npm run format`

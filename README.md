# MTrade Monolith

MTrade is a modular monolith e-commerce platform built with NestJS, Prisma, PostgreSQL, React, and Vite. The project demonstrates a domain-oriented architecture where product, auth, users, orders, and payments are separated into clearly bounded modules, while still running from a single deployable codebase.

The application includes a production-style frontend, secure backend services, telemetry inspection, Docker orchestration, and an AWS deployment path for cloud delivery.

## Highlights

- Modular monolith architecture with five business domains:
  - Auth
  - Users
  - Products
  - Orders
  - Payments
- JWT-secured backend with session handling and public/private routes
- Prisma + PostgreSQL persistence with migrations and seed support
- Product catalog with search, filters, categories, stock checks, featured products, and reviews
- Shopping cart, checkout flow, order history, and payment orchestration
- Seller protection to avoid buying your own listing
- Multi-language frontend: English and Spanish
- API telemetry inspector for request/response tracing across modules
- Docker Compose for local environment simulation
- AWS ECS + CloudFront + S3 + ALB deployment scaffolding

## Architecture

The backend is organized into isolated modules behind one NestJS application:

- `auth/` — authentication, JWT generation, login/register flows, public guards, rate limits
- `users/` — user profiles, addresses, account data management
- `products/` — catalog, inventory, product detail, review aggregation
- `orders/` — order creation, lifecycle, ownership validation, history
- `payments/` — payment processing route and transaction orchestration
- `prisma/` — Prisma config and service

Frontend:

- React + TypeScript UI under `web/src`
- Vite packaging and dev server
- Local API proxy and environment configuration
- Custom language context and product detail experience

## Core Features

### Customer experience

- Browse the product catalog and search by name, category, SKU, or tag
- Filter by category and stock availability
- Sort by rating, newest, or price asc/desc
- View product detail modal with image, pricing, rating, stock, and tags
- Add products to cart and manage quantity
- Complete checkout and track recent orders
- Review products and see aggregate scores update automatically
- Switch interface language between English and Spanish

### Seller and ownership rules

- Sellers can create and manage their own products
- Product owners cannot add their own products to their cart
- Product owners cannot place orders for their own listings
- Product reviews are restricted so a seller cannot review their own product
- Review data is unique per product/user and updates aggregate rating counters

### Backend platform capabilities

- JWT auth guard on protected routes
- Rate limiting guard and telemetry metrics interceptor
- Prisma validation and schema migration workflow
- Structured HTTP API for frontend and external clients
- Module-level monitoring via the Monolith API Inspector
- Health and status surfaces for local and production checks

### Observability and deployment

- Telemetry inspector to view calls between services and payload metadata
- Prometheus and Grafana support in the monitoring stack
- Docker image setup for backend and frontend
- AWS deploy script with CloudFormation-like stack orchestration references

## Tech Stack

### Backend

- NestJS 11
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT / auth guards
- Class-validator / class-transformer
- Prometheus telemetry integration

### Frontend

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Lucide icons

### Operations

- Docker / Docker Compose
- AWS ECS deployment scaffolding
- CloudFront + S3 static hosting references
- Postgres monitoring stack

## Repository Structure

```text
.
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── auth/
│   ├── orders/
│   ├── payments/
│   ├── prisma/
│   ├── products/
│   └── users/
├── web/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── monitoring/
│   ├── grafana/
│   └── prometheus/
├── docker-compose.yml
├── Dockerfile
├── deploy-aws.sh
├── mtrade.yml
├── package.json
├── .env.example
├── README.md
└── tsconfig.json
```

## Environment Variables

Root environment example:

```bash
NODE_ENV=development
PORT=3000
APP_PORT=3000
WEB_PORT=5173
DATABASE_URL=postgresql://mtrade_user:change-me@localhost:5432/mtrade_db
JWT_SECRET=change-me-to-a-long-random-secret
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_BUCKET_CAPACITY=60
RATE_LIMIT_REFILL_PER_SECOND=2
```

Frontend environment example:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

## Getting Started

### 1) Install dependencies

```bash
npm install
cd web && npm install
```

### 2) Start PostgreSQL and local services

```bash
docker compose up --build
```

This starts the backend API, the web frontend, PostgreSQL, Prometheus, and Grafana.

### 3) Run the backend in watch mode

From the project root:

```bash
npm run start:dev
```

### 4) Run the frontend in dev mode

From the `web` folder:

```bash
npm run dev
```

The frontend is typically served at `http://localhost:5173` and proxies to the backend at `http://localhost:3000`.

## Database and Prisma

Generate the Prisma client and validate the schema:

```bash
npm run prisma:generate
npm run prisma:validate
```

Create or apply migrations:

```bash
npm run prisma:migrate:dev -- --name init
```

Seed the database:

```bash
npm run prisma:seed
```

## Testing

Run the backend test suite:

```bash
npm test
```

Run with coverage:

```bash
npm run test:cov
```

Run the end-to-end suite:

```bash
npm run test:e2e
```

## Production Deployment

The project includes deployment plumbing for containerized AWS hosting:

- backend image build via root `Dockerfile`
- frontend static build via `web/Dockerfile`
- ECS-ready stack sample in `mtrade.yml`
- AWS deployment script in `deploy-aws.sh`
- static web hosting via S3 + CloudFront concept

Example:

```bash
export AWS_REGION=us-east-1
export DB_PASSWORD='use-a-strong-password-here'
export JWT_SECRET="$(openssl rand -base64 48)"
./deploy-aws.sh
```

## API Overview

The backend exposes modular routes under `/api` and the app uses a service-level proxy model for each module. Common flows include:

- `POST /auth/login`
- `POST /auth/register`
- `GET /products`
- `GET /products/categories`
- `POST /products`
- `POST /products/:id/reviews`
- `GET /orders`
- `POST /orders`
- `GET /payments`
- `POST /payments/process`

You can inspect telemetry in the Monolith API Inspector UI as requests are made.

## Notes

This project is designed as a product demonstration and a modular monolith reference implementation. It blends business domain isolation with a practical single-service deployment model and is intended to be a strong starting point for e-commerce or commerce platform experimentation.

## License

This project currently ships with the repository default licensing setup and should be reviewed before production public release.

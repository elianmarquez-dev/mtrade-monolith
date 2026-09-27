<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### Docker Compose

Copy `.env.example` to `.env`. Docker Compose reads `NODE_ENV` from `.env`:

```bash
# Build and run the production-like images locally
docker compose up --build
```

Compose runs the compiled backend image and the Nginx frontend image. Changes
to source files require rebuilding the affected image. For a development
watcher, run the Nest and Vite commands directly from their respective
directories. Set a strong `JWT_SECRET` and non-default passwords in
production.

## Database and monitoring

The PostgreSQL schema is defined in `prisma/schema.prisma`. Set `DATABASE_URL`
before running Prisma commands:

```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
```

Docker Compose also starts `postgres-exporter`. Prometheus scrapes it internally
at `postgres-exporter:9187` and exposes the resulting PostgreSQL metrics through
the configured Prometheus datasource.

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

### AWS ECS

The backend and frontend are independent production images. Build and publish
them to ECR from the repository root:

```bash
docker build -t mtrade-api .
docker build --build-arg VITE_API_BASE_URL=/api -t mtrade-web ./web
```

Run the API as an ECS service on port `3000` with the container health check
`/api/health`. The Vite frontend is built as static files and served from the
private S3 bucket through CloudFront. CloudFront forwards `/api/*` to the API
ALB, allowing the frontend to use the default `VITE_API_BASE_URL=/api` without
embedding an environment-specific hostname.

Inject `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, and `NODE_ENV=production`
from AWS Secrets Manager or SSM Parameter Store. `DATABASE_URL` should point
to an RDS/Aurora PostgreSQL instance, not the Compose `postgres` hostname.
Apply Prisma migrations as a release task before shifting traffic to a new
API revision:

```bash
npx prisma migrate deploy
```

The repository includes `mtrade.yml`, which provisions the VPC, private RDS
PostgreSQL, ECS/Fargate API, ALB, and a private S3 bucket served by CloudFront.
The deploy script creates the ECR repository when needed. The complete first
deployment can be run after configuring AWS credentials and Docker:

```bash
export AWS_REGION=us-east-1
export DB_PASSWORD='use-a-strong-password-here'
export JWT_SECRET="$(openssl rand -base64 48)"
./deploy-aws.sh
```

The script builds the frontend and backend, publishes the backend image,
deploys the stack with the new image, waits for ECS stability, builds the Vite
frontend with `VITE_API_BASE_URL=/api`,
uploads `web/dist` to S3, and invalidates CloudFront. CloudFront serves the
static files from S3 and forwards `/api/*` to the ALB, so the browser uses one
HTTPS origin. Subsequent releases reuse the same command;
the immutable ECR tag is generated from the UTC timestamp.

For local production-like validation, `docker compose up --build` starts the
frontend at `http://localhost:5173` and the API at `http://localhost:3000`.
The local frontend points directly to the API; ECS builds should override
`VITE_API_BASE_URL=/api` because the ALB handles path-based routing there.

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment).
If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

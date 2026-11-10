# MTrade Monolith

MTrade is an e-commerce application with a NestJS API, PostgreSQL database, and React/Vite frontend. The API uses Prisma for database access and migrations.

## Architecture

- `src/`: NestJS API and its auth, users, products, orders, and payments modules.
- `prisma/`: PostgreSQL schema, migrations, and seed script.
- `web/`: React/Vite frontend.
- `docker-compose.yml`: local services, including PostgreSQL and monitoring.
- `mtrade.yml`: AWS CloudFormation template for the production stack.
- `deploy-aws.sh`: builds and deploys the frontend and backend to AWS.

Both Dockerfiles use multi-stage builds. The root `Dockerfile` compiles the API in a Node build stage and copies only production dependencies, Prisma artifacts, and compiled output into a non-root runtime image. `web/Dockerfile` builds the frontend with Node and serves only the static output from an Nginx runtime image. The AWS deploy script uses the root Dockerfile for ECS and builds the frontend directly for S3/CloudFront.

## Local development

Requirements: Node.js/npm and Docker Compose.

Install dependencies:

```bash
npm ci
npm ci --prefix web
```

Copy `.env.example` to `.env`, set local values, then start the services:

```bash
docker compose up --build
```

The API is available at `http://localhost:3000`; the web app is at `http://localhost:5173`. To run either app outside Compose:

```bash
npm run start:dev
npm --prefix web run dev
```

## Tests and database

```bash
npm test
npm run test:e2e
npm run prisma:generate
npm run prisma:validate
```

Create a development migration with `npm run prisma:migrate:dev -- --name <name>` and seed the local database with `npm run prisma:seed`.

## Full AWS deployment

The deployment script builds the Vite frontend and the API Docker image, pushes the image to ECR, deploys `mtrade.yml` with CloudFormation, waits for ECS, uploads the frontend to S3, and invalidates CloudFront. The container applies pending Prisma migrations when it starts.

The CloudFormation stack creates an ECS Fargate service behind an Application Load Balancer, a private PostgreSQL RDS instance, Secrets Manager secrets, a private S3 bucket, and a CloudFront distribution. CloudFront serves the frontend over HTTPS and routes `/api/*` to the backend.

AWS request protections include:

- The ALB security group accepts HTTP only from the AWS-managed CloudFront origin-facing prefix list. The deploy script looks up its ID for the selected region; deployment stops with an error if it is unavailable.
- A regional AWS WAF web ACL on the ALB blocks a client IP after 1,000 requests in a five-minute window by default. WAF uses the last address in `X-Forwarded-For` (CloudFront appends the viewer IP) and exposes sampled requests and metrics in CloudWatch.
- ECS accepts application traffic only from the ALB security group, and RDS is private and accepts PostgreSQL connections only from ECS.
- The API also has an in-process token-bucket limit (60-request burst, refilling at 2 requests/second by default). In production, Express trusts the two known proxy hops (CloudFront and ALB) so this limiter uses the client IP forwarded through CloudFront. This is per task, not a shared distributed limit; WAF is the edge-level control.

### Requirements

- An AWS account with permissions to create CloudFormation, IAM roles, VPC/networking, ECS/Fargate, ECR, RDS, Secrets Manager, S3, CloudFront, an Application Load Balancer, and AWS WAF. The deployer also needs permission to describe EC2 managed prefix lists.
- AWS CLI configured with credentials for that account. Verify access with `aws sts get-caller-identity`.
- Docker, Node.js 20+/npm, Bash, and OpenSSL installed.
- AWS CLI configured with a valid profile; the deploy script can be run from any directory.

After configuring a valid AWS CLI profile on the machine, the same command performs the first deployment and later updates. The script defaults to `us-east-1`; set a profile or region only if needed:

```bash
./deploy-aws.sh
```

The script checks AWS credentials, Docker, the template, and deployment settings; installs frontend dependencies; builds and deploys the complete stack; and waits for ECS and CloudFront. Backend dependencies are installed as part of the Docker multi-stage build. It can be run from any working directory. AWS CLI, Docker, and valid AWS credentials remain required prerequisites.

The script creates the ECR repository if needed and generates `DB_PASSWORD` and `JWT_SECRET` if they are not supplied. It saves generated values to `.mtrade-deploy-secrets` with restrictive file permissions and reuses them on later runs. Keep this file backed up securely and out of version control; losing it can prevent the application from connecting to the existing database. Do not share or commit it.

On success, the script prints the frontend URL, backend origin, and image tag. The frontend URL serves the API through `/api`; the backend origin is intentionally reachable only through CloudFront.

### Subsequent deployments and options

Run `./deploy-aws.sh` again to deploy changes. The default stack is `mtrade`, the default region is `us-east-1`, and the default ECR repository is `mtrade/monolith`. The script assigns a new timestamp image tag unless `IMAGE_TAG` is set.

Useful environment variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `AWS_REGION` | AWS deployment region | `us-east-1` (or `AWS_DEFAULT_REGION`) |
| `AWS_PROFILE` | AWS CLI profile | AWS CLI's configured credential chain |
| `STACK_NAME` | CloudFormation stack name | `mtrade` |
| `ECR_REPOSITORY_NAME` | ECR repository | `mtrade/monolith` |
| `IMAGE_TAG` | Backend image tag | Current UTC timestamp |
| `WAF_RATE_LIMIT` | Requests per client IP before WAF blocks, in a five-minute window (minimum 10) | `1000` |
| `ADDITIONAL_CORS_ORIGIN` | Additional allowed frontend origin | Empty |
| `TEMPLATE_FILE` | CloudFormation template path | `mtrade.yml` |

For example, to allow another frontend origin:

```bash
ADDITIONAL_CORS_ORIGIN=https://shop.example.com ./deploy-aws.sh
```

If you provide `DB_PASSWORD` or `JWT_SECRET` yourself, preserve those values securely; the script only writes the secrets file when it generates at least one of them. The database password must be at least 16 characters, and the JWT secret at least 32 characters.

After each successful deployment, the script deletes other tagged images in the configured ECR repository. Keep a separate backup if you need older images for rollback. The template uses fixed AWS resource names, so do not deploy multiple copies of this stack into the same account and region.

### Costs and production considerations

AWS charges apply while the stack is running. In particular, review the costs for RDS, Fargate, the load balancer, AWS WAF, CloudFront, S3, data transfer, and CloudWatch Logs in your selected region. The template uses a single-AZ `db.t4g.micro` database and an HTTP listener on the public load balancer; ALB access is restricted to CloudFront origin-facing IP ranges, and CloudFront serves the frontend over HTTPS. Review and adapt the template for your availability, domain, and TLS requirements before using it for production workloads.

To remove the stack, empty the frontend bucket first, then delete the CloudFormation stack:

```bash
FRONTEND_BUCKET="$(aws cloudformation describe-stacks \
  --region "$AWS_REGION" \
  --stack-name mtrade \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)"

aws s3 rm "s3://$FRONTEND_BUCKET" --recursive --region "$AWS_REGION"
aws cloudformation delete-stack --region "$AWS_REGION" --stack-name mtrade
aws cloudformation wait stack-delete-complete --region "$AWS_REGION" --stack-name mtrade
```

RDS has a snapshot deletion policy, so deleting the stack retains a database snapshot that may continue to incur charges. The ECR repository is created outside CloudFormation and is not deleted with the stack; delete it separately if it is no longer needed.

## API

The API is served under `/api`. Main routes include:

- `POST /api/auth/login` and `POST /api/auth/register`
- `GET /api/products` and `GET /api/products/categories`
- `POST /api/products` and `POST /api/products/:id/reviews`
- `GET /api/orders` and `POST /api/orders`
- `GET /api/payments` and `POST /api/payments/process`
- `GET /api/health`

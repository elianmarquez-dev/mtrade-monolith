#!/usr/bin/env bash

set -euo pipefail

STACK_NAME="${STACK_NAME:-mtrade}"
AWS_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"
TEMPLATE_FILE="${TEMPLATE_FILE:-mtrade.yml}"
ECR_REPOSITORY_NAME="${ECR_REPOSITORY_NAME:-mtrade/monolith}"

# Where auto-generated secrets are persisted between runs. This file is what
# makes it safe to re-run the script with no env vars set: DB_PASSWORD must
# stay IDENTICAL across deploys, because it becomes the RDS master password,
# while the app's real DATABASE_URL lives in Secrets Manager (AppSecretArn)
# and is not updated by this script. Generating a new random password on
# every run would desync the two and lock the app out of the database.
SECRETS_FILE="${SECRETS_FILE:-.mtrade-deploy-secrets}"

IMAGE_TAG="${IMAGE_TAG:-$(date -u +%Y%m%d%H%M%S)}"

load_or_generate_secrets() {
  if [[ -f "$SECRETS_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$SECRETS_FILE"
  fi

  local generated=false

  if [[ -z "${DB_PASSWORD:-}" ]]; then
    # RDS master passwords can't contain '/', '@', '"' or spaces; keep it
    # alphanumeric to stay safe regardless of engine.
    DB_PASSWORD="$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | cut -c1-32)"
    generated=true
  fi

  if [[ -z "${JWT_SECRET:-}" ]]; then
    JWT_SECRET="$(openssl rand -hex 32)"
    generated=true
  fi

  if [[ ${#DB_PASSWORD} -lt 16 ]]; then
    echo "DB_PASSWORD must be at least 16 characters" >&2
    exit 1
  fi
  if [[ ${#JWT_SECRET} -lt 32 ]]; then
    echo "JWT_SECRET must be at least 32 characters" >&2
    exit 1
  fi

  if [[ "$generated" == true ]]; then
    umask 077
    cat > "$SECRETS_FILE" <<EOF
DB_PASSWORD='$DB_PASSWORD'
JWT_SECRET='$JWT_SECRET'
EOF
    chmod 600 "$SECRETS_FILE"
    echo "==> Generated and saved deploy secrets to $SECRETS_FILE (keep this safe and out of git; reused on future runs)"
  fi
}

load_or_generate_secrets

ensure_ecr_repository() {
  local repo_name="$1"

  if ! aws ecr describe-repositories \
    --region "$AWS_REGION" \
    --repository-names "$repo_name" \
    >/dev/null 2>&1; then
    echo "==> ECR repository $repo_name not found, creating it..."
    aws ecr create-repository \
      --region "$AWS_REGION" \
      --repository-name "$repo_name" \
      --image-scanning-configuration scanOnPush=true \
      >/dev/null
  fi

  aws ecr describe-repositories \
    --region "$AWS_REGION" \
    --repository-names "$repo_name" \
    --query 'repositories[0].repositoryUri' \
    --output text
}

stack_output() {
  aws cloudformation describe-stacks \
    --region "$AWS_REGION" \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" \
    --output text
}

deploy_stack() {
  aws cloudformation deploy \
    --region "$AWS_REGION" \
    --stack-name "$STACK_NAME" \
    --template-file "$TEMPLATE_FILE" \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
      ImageTag="$IMAGE_TAG" \
      ECRRepositoryName="$ECR_REPOSITORY_NAME" \
      DesiredCount=1 \
      DBPassword="$DB_PASSWORD" \
      JWTSecret="$JWT_SECRET" \
      AdditionalCorsOrigin="${ADDITIONAL_CORS_ORIGIN:-}"
}

    echo "==> Building frontend..."
    VITE_API_BASE_URL=/api npm --prefix web run build

    echo "==> Preparing ECR repository..."
    ECR_REPOSITORY_URI="$(ensure_ecr_repository "$ECR_REPOSITORY_NAME")"

echo "==> Logging into ECR..."

aws ecr get-login-password --region "$AWS_REGION" | \
  docker login \
    --username AWS \
    --password-stdin "${ECR_REPOSITORY_URI%%/*}"

echo "==> Building backend image: $IMAGE_TAG"

docker build \
  --tag "$ECR_REPOSITORY_URI:$IMAGE_TAG" \
  .

echo "==> Pushing backend image..."

docker push "$ECR_REPOSITORY_URI:$IMAGE_TAG"

echo "==> Deploying infrastructure and application..."
deploy_stack

ECS_CLUSTER="$(stack_output ECSCluster)"
ECS_SERVICE="$(stack_output ECSService)"
FRONTEND_BUCKET="$(stack_output FrontendBucketName)"
CLOUDFRONT_DISTRIBUTION_ID="$(stack_output CloudFrontDistributionId)"
BACKEND_URL="$(stack_output BackendURL)"

echo "==> Waiting for ECS service to become stable..."

aws ecs wait services-stable \
  --cluster "$ECS_CLUSTER" \
  --services "$ECS_SERVICE" \
  --region "$AWS_REGION"

echo "==> Uploading frontend..."

aws s3 sync \
  web/dist \
  "s3://$FRONTEND_BUCKET" \
  --delete \
  --region "$AWS_REGION"

echo "==> Invalidating CloudFront cache..."

INVALIDATION_ID="$(aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths '/*' \
  --query 'Invalidation.Id' \
  --output text)"

aws cloudfront wait invalidation-completed \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --id "$INVALIDATION_ID"

echo "==> Removing previous backend image versions..."
OLD_IMAGE_ROWS="$(aws ecr list-images \
  --region "$AWS_REGION" \
  --repository-name "$ECR_REPOSITORY_NAME" \
  --filter tagStatus=TAGGED \
  --query "imageIds[?imageTag!='${IMAGE_TAG}'].[imageDigest,imageTag]" \
  --output text)"

IMAGE_IDS=()
while IFS=$'\t' read -r image_digest image_tag; do
  [[ -n "$image_digest" && "$image_digest" != "None" && -n "$image_tag" && "$image_tag" != "None" ]] || continue
  IMAGE_IDS+=("imageDigest=$image_digest,imageTag=$image_tag")

  if (( ${#IMAGE_IDS[@]} == 100 )); then
    aws ecr batch-delete-image \
      --region "$AWS_REGION" \
      --repository-name "$ECR_REPOSITORY_NAME" \
      --image-ids "${IMAGE_IDS[@]}" \
      >/dev/null
    IMAGE_IDS=()
  fi
done <<< "$OLD_IMAGE_ROWS"

if (( ${#IMAGE_IDS[@]} > 0 )); then
  aws ecr batch-delete-image \
    --region "$AWS_REGION" \
    --repository-name "$ECR_REPOSITORY_NAME" \
    --image-ids "${IMAGE_IDS[@]}" \
    >/dev/null
fi

echo
echo "========================================"
echo "Deployment complete."
echo "========================================"
echo "Frontend: $(stack_output FrontendURL)"
echo "Backend:  $BACKEND_URL"
echo "Image:    $ECR_REPOSITORY_URI:$IMAGE_TAG"
echo
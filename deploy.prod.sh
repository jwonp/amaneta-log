# chmod +x deploy.prod.sh
#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
PROJECT_NAME="amaneta-log"

if [ ! -f "${ENV_FILE}" ]; then
  echo "Missing ${ENV_FILE}"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

COMPOSE="docker compose --project-name ${PROJECT_NAME} --env-file ${ENV_FILE} -f ${COMPOSE_FILE}"
NETWORK_NAME="${PROJECT_NAME}_default"

echo "🚀 Amaneta-log production deploy started"

echo ""
echo "1. Build production images"
${COMPOSE} build

echo ""
echo "2. Start infrastructure services"
${COMPOSE} up -d postgres minio

echo ""
echo "3. Wait for PostgreSQL"
until ${COMPOSE} exec -T postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" -p "$POSTGRES_PORT"' > /dev/null 2>&1; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done
echo "PostgreSQL is ready"

echo ""
echo "4. Wait for MinIO"
until docker run --rm \
  --network "${NETWORK_NAME}" \
  --env-file "${ENV_FILE}" \
  --entrypoint /bin/sh \
  minio/mc:latest \
  -c '
    mc alias set local "http://${MINIO_ENDPOINT}:${MINIO_PORT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" > /dev/null 2>&1 &&
    mc ready local > /dev/null 2>&1
  '; do
  echo "Waiting for MinIO..."
  sleep 2
done
echo "MinIO is ready"

echo ""
echo "5. Create MinIO bucket if missing"
docker run --rm \
  --network "${NETWORK_NAME}" \
  --env-file "${ENV_FILE}" \
  --entrypoint /bin/sh \
  minio/mc:latest \
  -c '
    mc alias set local "http://${MINIO_ENDPOINT}:${MINIO_PORT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}";
    mc mb --ignore-existing "local/${MINIO_BUCKET}";
  '
echo "MinIO bucket is ready: ${MINIO_BUCKET}"

echo ""
echo "6. Run Prisma migration"
${COMPOSE} run --rm api sh -c 'echo "DATABASE_URL is configured for Prisma migration" && test -n "$DATABASE_URL" && ./node_modules/.bin/prisma migrate deploy'

echo ""
echo "7. Start application services"
${COMPOSE} up -d api web

echo ""
echo "8. Current service status"
${COMPOSE} ps

echo ""
echo "✅ Amaneta-log production deploy completed"

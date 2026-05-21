# chmod +x deploy.dev.sh
#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="amaneta-log"
ROOT_ENV_FILE=".env"
API_ENV_FILE="apps/api/.env"

if [ ! -f "${ROOT_ENV_FILE}" ]; then
  echo "Missing ${ROOT_ENV_FILE}"
  exit 1
fi

if [ ! -f "${API_ENV_FILE}" ]; then
  echo "Missing ${API_ENV_FILE}"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ROOT_ENV_FILE}"
# shellcheck disable=SC1090
source "${API_ENV_FILE}"
set +a

export WEB_HOST_PORT="${WEB_PORT}"
export API_HOST_PORT="${API_PORT}"
export API_PRISMA_STUDIO_HOST_PORT="${API_PRISMA_STUDIO_PORT}"
export POSTGRES_HOST_PORT="${POSTGRES_PORT}"
export MINIO_HOST_PORT="${MINIO_PORT}"
export MINIO_CONSOLE_HOST_PORT="${MINIO_CONSOLE_PORT}"

COMPOSE="docker compose --project-name ${PROJECT_NAME} -f ${COMPOSE_FILE}"
NETWORK_NAME="${PROJECT_NAME}_default"

echo "Amaneta-log development deploy started"

echo ""
echo "1. Build development images"
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
  --env-file "${ROOT_ENV_FILE}" \
  --entrypoint /bin/sh \
  minio/mc:latest \
  -c '
    mc alias set local "http://minio:${MINIO_PORT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" > /dev/null 2>&1 &&
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
  --env-file "${ROOT_ENV_FILE}" \
  --env "MINIO_BUCKET=${MINIO_BUCKET}" \
  --entrypoint /bin/sh \
  minio/mc:latest \
  -c '
    mc alias set local "http://minio:${MINIO_PORT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}";
    mc mb --ignore-existing "local/${MINIO_BUCKET}";
  '
echo "MinIO bucket is ready: ${MINIO_BUCKET}"

echo ""
echo "6. Start API container"
${COMPOSE} up -d api

echo ""
echo "7. Sync API dependencies and run Prisma migration"
${COMPOSE} exec -T api sh -lc 'cd /app && pnpm install --frozen-lockfile --filter api...'
${COMPOSE} exec -T api sh -lc 'cd /app/apps/api && pnpm prisma:generate'
${COMPOSE} exec -T api sh -lc 'cd /app/apps/api && pnpm prisma:migrate'

echo ""
echo "8. Start web container"
${COMPOSE} up -d web

echo ""
echo "9. Sync web dependencies"
${COMPOSE} exec -T web sh -lc 'cd /app && pnpm install --frozen-lockfile --filter web...'

echo ""
echo "10. Current service status"
${COMPOSE} ps

echo ""
echo "Amaneta-log development deploy completed"

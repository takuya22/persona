#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME=${SERVICE_NAME:-persona-agent-svc}
REGION=${REGION:-us-central1}
PROJECT_ID=${PROJECT_ID:?set PROJECT_ID}

ENV_VARS="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=$REGION,GOOGLE_GENAI_USE_VERTEXAI=True,SESSION_DB_URI=sqlite:////tmp/sessions.db"

pushd apps/agent >/dev/null
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --allow-unauthenticated \
  --set-env-vars="$ENV_VARS"
popd >/dev/null
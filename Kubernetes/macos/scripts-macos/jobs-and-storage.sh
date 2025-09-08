#!/usr/bin/env bash
# Apply PV/PVC, Job, and CronJob for the demo.

set -euo pipefail

command -v kubectl >/dev/null 2>&1 || { echo "Missing: kubectl"; exit 1; }

K8S_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../k8s" && pwd)"

echo "Applying PV/PVC..."
kubectl apply -f "${K8S_DIR}/07-pv-pvc.yaml"

echo "Applying Job..."
kubectl apply -f "${K8S_DIR}/08-job.yaml"

echo "Applying CronJob..."
kubectl apply -f "${K8S_DIR}/09-cronjob.yaml"

echo "Done. Check with 'kubectl get jobs -n lesson' and 'kubectl get cronjobs -n lesson'."

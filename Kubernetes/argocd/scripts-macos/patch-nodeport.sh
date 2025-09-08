#!/usr/bin/env bash
set -euo pipefail
kubectl -n argocd patch svc argocd-server -p '{
  "spec": {
    "type": "NodePort",
    "ports": [
      { "name": "http", "port": 80, "targetPort": 8080, "nodePort": 30090 }
    ]
  }
}'
kubectl -n argocd get svc argocd-server
echo "Access UI at: http://localhost:30090"

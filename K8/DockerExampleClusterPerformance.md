I revised the white paper to include a **Docker-only simulation** and a **local Kubernetes (kind/minikube) test**, so you can reproduce oversubscription issues without AWS. It now shows how to:

* Run Docker Compose with CPU-hungry services.
* Load test with `ab` and monitor with `docker stats`.
* Deploy CPU burner pods in Kubernetes to see throttling.
* Apply mitigations (limits, quotas, scaling).


### Adding Prometheus Adapter to Your Kubernetes Setup for HPA with Custom Metrics

step-by-step process to install and configure the Prometheus Adapter in your Kubernetes cluster. This assumes:

- You have a running Kubernetes cluster (e.g., via Minikube, Kind, or a managed service like EKS/GKE/AKS).
- Prometheus is already deployed and scraping relevant metrics from your applications (e.g., via annotations like `prometheus.io/scrape: "true"` on your services).
- Your Docker Compose services are managed via ArgoCD (e.g., using Helm charts or Kustomize for Kubernetes manifests).
- You're using Kubernetes 1.23+ for full support of the `autoscaling/v2` HPA API.

The setup involves installing the adapter (preferably via Helm for simplicity), configuring it to query your Prometheus instance, verifying custom metrics availability, and creating an HPA that uses those metrics. For overload simulation, we'll focus on a custom metric like `http_requests_total` (rate of requests per pod), which could signal overload and trigger scaling.

#### Prerequisites
- **Helm**: Installed on your local machine (version 3+). If not, install via `curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm.sh | bash`.
- **Kubectl**: Configured to access your cluster.
- **Prometheus Endpoint**: Ensure Prometheus is accessible within the cluster (e.g., at `http://prometheus-server.monitoring.svc.cluster.local:9090`). If it's in a different namespace, adjust the URL accordingly.
- **RBAC Permissions**: Your ArgoCD service account or user should have cluster-admin rights for initial setup (you can scope down later).
- **Metrics Exposure**: Your application pods should export Prometheus-compatible metrics. For example, add to your Deployment's pod template:
  ```yaml
  metadata:
    annotations:
      prometheus.io/scrape: "true"
      prometheus.io/path: "/metrics"
      prometheus.io/port: "8080"  # Adjust to your app's metrics port
  ```

#### Step 1: Install Prometheus Adapter Using Helm
The easiest way is via the official Helm chart from the Prometheus community. This deploys the adapter as a Deployment in the `monitoring` namespace (create it if needed: `kubectl create namespace monitoring`).

1. Add the Helm repository:
   ```
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm repo update
   ```

2. Create a custom `values.yaml` file for configuration. This is key for integrating with your existing Prometheus and defining rules for custom metrics. Here's a sample tailored to overload detection (e.g., exposing `http_requests_total` as a custom metric aggregated per pod):

   ```yaml
   # values.yaml for Prometheus Adapter
   prometheus:
     url: http://prometheus-server.monitoring.svc.cluster.local:9090  # Your Prometheus service URL
     port: 80
     path: ""  # Default metrics path

   rules:
     default: false  # Disable default rules; enable only what you need for overload sim
     custom:
       - seriesQuery: '{__name__=~"http_requests_total"}'  # Query for your overload metric (e.g., requests from your app)
         resources:
           overrides:
             kubernetes_namespace: {resource: "namespace"}
             kubernetes_pod_name: {resource: "pod"}
         name:
           matches: "^http_requests_total_(.*)"  # Match and rename for HPA
           as: "http_requests_total_rate"  # Expose as average rate per pod
         metricsQuery: rate(<<.Series>>{<<.LabelMatchers>>}[5m])  # 5m rolling rate; adjust for your sim
         type: "object"  # For per-object metrics like pods
       # Add more rules for other metrics, e.g., latency or queue depth
       - seriesQuery: '{__name__=~"app_queue_length"}'
         resources:
           overrides:
             kubernetes_namespace: {resource: "namespace"}
             kubernetes_pod_name: {resource: "pod"}
         name:
           as: "queue_length_avg"
         metricsQuery: avg(<<.Series>>{<<.LabelMatchers>>}) by (<<.GroupBy>>)
         type: "object"

   # RBAC and API service setup (enabled by default)
   rbac:
     create: true
   apiService:
     create: true
   ```

   - **Explanation**: 
     - `prometheus.url`: Points to your existing Prometheus for querying.
     - `rules.custom`: Defines how to map Prometheus series to Kubernetes resources. Use PromQL queries to aggregate metrics (e.g., `rate()` for request rates). Ensure labels like `namespace` and `pod` are present in your scraped metrics for proper association.
     - For overload sim: This exposes `http_requests_total_rate` as an average per pod, which HPA can target (e.g., scale if > 100 req/min/pod).

3. Install the chart:
   ```
   helm install prometheus-adapter prometheus-community/prometheus-adapter -n monitoring -f values.yaml
   ```
   - Verify: `kubectl get pods -n monitoring` (look for `prometheus-adapter-*` running).
   - Check logs: `kubectl logs -n monitoring deployment/prometheus-adapter`.

#### Step 2: Verify Custom Metrics Availability
Once deployed, the adapter registers an APIService (`v1beta1.custom.metrics.k8s.io`) that exposes Prometheus metrics via the Kubernetes API.

1. List available metrics:
   ```
   kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1 | jq .
   ```
   - You should see your custom metrics (e.g., `http_requests_total_rate`) listed under objects like pods in your namespace.
   - If empty, check:
     - Prometheus is scraping correctly (`kubectl port-forward svc/prometheus-server -n monitoring 9090:9090` and query in browser: `http://localhost:9090/graph?g0.expr=http_requests_total`).
     - Adapter config: Ensure rules match your metric names and labels.
     - Relist interval: The adapter caches metrics; wait or set `--metrics-relist-interval=1m` in the Deployment args if needed.

2. Test a specific metric for your deployment (assume your app Deployment is named `myapp` in namespace `default`):
   ```
   kubectl get --raw "/apis/custom.metrics.k8s.io/v1beta1/namespaces/default/pods/*/http_requests_total_rate" | jq .
   ```
   - This should return values if metrics are flowing.

#### Step 3: Configure HPA to Use Custom Metrics for Overload Simulation
Now, create an HPA that scales your main application Deployment based on the custom metric. During overload tests (e.g., using tools like `locust` or `k6` to simulate traffic spikes), HPA will query the adapter, detect high request rates, and scale up pods—potentially integrating with your HAProxy failover (e.g., via ArgoCD syncing a scaled Deployment that updates service selectors).

Sample HPA YAML (apply with `kubectl apply -f hpa.yaml`):
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
  namespace: default  # Your app's namespace
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp  # Your main app Deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Pods  # Scale based on average per pod
      pods:
        metric:
          name: http_requests_total_rate  # Your custom metric from adapter
        target:
          type: AverageValue
          averageValue: 100  # Scale if avg requests > 100/min per pod (adjust for sim)
    # Optional: Combine with CPU for hybrid scaling
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

- **How it Works in Your Overload Sim**:
  - Prometheus detects overload (e.g., high `http_requests_total` via your existing integration).
  - Adapter exposes it as `http_requests_total_rate`.
  - HPA polls the Custom Metrics API every 15s (default), calculates desired replicas (e.g., if current avg is 200 req/min and target is 100, scale to 4x replicas).
  - As pods scale, ArgoCD can sync changes declaratively (if your Deployment is GitOps-managed).
  - Integrate with failover: Use a metric like `overload_score` in Prometheus rules to trigger HAProxy redirection (e.g., via a sidecar or webhook updating HAProxy config during scaling events).

- Verify HPA: `kubectl describe hpa myapp-hpa`. During tests, watch events for scaling decisions. Simulate overload: Ramp up traffic and observe `kubectl get hpa myapp-hpa -w`.

#### Step 4: Integrate with Your Existing Setup (ArgoCD, Docker, HAProxy)
- **ArgoCD Management**: Since you're using ArgoCD for GitOps, add the Prometheus Adapter as an ArgoCD Application. Commit the Helm `values.yaml` to your Git repo, then create an ArgoCD App manifest pointing to it (see the sample below if you confirm you'd like one). This way, the adapter deploys declaratively alongside your Docker Compose services (converted to K8s manifests via tools like Kompose).
- **Docker Compose Tie-In**: If your services are Docker-based, ensure they're exposing metrics endpoints. Use ArgoCD to deploy them as Deployments with Prometheus annotations.
- **HAProxy Failover**: During HPA scaling, you could add a post-scale hook (e.g., via ArgoCD hooks or a Kubernetes Job) to update HAProxy config for traffic redirection. Prometheus alerts can trigger this via Alertmanager.
- **Testing Overload Sim**: 
  1. Deploy a load generator (e.g., Deployment with `hey` or `wrk` tool).
  2. Monitor in Prometheus/Grafana.
  3. Observe HPA scaling and failover activation.

#### Common Troubleshooting
- **Metric Not Found**: Ensure pod labels match (e.g., `app.kubernetes.io/name`). Check adapter logs for PromQL errors.
- **API Not Registered**: `kubectl get apiservice v1beta1.custom.metrics.k8s.io` should show "True" for Available.
- **Permissions**: Grant the adapter's ServiceAccount cluster-reader role if listing issues occur.
- **Performance**: For large clusters, tune `--metrics-relist-interval=5m` to reduce load.

This setup enhances your overload simulation by making scaling metric-driven and automated. For example, in tests, you can now validate if HPA reacts to Prometheus overload signals within seconds, coordinating with HAProxy redirection.


# Install RabbitMQ

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

## Create the Secret for the RabbitMQ Password

```bash
# Generate a password
RABBITMQ_PASSWORD=$(openssl rand -base64 32)

#Then Run
kubectl create secret generic rabbitmq-secret \
  --from-literal=rabbitmq-password=$RABBITMQ_PASSWORD \
  -n expense-tracker
```

### RabbitMQ Helm

```bash
helm install rabbitmq bitnami/rabbitmq \
  --namespace expense-tracker \
  --values rabbitmq-values.yaml
```

**After Install RabbitMQ update the backend ConfigMap**

- Reference `backend-config.yaml`

````yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: expense-tracker
data:
  DB_DRIVER: "postgres"
  # existing all config
  ELASTICSEARCH_PASSWORD: "your-app-password"
  # these are the configs need to added
  RABBITMQ_HOST: "rabbitmq.expense-tracker.svc.cluster.local"
  RABBITMQ_PORT: "5672"
  RABBITMQ_USER: "expense-user"
  RABBITMQ_VHOST: "/"
````

**And then update the secret as well**

- Reference `backend-secret.yaml`

````yaml
# backend-secret.yaml (updated)
apiVersion: v1
kind: Secret
metadata:
  name: backend-secret
  namespace: expense-tracker
type: Opaque
data:
  # ... (keep all your existing data) ...
  DB_PASSWORD: YXBwbGljYXRpb25QYXNzNDMyMQ==
  JWT_SECRET: VU1ucmk1cUp1QXcvT3NSZTlnY0d6T2IyL1ZZWWZ2cWE2NnFwU2k0S1lqaz0K
  SMTP_PASSWORD: eW91ci1hcHAtcGFzc3dvcmQ=
  REDIS_PASSWORD: eW91ci1hcHAtcGFzc3dvcmQ=
  ELASTICSEARCH_PASSWORD: eW91ci1hcHAtcGFzc3dvcmQ=

  # --- Add RabbitMQ Password ---
  # Use the same password you generated in Step 1
  # echo -n "your-rabbitmq-password" | base64
  RABBITMQ_PASSWORD: eW91ci1yYWJiaXRtcS1wYXNzd29yZA== # <-- REPLACE with your base64 encoded password
````
**After modifying apply the changes onto cluster by running below commands:**

```bash
kubectl apply -f backend-config.yaml -n expense-tracker
kubectl apply -f backend-secret.yaml -n expense-tracker
```

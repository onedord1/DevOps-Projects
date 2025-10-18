# Installing KEDA using Helm

Add the repo

```bash
helm repo add kedacore https://kedacore.github.io/charts
helm repo update
```
Install KEDA

`helm install keda kedacore/keda --namespace keda-system --create-namespace`

After Installed KEDA adjust the `keda-scaler.yaml` then apply using below command: 

`kubectl apply -f keda-scaler.yaml -n expense-tracker`


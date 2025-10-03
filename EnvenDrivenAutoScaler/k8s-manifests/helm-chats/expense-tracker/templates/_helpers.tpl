{{- define "expense-tracker.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "expense-tracker.fullname" -}}
{{ printf "%s-%s" .Release.Name .Chart.Name }}
{{- end }}

{{- define "expense-tracker.backendName" -}}
{{ printf "%s-backend" (include "expense-tracker.fullname" .) }}
{{- end }}

{{- define "expense-tracker.frontendName" -}}
{{ printf "%s-frontend" (include "expense-tracker.fullname" .) }}
{{- end }}

{{- define "expense-tracker.postgresName" -}}
{{ printf "%s-postgres" (include "expense-tracker.fullname" .) }}
{{- end }}

{{- define "expense-tracker.serviceAccountName" -}}
{{- .Release.Name }}-serviceaccount
{{- end -}}

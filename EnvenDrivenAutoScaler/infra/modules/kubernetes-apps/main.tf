resource "kubernetes_namespace" "expense_tracker" {
  metadata {
    name = "expense-tracker"
  }
}

# Create ConfigMap for backend with RDS connection
resource "kubernetes_config_map" "backend_config" {
  metadata {
    name      = "dev-backend-config"
    namespace = kubernetes_namespace.expense_tracker.metadata[0].name
    labels = {
      app         = "expense-tracker"
      env         = "development"
      managed-by  = "terraform"
    }
  }

  data = {
    DB_CONN_MAX_IDLE_TIME = "1m"
    DB_CONN_MAX_LIFETIME  = "5m"
    DB_DRIVER             = "postgres"
    DB_HOST               = var.rds_endpoint
    DB_MAX_IDLE_CONNS     = "25"
    DB_MAX_OPEN_CONNS     = "100"
    DB_NAME               = var.rds_database
    DB_PORT               = var.rds_port
    DB_SSL_MODE           = "require"
    DB_USERNAME           = var.rds_username
    # Keep other existing configurations
    ELASTICSEARCH_INDEX   = "expenses"
    ELASTICSEARCH_URL     = "http://elasticsearch-service:9200"
    ELASTICSEARCH_USERNAME = ""
    ENABLE_PROFILING      = "true"
    ENVIRONMENT           = "development"
    FROM_EMAIL            = "your-email@gmail.com"
    GOGC                  = "100"
    GOMAXPROCS            = "0"
    GOMEMLIMIT            = "1073741824"
    IDLE_TIMEOUT          = "120s"
    JWT_EXPIRY_DAYS       = "7"
    LOG_LEVEL             = "DEBUG"
    MAX_FILE_SIZE         = "10485760"
    PORT                  = "7070"
    READ_TIMEOUT          = "5s"
    REDIS_DB              = "0"
    REDIS_HOST            = "redis-master.redis.svc.cluster.local"
    REDIS_POOL_SIZE       = "50"
    REDIS_PORT            = "6379"
    SMTP_HOST             = "smtp.gmail.com"
    SMTP_PORT             = "587"
    SMTP_USERNAME         = "your-email@gmail.com"
    STORAGE_TYPE          = "local"
    UPLOAD_DIR            = "/app/uploads"
    WRITE_TIMEOUT         = "10s"
  }
}

# Create ConfigMap for frontend
resource "kubernetes_config_map" "frontend_config" {
  metadata {
    name      = "dev-frontend-config"
    namespace = kubernetes_namespace.expense_tracker.metadata[0].name
    labels = {
      app         = "expense-tracker"
      env         = "development"
      managed-by  = "terraform"
    }
  }

  data = {
    API_URL = "http://dev-expense-tracker-be-service:7070"
  }
}

# Create Secret for backend
resource "kubernetes_secret" "backend_secret" {
  metadata {
    name      = "dev-backend-secret"
    namespace = kubernetes_namespace.expense_tracker.metadata[0].name
    labels = {
      app         = "expense-tracker"
      env         = "development"
      managed-by  = "terraform"
    }
  }

  data = {
    DB_PASSWORD         = var.rds_password
    ELASTICSEARCH_PASSWORD = "your-app-password"
    JWT_SECRET          = "UMnrJuAw/OsRGOb2v/VYfvqa6qpSi4KYjk="
    REDIS_PASSWORD      = "your-app-password"
    SMTP_PASSWORD       = "your-app-password"
  }
}

# Create Docker registry secret
resource "kubernetes_secret" "docker_registry" {
  metadata {
    name      = "dev-docker-registry-secret"
    namespace = kubernetes_namespace.expense_tracker.metadata[0].name
    labels = {
      app         = "expense-tracker"
      env         = "development"
      managed-by  = "terraform"
    }
  }

  type = "kubernetes.io/dockerconfigjson"

  data = {
    ".dockerconfigjson" = <<DOCKERCFG
{
  "auths": {
    "https://index.docker.io/v1/": {
      "username": "kaderdevops",
      "password": "dckr_pat_BF3AgGaq-6N8mdnM",
      "auth": "VWRXbGNtVmxjbVJsZG05d2N6R5WDGRGSalVGZ3pRV2RIWVhFdE5rNDRSMGd5YUcxa2JrMD0="
    }
  }
}
DOCKERCFG
  }
}

# Create Service for backend
resource "kubernetes_service" "backend" {
  metadata {
    name      = "dev-expense-tracker-be-service"
    namespace = kubernetes_namespace.expense_tracker.metadata[0].name
    labels = {
      app         = "expense-tracker"
      env         = "development"
      managed-by  = "terraform"
    }
  }

  spec {
    selector = {
      app = "expense-tracker-be"
    }

    port {
      protocol    = "TCP"
      port        = 7070
      target_port = 7070
    }

    type = "ClusterIP"
  }
}

# Create Service for frontend
resource "kubernetes_service" "frontend" {
  metadata {
    name      = "dev-expense-tracker-fe-service"
    namespace = kubernetes_namespace.expense_tracker.metadata[0].name
    labels = {
      app         = "expense-tracker"
      env         = "development"
      managed-by  = "terraform"
    }
  }

  spec {
    selector = {
      app = "expense-tracker-fe"
    }

    port {
      protocol    = "TCP"
      port        = 80
      target_port = 8000
    }

    type = "ClusterIP"
  }
}

# Create Deployment for backend
resource "kubernetes_deployment" "backend" {
  metadata {
    name      = "dev-expense-tracker-be"
    namespace = kubernetes_namespace.expense_tracker.metadata[0].name
    labels = {
      app         = "expense-tracker"
      env         = "development"
      managed-by  = "terraform"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "expense-tracker-be"
      }
    }

    template {
      metadata {
        labels = {
          app = "expense-tracker-be"
        }
      }

      spec {
        container {
          name  = "backend"
          image = "${var.backend_image_name}:${var.backend_image_tag}"

          port {
            container_port = 7070
          }

          env_from {
            config_map_ref {
              name = kubernetes_config_map.backend_config.metadata[0].name
            }
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.backend_secret.metadata[0].name
            }
          }

          liveness_probe {
            http_get {
              path = "/health"
              port = 7070
            }
            initial_delay_seconds = 15
            period_seconds        = 20
          }

          readiness_probe {
            http_get {
              path = "/health"
              port = 7070
            }
            initial_delay_seconds = 5
            period_seconds        = 10
          }

          resources {
            limits = {
              cpu    = "500m"
              memory = "1Gi"
            }
            requests = {
              cpu    = "250m"
              memory = "256Mi"
            }
          }

          security_context {
            allow_privilege_escalation = false
            read_only_root_filesystem  = true
          }

          volume_mount {
            name       = "uploads-volume"
            mount_path = "/app/uploads"
          }
        }

        image_pull_secrets {
          name = kubernetes_secret.docker_registry.metadata[0].name
        }

        security_context {
          fs_group     = 1001
          run_as_group = 1001
          run_as_non_root = true
          run_as_user  = 1001
        }

        volume {
          name = "uploads-volume"
          empty_dir {}
        }
      }
    }
  }
}

# Create Deployment for frontend
resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "dev-expense-tracker-fe"
    namespace = kubernetes_namespace.expense_tracker.metadata[0].name
    labels = {
      app         = "expense-tracker"
      env         = "development"
      managed-by  = "terraform"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "expense-tracker-fe"
      }
    }

    template {
      metadata {
        labels = {
          app = "expense-tracker-fe"
        }
      }

      spec {
        container {
          name  = "frontend"
          image = "${var.frontend_image_name}:${var.frontend_image_tag}"

          port {
            container_port = 8000
          }

          env {
            name = "API_URL"
            value_from {
              config_map_key_ref {
                name = kubernetes_config_map.frontend_config.metadata[0].name
                key  = "API_URL"
              }
            }
          }

          liveness_probe {
            http_get {
              path = "/"
              port = 8000
            }
            initial_delay_seconds = 10
            period_seconds        = 15
          }

          readiness_probe {
            http_get {
              path = "/"
              port = 8000
            }
            initial_delay_seconds = 5
            period_seconds        = 5
          }

          resources {
            limits = {
              cpu    = "200m"
              memory = "256Mi"
            }
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
          }

          security_context {
            allow_privilege_escalation = false
            read_only_root_filesystem  = true
          }

          volume_mount {
            name       = "nginx-cache"
            mount_path = "/var/cache/nginx"
          }

          volume_mount {
            name       = "nginx-pid"
            mount_path = "/var/run"
          }
        }

        image_pull_secrets {
          name = kubernetes_secret.docker_registry.metadata[0].name
        }

        security_context {
          fs_group     = 101
          run_as_group = 101
          run_as_non_root = true
          run_as_user  = 101
        }

        volume {
          name = "nginx-cache"
          empty_dir {}
        }

        volume {
          name = "nginx-pid"
          empty_dir {}
        }
      }
    }
  }
}

# Create Ingress for frontend
resource "kubernetes_ingress" "frontend" {
  metadata {
    name      = "dev-expense-tracker-ingress"
    namespace = kubernetes_namespace.expense_tracker.metadata[0].name
    labels = {
      app         = "expense-tracker"
      env         = "development"
      managed-by  = "terraform"
    }
    annotations = {
      "kubernetes.io/ingress.class"                    = "alb"
      "alb.ingress.kubernetes.io/scheme"               = "internet-facing"
      "alb.ingress.kubernetes.io/target-type"          = "ip"
      "alb.ingress.kubernetes.io/load-balancer-attributes" = "access_logs.s3.enabled=true,access_logs.s3.bucket=${var.alb_logs_bucket_name}"
    }
  }

  spec {
    backend {
      service_name = kubernetes_service.frontend.metadata[0].name
      service_port = 80
    }

    rule {
      http {
        path {
          path = "/"
          backend {
            service_name = kubernetes_service.frontend.metadata[0].name
            service_port = 80
          }
        }
      }
    }
  }

  depends_on = [
    kubernetes_deployment.frontend,
    kubernetes_service.frontend
  ]
}
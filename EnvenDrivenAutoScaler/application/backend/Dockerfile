FROM golang:1.23-alpine AS builder
RUN apk add --no-cache git ca-certificates tzdata gcc musl-dev
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o main cmd/server/main.go \
    -o healthcheck cmd/healthcheck/main.go
    

FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/passwd /etc/passwd
WORKDIR /app
COPY --from=builder /app/main .
COPY --from=builder /app/healthcheck .
USER nobody
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["./healthcheck"]

CMD ["./main"]
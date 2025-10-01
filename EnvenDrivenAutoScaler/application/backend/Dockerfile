
FROM golang:1.25-alpine AS builder
RUN apk add --no-cache ca-certificates git
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-w -s" \
    -trimpath \
    -o server ./cmd/server && \
    CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-w -s" \
    -trimpath \
    -o healthcheck ./cmd/healthcheck  

FROM alpine:3.19
LABEL maintainer="kader.devops@gmail.com"
LABEL description="production-ready expense-tracker backend."
RUN apk --no-cache add ca-certificates && \
    addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/server .
COPY --from=builder /app/healthcheck .
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 8080
ENTRYPOINT ["./server"]
HEALTHCHECK --interval=15s --timeout=2s --start-period=5s --retries=3 \
    CMD ["./healthcheck"]
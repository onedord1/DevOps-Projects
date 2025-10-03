FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_URL
COPY package* .
RUN npm install --loglevel info
COPY . .
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build -- --logLevel info

FROM base-images/nginx:1.29.1-alpine-slim
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -h /home/appuser -s /bin/sh -D appuser && \
    mkdir -p /run /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp && \
    touch /run/nginx.pid && \
    chown -R appuser:appgroup /run/nginx.pid /var/cache/nginx /usr/share/nginx/html /home/appuser && \
    chmod -R 755 /run /var/cache/nginx /usr/share/nginx/html /home/appuser 
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
USER appuser
ENV HOME=/home/appuser
EXPOSE 8000
CMD ["nginx", "-g", "daemon off;"]
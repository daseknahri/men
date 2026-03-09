# ─── Stage 1: Builder (optional lint/validation step) ───────────────────────
# For a pure static app, the builder stage is lightweight.
# If you later add a build step (e.g., npm run build), do it here.
FROM node:20-alpine AS builder

WORKDIR /app
COPY . .

# No build step needed for a pure static app.
# Add your build commands here if you add a bundler in the future:
# RUN npm ci && npm run build

# ─── Stage 2: Production (nginx) ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy static files from builder
COPY --from=builder /app /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove the default nginx.conf server block
RUN rm -f /etc/nginx/conf.d/default.conf.bak

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

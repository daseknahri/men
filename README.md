# 🍔 Foody — Restaurant Menu App

A modern, dynamic restaurant menu and ordering system. Pure static web app (HTML + CSS + JS) served via nginx in Docker.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Web Server | nginx 1.27 (Alpine) |
| Container | Docker (multi-stage build) |
| Deployment | Coolify + Traefik (self-hosted VPS) |

---

## 🚀 Running Locally

### Option 1 — Node.js serve (development)
```bash
npx -y serve -l 8080
```
Open: http://localhost:8080

### Option 2 — Docker (production-like)

```bash
# 1. Copy env file and configure
cp .env.example .env

# 2. Build and run
docker compose up -d --build

# 3. Open in browser
open http://localhost:8090
```

### Stop
```bash
docker compose down
```

---

## 🌐 Deploying to VPS with Coolify

### Prerequisites
- A VPS with [Coolify](https://coolify.io) installed
- A domain pointed to your VPS IP
- Traefik enabled in Coolify (enabled by default)

### Steps

1. **Push code to GitHub** (already done via CI)

2. **In Coolify:**
   - Add new Resource → Docker Compose
   - Connect your GitHub repo
   - Set the `DOMAIN` environment variable to your domain (e.g., `foody.yourdomain.com`)
   - Deploy

3. **Coolify will automatically:**
   - Pull the repo
   - Build the Docker image
   - Configure Traefik for HTTPS routing
   - Start the container with restart policy

### Environment Variables (set in Coolify UI)

| Variable | Description | Example |
|---|---|---|
| `DOMAIN` | Public domain name | `foody.yourdomain.com` |
| `TZ` | Server timezone | `Africa/Casablanca` |
| `HOST_PORT` | Local port (dev only) | `8090` |

---

## 📁 Project Structure

```
foody-main/
├── index.html          # Main customer-facing page
├── admin.html          # Admin panel
├── app.js              # Frontend logic
├── admin.js            # Admin panel logic
├── style.css           # All styles
├── images/             # Static assets
├── nginx.conf          # nginx server config
├── Dockerfile          # Multi-stage Docker build
├── docker-compose.yml  # Compose with Traefik labels
├── .env.example        # Environment variable template
└── .github/workflows/  # GitHub Pages CI (alternative)
```

---

## 🔄 Multi-Restaurant Template

This project is designed as a **base template**. To deploy a second restaurant:

```bash
# 1. Copy the template
cp -r foody-main restaurant-two

# 2. Edit the .env
cd restaurant-two
cp .env.example .env
# Set DOMAIN=restaurant-two.yourdomain.com
# Set HOST_PORT=8091

# 3. Deploy
docker compose up -d --build
```

Each restaurant gets its own domain, container, and port.

---

## ✅ Health Check

The container exposes a health check at `http://localhost:80/`. Docker and Coolify will automatically restart the container if it becomes unhealthy.

---

## 📞 Admin Panel

Access at: `https://yourdomain.com/admin.html`

The admin panel lets you manage:
- Menu items & categories
- Social media links (including WhatsApp number)
- WiFi credentials
- Promo section
- Gallery images

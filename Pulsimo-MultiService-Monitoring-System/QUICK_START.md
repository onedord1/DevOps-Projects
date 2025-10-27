# ⚡ Quick Start Guide

## 🚀 Get Started in 3 Commands

```bash
git clone <your-repo>
cd service-monitoring-system
docker-compose up -d
```

**That's it!** Everything is automated.

---

## 🎯 Common Tasks

### **Start All Services**
```bash
docker-compose up -d
```

### **View Logs**
```bash
docker-compose logs -f
```

### **Restart a Service**
```bash
docker-compose restart frontend
docker-compose restart api-gateway
```

### **Rebuild After Code Changes**
```bash
# Frontend only
docker-compose up -d --build frontend

# Backend only  
docker-compose up -d --build api-gateway

# Everything
docker-compose up -d --build
```

---

## 🌐 Access URLs

- **Frontend Dashboard:** http://localhost:3000
- **API Gateway:** http://localhost:8080
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

---

## 🔧 Frontend Development (Without Docker)

### **Option 1: Automatic (Recommended)**
```bash
cd frontend
npm run dev  # Installs dependencies automatically if missing!
```

### **Option 2: Manual Setup**
```bash
cd frontend
./setup.sh   # One-time setup
npm run dev
```

**Note:** Dependencies install automatically now! See `frontend/README_SETUP.md`

---

## ❓ FAQ

**Q: Do I need to run npm install manually?**  
A: No! It's automatic. Just run `npm run dev`.

**Q: What if I delete node_modules?**  
A: No problem! Next run auto-installs.

**Q: How do I see service analytics?**  
A: Click the 📊 icon on any service card.

**Q: Services not starting?**  
A: Check logs: `docker-compose logs [service-name]`

---

## 📚 Documentation

- **Analytics Feature:** `docs/ANALYTICS_README.md`
- **Setup Automation:** `frontend/README_SETUP.md`  
- **API Docs:** `API.md`
- **Feature Roadmap:** `PHASES.md`

---

**Need help?** Check the docs folder or run `docker-compose logs`

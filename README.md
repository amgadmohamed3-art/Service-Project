# MovieReview - Service Oriented MERN Scaffold

A complete microservices-based MERN (MongoDB, Express, React, Node.js) scaffold for a movie review platform. This project demonstrates a service-oriented architecture with an API Gateway and multiple independent services.

## 🚀 Quick Start (Choose One)

### Demo Mode (No Backend) - 5 minutes
```bash
cd frontend
npm install
npm start
# Visit http://localhost:3002
```

### With MongoDB Atlas - 15 minutes
1. See **[GETTING_STARTED.md](./GETTING_STARTED.md)** for complete guide
2. Run: `.\setup-mongodb.ps1` (PowerShell)
3. Start services in separate terminals

### Full Microservices - 30 minutes
Follow MongoDB Atlas setup, then start all backend services

---

## 📚 Documentation Guide

| Document | Purpose | Read When |
|----------|---------|-----------|
| **[GETTING_STARTED.md](./GETTING_STARTED.md)** | Overview & quick decisions | First! |
| **[SETUP_FLOWCHART.md](./SETUP_FLOWCHART.md)** | Visual setup paths | Visual learner? |
| **[MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)** | MongoDB setup steps | Setting up MongoDB |
| **[MONGODB_API_KEY_GUIDE.md](./MONGODB_API_KEY_GUIDE.md)** | API key explanation | "What's an API key?" |
| **[MONGODB_QUICK_REFERENCE.md](./MONGODB_QUICK_REFERENCE.md)** | Quick reference card | Need quick help |
| **[SETUP_COMPLETE.md](./SETUP_COMPLETE.md)** | Final summary | After setup |

---

## 🏗️ Architecture

```
                        ┌─────────────┐
                        │   Frontend  │
                        │   (React)   │
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │ API Gateway │
                        │  (Port 3000)│
                        └──────┬──────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────▼───┐   ┌────▼───┐   ┌──▼────┐   ┌────▼───┐
   │ User   │   │ Auth   │   │Content│   │Review  │
   │Service │   │Service │   │Service│   │Service │
   │(4001)  │   │(4000)  │   │(4004) │   │(4003)  │
   └────┬───┘   └────┬───┘   └───┬───┘   └────┬───┘
        │            │           │            │
        └────────────┼───────────┼────────────┘
                     │           │
                ┌────▼───────────▼────┐
                │  MongoDB Atlas      │
                │  (Cloud Database)   │
                └─────────────────────┘
```

## 📦 Services Overview

| Service | Port | Purpose | Database |
|---------|------|---------|----------|
| **Frontend** | 3002 | React UI | Browser Storage |
| **User Service** | 4001 | User management | MongoDB |
| **Auth Service** | 4000 | JWT authentication | MongoDB |
| **Content Service** | 4004 | Movie metadata | MongoDB |
| **Review Service** | 4003 | Reviews & ratings | MongoDB |
| **Search Service** | 4005 | Search functionality | Mock Data |
| **API Gateway** | 3000 | Route aggregation | N/A |

---

## ✨ Features

### Frontend
- ✅ User authentication (login/signup)
- ✅ Movie search with pagination
- ✅ Movie details page
- ✅ Add to favorites
- ✅ Reviews & ratings
- ✅ Responsive design
- ✅ Protected routes

### Backend (Ready to Connect)
- ✅ User registration & profiles
- ✅ JWT token authentication
- ✅ Movie content management
- ✅ Reviews & ratings system
- ✅ Search functionality
- ✅ Microservices architecture
- ✅ MongoDB database

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 14+
- npm or yarn
- MongoDB Atlas account (for full setup)

### Option 1: Demo Mode (Fastest)
```bash
cd frontend
npm install
npm start
```

### Option 2: With MongoDB
1. Read **[GETTING_STARTED.md](./GETTING_STARTED.md)**
2. Create MongoDB Atlas account (free tier)
3. Run setup script:
   ```bash
   .\setup-mongodb.ps1  # Windows PowerShell
   ```
4. Start services:
   ```bash
   cd user-service && npm start       # Terminal 1
   cd frontend && npm start           # Terminal 2
   ```

### Option 3: Full Stack
Follow Option 2, then start remaining services in additional terminals:
```bash
cd auth-service && npm start         # Terminal 3
cd review-service && npm start       # Terminal 4
cd content-service && npm start      # Terminal 5
cd search-service && npm start       # Terminal 6
```

---

## 🔑 MongoDB Setup

### What You Need
1. **MongoDB Atlas Account** → https://www.mongodb.com/cloud/atlas
2. **Connection String** → Contains username/password
3. **Environment Variables** → Stored in `.env` files

### Example Connection String
```
mongodb+srv://moviereview:PASSWORD@cluster0.xxxxx.mongodb.net/user-service?retryWrites=true&w=majority
```

### Created Files for You
- ✅ `setup-mongodb.ps1` - Automated setup script
- ✅ `.env.example` - Templates in each service
- ✅ `MONGODB_ATLAS_SETUP.md` - Complete guide
- ✅ `.gitignore` - Protects `.env` files

---

## 🔐 Security

### Best Practices
✅ Never commit `.env` files
✅ Use strong passwords (12+ chars)
✅ Store credentials securely
✅ Use different keys for dev/prod
✅ Rotate credentials periodically

### Created for You
- `.gitignore` prevents `.env` upload
- `.env.example` shows structure
- All services use environment variables

---

## 📝 Environment Variables

Each service needs a `.env` file. Use `.env.example` as template:

**user-service/.env**
```env
MONGO_URI=mongodb+srv://moviereview:PASSWORD@cluster0.xxxxx.mongodb.net/user-service?retryWrites=true&w=majority
PORT=4001
```

**auth-service/.env**
```env
MONGO_URI=mongodb+srv://moviereview:PASSWORD@cluster0.xxxxx.mongodb.net/auth-service?retryWrites=true&w=majority
PORT=4000
JWT_SECRET=your-secret-key-change-in-production
```

See `setup-mongodb.ps1` script to automate this.

---

## 🧪 Verification

### Check Services Are Running
```bash
# User Service
curl http://localhost:4001/

# Frontend
curl http://localhost:3002/

# Search Service
curl http://localhost:4005/api/search/movies?q=movie
```

### Expected Responses
- Services return status JSON
- Frontend returns HTML
- Search returns movies array

---

## 📚 Learning Resources

### Project Files
- `GETTING_STARTED.md` - Start here!
- `SETUP_FLOWCHART.md` - Visual guide
- `MONGODB_API_KEY_GUIDE.md` - API key Q&A

### External Resources
- [MongoDB Docs](https://docs.mongodb.com/)
- [Express Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Node.js Handbook](https://nodejs.org/docs/)

---

## 🐛 Troubleshooting

### Common Issues
| Issue | Solution |
|-------|----------|
| Port already in use | Change PORT in .env or stop processes |
| MongoDB connection fails | Check credentials, verify IP whitelist |
| npm module not found | Run `npm install` in service directory |
| Can't login | Sign up first, or check browser Local Storage |

### Debug Tips
1. Check browser console (F12 → Console)
2. Check Network tab for API calls
3. Check MongoDB Atlas dashboard
4. Review service logs in terminal

See **[MONGODB_QUICK_REFERENCE.md](./MONGODB_QUICK_REFERENCE.md)** for more troubleshooting.

---

## 🚀 Deployment

### Frontend
```bash
npm run build
# Deploy build/ folder to Vercel, Netlify, or GitHub Pages
```

### Backend Services
```bash
# Deploy each service to:
# - Heroku
# - AWS Lambda
# - Google Cloud Run
# - Docker containers
```

### Database
MongoDB Atlas free tier (512MB) is ready for production.

---

## 📊 Project Status

### ✅ Completed
- [x] Frontend with React
- [x] Authentication system
- [x] Movie search & pagination
- [x] Movie details page
- [x] Favorites system
- [x] Responsive design
- [x] MongoDB integration setup
- [x] Microservices structure

### 🔄 Ready to Connect
- [ ] Backend API Gateway
- [ ] User authentication service
- [ ] Review storage
- [ ] Real database connection

### 📝 Optional Features
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Recommendation engine
- [ ] User profiles
- [ ] Analytics dashboard

---

## 📄 License

This project is open source and available for learning purposes.

---

## 🤝 Contributing

Feel free to fork and submit pull requests for any improvements.

---

## ❓ Questions?

1. **First time?** → Read **[GETTING_STARTED.md](./GETTING_STARTED.md)**
2. **MongoDB help?** → See **[MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)**
3. **Quick answers?** → Check **[MONGODB_QUICK_REFERENCE.md](./MONGODB_QUICK_REFERENCE.md)**
4. **Visual learner?** → Follow **[SETUP_FLOWCHART.md](./SETUP_FLOWCHART.md)**

---

**Ready to get started?** Choose your setup option above! 🎬

   cd frontend
   npm install
   npm start
   ```

### Testing the Setup

Once all services are running:

- **API Gateway:** http://localhost:3000
- **Frontend:** http://localhost:3000 (or whatever port React opens)
- **User Service ping:** http://localhost:3000/users/api/ping
- **Content Service ping:** http://localhost:3000/contents/api/ping

Example requests:
```bash
# Check user service
curl http://localhost:3000/users/api/ping

# Check content service
curl http://localhost:3000/contents/api/ping

# Register a user
curl -X POST http://localhost:3000/users/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Get content
curl http://localhost:3000/contents/api/contents/
```

## Project Structure

```
movie-review-soa/
├── user-service/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── routes/
│   ├── server.js
│   ├── package.json
│   ├── .env.sample
│   └── README.md
├── auth-service/
├── content-service/
├── recommendation-service/
├── search-service/
├── review-service/
├── notification-service/
├── admin-service/
├── api-gateway/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   └── Login.js
│   │   └── index.js
│   ├── public/
│   └── package.json
└── README.md
```

## Development Notes

### Adding a New Service

1. Copy an existing service folder as a template
2. Update `package.json` with new service name
3. Update `server.js` with new PORT and service name
4. Create models, controllers, and routes in `src/`
5. Add proxy route in `api-gateway/server.js`

### Database

- Each service has its own MongoDB database (separation of concerns)
- Connection string: `mongodb://localhost:27017/{service-name}`
- Update MONGO_URI in each service's `.env`

### Authentication Flow

1. User registers via `user-service`
2. Auth token issued by `auth-service`
3. Token verified for protected endpoints
4. Each service validates token (implement middleware)

### Environment Variables

Each service requires:
- `PORT`: Service port
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for token signing

## Next Steps / TODO

- [ ] Implement proper JWT middleware for protected routes
- [ ] Add error handling and validation
- [ ] Set up logging and monitoring
- [ ] Configure CORS properly for production
- [ ] Add rate limiting
- [ ] Implement API versioning
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Set up Docker and docker-compose
- [ ] Add unit and integration tests
- [ ] Configure CI/CD pipeline
- [ ] Database migration tools
- [ ] Message queues for async operations

## Production Considerations

- Use environment-specific configs
- Implement service discovery
- Add load balancing
- Configure health checks
- Set up distributed tracing
- Implement circuit breakers
- Add API rate limiting
- Use API versioning
- Secure secrets (use vaults)
- Add comprehensive logging

## License

MIT

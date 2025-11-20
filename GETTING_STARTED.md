# MovieReview - Complete Setup Guide

## 📋 What I've Created For You

### 1. **MongoDB Atlas Documentation**
- ✅ `MONGODB_ATLAS_SETUP.md` - Step-by-step setup guide
- ✅ `MONGODB_API_KEY_GUIDE.md` - API key explanation
- ✅ `MONGODB_GUIDE.md` - Architecture overview

### 2. **Environment Configuration**
- ✅ `.env.example` files in each service directory
- ✅ `.gitignore` - Prevents `.env` from being committed
- ✅ Ready-to-use templates for all services

### 3. **Setup Scripts**
- ✅ `setup-mongodb.ps1` - PowerShell script (recommended for Windows)
- ✅ `setup-mongodb.bat` - Batch script alternative

### 4. **Updated Frontend**
- ✅ Login/Signup now works with localStorage (no MongoDB needed for demo)
- ✅ Falls back to local storage if backend isn't available

---

## 🚀 Getting Started (3 Options)

### Option 1: Quick Demo (No MongoDB Required)
```powershell
# Just run the frontend with mock data
cd frontend
npm install
npm start

# Go to http://localhost:3002
# Sign up: any email/password
# Enjoy! No backend setup needed
```

### Option 2: With MongoDB Atlas (Recommended)

**Step 1: Create MongoDB Account**
1. Visit: https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create cluster
4. Create database user (username/password)
5. Whitelist IP address
6. Get connection string

**Step 2: Run Setup Script**
```powershell
# From project root
.\setup-mongodb.ps1

# Paste your MongoDB connection string when prompted
# Script creates .env files automatically
```

**Step 3: Start Services**
```powershell
# Terminal 1: User Service
cd user-service
npm install
npm start

# Terminal 2: Frontend
cd frontend
npm install
npm start

# Terminal 3: Search Service
cd search-service
npm install
npm start

# Visit http://localhost:3002
```

### Option 3: Manual Setup

```powershell
# 1. Create .env in user-service/
# Edit with your MongoDB connection string:
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/user-service
PORT=4001

# 2. Repeat for auth-service, review-service, etc.

# 3. Start each service
cd user-service && npm install && npm start
cd ../auth-service && npm install && npm start
cd ../frontend && npm install && npm start
```

---

## 📊 Architecture

```
┌────────────────────────────────────────────────┐
│         Frontend (React)                       │
│         http://localhost:3002                  │
└────────────────┬─────────────────────────────┘
                 │
        ┌────────▼────────┐
        │  API Gateway    │
        │ http://localhost:3000
        └────────┬────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼────┐  ┌────▼────┐  ┌───▼────┐
│ User   │  │  Auth   │  │ Review │
│Service │  │ Service │  │Service │
│ :4001  │  │  :4000  │  │ :4003  │
└───┬────┘  └────┬────┘  └───┬────┘
    │            │            │
    └────────────┼────────────┘
                 │
         ┌───────▼────────┐
         │  MongoDB Atlas │
         │     (Cloud)    │
         │                │
         │ Databases:     │
         │ • user-service │
         │ • auth-service │
         │ • review-service
         └────────────────┘
```

---

## 🔑 Understanding MongoDB Credentials

### Traditional API Key (Not Used Here)
```
API Key: 1a2b3c4d5e6f7g8h9i0j
```

### MongoDB Atlas Connection Method
```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE

Components:
├── Username: moviereview
├── Password: MySecurePass123!@
├── Cluster: cluster0.abc123def.mongodb.net
└── Database: user-service
```

### Example
```
mongodb+srv://moviereview:MySecurePass123!@cluster0.abc123.mongodb.net/user-service?retryWrites=true&w=majority
```

---

## 📁 File Structure

```
movie-review-soa/
│
├── 📄 MONGODB_ATLAS_SETUP.md       ← Step-by-step guide
├── 📄 MONGODB_API_KEY_GUIDE.md     ← API key explanation
├── 📄 MONGODB_GUIDE.md             ← Architecture
├── 📄 GETTING_STARTED.md           ← This file
│
├── 🔧 setup-mongodb.ps1            ← PowerShell setup script
├── 🔧 setup-mongodb.bat            ← Batch setup script
├── 📄 .gitignore                   ← Protects .env files
│
├── user-service/
│   ├── 📄 .env.example             ← Template
│   ├── 📄 .env                     ← Your config (created by script)
│   ├── server.js
│   └── src/
│
├── auth-service/
│   ├── 📄 .env.example             ← Template
│   ├── 📄 .env                     ← Your config (created by script)
│   └── server.js
│
├── review-service/
│   ├── 📄 .env.example
│   ├── 📄 .env
│   └── server.js
│
├── search-service/
│   ├── 📄 .env.example
│   ├── 📄 .env
│   └── server.js
│
└── frontend/
    ├── src/pages/
    │   ├── Login.js                ← Updated with localStorage auth
    │   ├── Home.js
    │   └── MovieDetail.js
    └── server.js
```

---

## ✅ Verification Checklist

- [ ] MongoDB account created
- [ ] Cluster created (free tier)
- [ ] Database user created
- [ ] IP whitelisted
- [ ] Connection string obtained
- [ ] `.env` files created in each service
- [ ] `npm install` run in each service
- [ ] Services starting without errors
- [ ] Frontend accessible at http://localhost:3002
- [ ] Can sign up and login
- [ ] Can see movies and search
- [ ] Can click movie to see details

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Network Error" on signup | Try demo mode (localStorage) or check MongoDB connection |
| "MongoServerSelectionError" | Check internet, verify credentials in .env |
| Connection timeout | Wait 5 min after cluster creation, add IP to whitelist |
| "Invalid username/password" | Check .env file for typos |
| Port already in use | Change PORT in .env or stop other processes |
| "Cannot find module dotenv" | Run `npm install` in the service directory |

---

## 📞 Getting Help

### Documents to Read
1. `MONGODB_ATLAS_SETUP.md` - Detailed step-by-step
2. `MONGODB_API_KEY_GUIDE.md` - API key questions
3. `README.md` - Project overview

### Resources
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Node.js Guide: https://nodejs.org/
- Express Docs: https://expressjs.com/
- React Docs: https://react.dev/

### Quick Commands
```powershell
# Check if Node is installed
node --version

# Check if MongoDB is running locally
mongosh localhost:27017

# Check if port is in use
netstat -ano | findstr :3002

# Kill process using port
taskkill /PID <PID> /F
```

---

## 🎯 Current Status

### ✅ Working
- Frontend with React
- Movie search and display
- Movie details page
- Add to favorites
- Login/Signup (localStorage mode)
- Pagination (10 movies per page)

### 🔄 Ready to Connect (with MongoDB Atlas)
- User registration (with password hashing)
- Authentication (JWT tokens)
- Review submission
- User profiles
- Favorite storage in database

### 📝 Not Yet Implemented
- Email notifications
- Admin dashboard
- Recommendations
- API Gateway routing

---

## 🚀 Next Steps

1. **Set up MongoDB Atlas** (follow MONGODB_ATLAS_SETUP.md)
2. **Run setup script** or create .env files manually
3. **Start all services** (in separate terminals)
4. **Access frontend** at http://localhost:3002
5. **Create account** and start exploring!

---

**Questions? Check the documentation files or review the setup scripts!** 📚

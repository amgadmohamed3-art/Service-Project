# MovieReview - Setup Flowchart & Decision Tree

## 🚀 Which Setup Path Should You Choose?

```
                    START HERE
                        │
                        ▼
        ┌──────────────────────────────┐
        │  Want to test the app now?   │
        │  (No backend needed)         │
        └──────────────┬───────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
       YES                            NO
        │                             │
        ▼                             ▼
  ┌─────────────┐          ┌──────────────────┐
  │  OPTION 1   │          │  OPTION 2 or 3   │
  │ QUICK DEMO  │          │ WITH MONGODB     │
  │ (1 minute)  │          │ (10-15 minutes)  │
  └────┬────────┘          └────────┬─────────┘
       │                            │
       ▼                            ▼
   cd frontend            Go to MongoDB Atlas
   npm install            https://mongodb.com/atlas
   npm start                    │
       │                        ├─ Sign up (free)
       │                        ├─ Create cluster
       ▼                        ├─ Create DB user
   http://localhost:3002        ├─ Whitelist IP
       │                        ├─ Get connection string
       │                        │
       │                        ▼
       │                   Copy connection string
       │                        │
       │                        ▼
       │                Run setup script:
       │                .\setup-mongodb.ps1
       │                        │
       │                        ├─ Paste MongoDB URI
       │                        ├─ Script creates .env files
       │                        │
       │                        ▼
       │                   Terminal 1: cd user-service
       │                   npm install && npm start
       │                        │
       │                        ▼
       │                   Terminal 2: cd frontend
       │                   npm install && npm start
       │                        │
       ▼                        ▼
   ✅ Ready to Use         ✅ Ready to Use
   
   Test with:              MongoDB-backed:
   • Any email             • User accounts
   • Any password          • Secure auth
   • Mock data             • Real database
   • Browser storage       • Persistent data
```

---

## 📋 Detailed Setup Decision Tree

### STEP 1: Assess Your Needs

```
Question: What do you want to do?
│
├─ "I just want to see the app work"
│  └─→ OPTION 1: Quick Demo (no backend needed)
│      • 1 minute setup
│      • Works on browser storage
│      • Perfect for testing UI/UX
│
├─ "I want a working app with real database"
│  └─→ OPTION 2: MongoDB Atlas Setup
│      • 10-15 minutes setup
│      • Cloud database (free tier)
│      • Production-ready
│      • Secure authentication
│
└─ "I want everything for production"
   └─→ OPTION 3: Full Microservices
       • 15-20 minutes setup
       • All backend services running
       • Real database + APIs
       • Complete SOA architecture
```

---

## 🎯 OPTION 1: Quick Demo (Fastest)

```
FLOW:
┌─────────────────────────────────┐
│ Open PowerShell/Terminal        │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ cd frontend                     │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ npm install                     │
│ npm start                       │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ Wait for compilation            │
│ (2-3 minutes)                   │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ Open http://localhost:3002      │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ Sign up or login                │
│ Any email/password works        │
└────────────┬────────────────────┘
             ▼
✅ DONE! Browse movies!
```

**Time: ~5 minutes**
**Effort: Very easy**
**Data persists: ✓ (browser storage)**
**Production ready: ✗**

---

## 🗄️ OPTION 2: MongoDB Atlas Setup

```
PHASE 1: MongoDB Account Setup (3-5 minutes)
┌──────────────────────────────────┐
│ Go to MongoDB Atlas              │
│ https://mongodb.com/atlas        │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ Click "Try Free"                 │
│ Sign up with email               │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ Verify email                     │
│ (Check inbox)                    │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ Create Cluster                   │
│ Select M0 (free tier)            │
│ Wait 2-3 minutes                 │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ Create Database User             │
│ Username: moviereview            │
│ Password: (create strong one)    │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ Network Access → Allow 0.0.0.0/0 │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ Get Connection String            │
│ Copy full URI                    │
└────────────────────────────────────┘

PHASE 2: Local Setup (5-10 minutes)
┌──────────────────────────────────┐
│ Open PowerShell                  │
│ Go to project root               │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ Run: .\setup-mongodb.ps1         │
│ Paste MongoDB connection string  │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ Script creates .env files        │
│ with your credentials            │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ Terminal 1: cd user-service      │
│ npm install && npm start         │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ Terminal 2: cd frontend          │
│ npm install && npm start         │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ Visit http://localhost:3002      │
└──────────────────────────────────┘

✅ DONE! Full app with MongoDB!
```

**Time: ~15-20 minutes**
**Effort: Easy with script**
**Data persists: ✓ (cloud database)**
**Production ready: ✓ (with configuration)**

---

## 🏢 OPTION 3: Full Microservices

```
Complete all OPTION 2 steps, then:

PHASE 3: Run All Services (2-3 minutes per service)

Terminal 3: cd auth-service
            npm install && npm start
            ├─ Check: "auth-service: MongoDB connected"
            └─ Check: "auth-service running on port 4000"

Terminal 4: cd review-service  
            npm install && npm start
            ├─ Check: "review-service: MongoDB connected"
            └─ Check: "review-service running on port 4003"

Terminal 5: cd content-service
            npm install && npm start
            ├─ Check: "content-service: MongoDB connected"
            └─ Check: "content-service running on port 4004"

Terminal 6: cd search-service
            npm install && npm start
            ├─ Check: "search-service running on port 4005"
            └─ Check: "/api/search/movies ready"

Then:
Visit http://localhost:3002
└─ All features work with real backend!

Architecture:
┌─────────────┐
│  Frontend   │──────────────────────────┐
│  :3002      │                          │
└─────────────┘                          │
      │                                  │
      ▼                                  ▼
┌─────────────┐                ┌──────────────────┐
│  API Gtw    │←───────────────│  All Services    │
│  :3000      │                │  :4000-4005      │
└─────────────┘                └────────┬─────────┘
                                        │
                                        ▼
                                ┌──────────────────┐
                                │ MongoDB Atlas    │
                                │ (Cloud)          │
                                └──────────────────┘
```

**Time: ~30-40 minutes total**
**Effort: Moderate (multiple terminals)**
**Data persists: ✓ (cloud database)**
**Production ready: ✓ (fully featured)**

---

## 🔄 Service Dependencies

```
Frontend
    ↓
    ├─→ Search Service (Mock data - no DB needed)
    │
    ├─→ User Service ──────────────┐
    │                              │
    ├─→ Auth Service ──────────────┤──→ MongoDB Atlas
    │                              │
    └─→ Review Service ────────────┘
```

---

## ✅ Success Indicators

### Option 1 Success:
```
✓ Browser opens http://localhost:3002
✓ See login/signup page
✓ Can create account with any email/password
✓ Can see movie list
✓ Can click movie for details
```

### Option 2 Success:
```
✓ All of Option 1, plus:
✓ Terminal shows: "user-service: MongoDB connected"
✓ Terminal shows: "user-service running on port 4001"
✓ New account data persists after closing browser
✓ Reviews save to database
```

### Option 3 Success:
```
✓ All of Option 2, plus:
✓ All services show "MongoDB connected"
✓ All services running on correct ports
✓ API Gateway routes all requests
✓ Full microservices architecture working
```

---

## 📊 Comparison Table

| Feature | Option 1 | Option 2 | Option 3 |
|---------|----------|----------|----------|
| Setup Time | 5 min | 15 min | 30 min |
| Backend DB | ❌ | ✅ | ✅ |
| Demo Data | ✅ | ✅ | ✅ |
| Real Users | ❌ | ✅ | ✅ |
| Reviews Save | ❌ | ✅ | ✅ |
| Full API | ❌ | ✅ | ✅ |
| Production Ready | ❌ | ✅ | ✅ |

---

## 🛠️ Quick Troubleshooting

```
"Port already in use"
├─ Change PORT in .env
└─ Or: taskkill /PID <PID> /F

"Can't start services"
├─ Check MongoDB connected ✓
├─ Verify .env file exists ✓
└─ Check dependencies: npm install ✓

"Signup fails with Network Error"
├─ Using Option 1: Works automatically
├─ Using Option 2: Check MongoDB connection
└─ Using Option 3: Ensure all services running

"Can't see movies"
├─ Option 1: Works automatically
├─ Option 2+: Check Search Service running
└─ Check http://localhost:4005/api/search/movies?q=movie
```

---

## 🎓 Learning Path

```
Start with Option 1
    ↓ (Understand UI)
    ├─ Read GETTING_STARTED.md
    ├─ Read MONGODB_API_KEY_GUIDE.md
    └─ Understand architecture
    
Advance to Option 2
    ↓ (Add database)
    ├─ Follow MONGODB_ATLAS_SETUP.md
    ├─ Learn connection strings
    └─ Understand microservices
    
Master with Option 3
    ↓ (All services)
    ├─ Run all backend services
    ├─ Test API endpoints
    └─ Deploy to production
```

---

**Choose your path above and get started!** 🚀

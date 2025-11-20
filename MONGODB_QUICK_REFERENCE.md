# MongoDB Atlas - Quick Reference Card

## MongoDB URL Structure
```
mongodb+srv://USERNAME:PASSWORD@CLUSTER/DATABASE?options
                 ↓         ↓         ↓       ↓
           moviereview  Pass123  cluster0  user-service
```

---

## Your MongoDB Credentials

| Item | Value |
|------|-------|
| **Account Email** | Create at https://www.mongodb.com/cloud/atlas |
| **Username** | moviereview |
| **Password** | (You create this) |
| **Cluster** | cluster0.xxxxx.mongodb.net |
| **Free Storage** | 512MB |

---

## Connection String Template

```
mongodb+srv://moviereview:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority
```

### For Each Service:

**User Service**
```
mongodb+srv://moviereview:PASSWORD@cluster0.xxxxx.mongodb.net/user-service?retryWrites=true&w=majority
```

**Auth Service**
```
mongodb+srv://moviereview:PASSWORD@cluster0.xxxxx.mongodb.net/auth-service?retryWrites=true&w=majority
```

**Review Service**
```
mongodb+srv://moviereview:PASSWORD@cluster0.xxxxx.mongodb.net/review-service?retryWrites=true&w=majority
```

**Content Service**
```
mongodb+srv://moviereview:PASSWORD@cluster0.xxxxx.mongodb.net/content-service?retryWrites=true&w=majority
```

---

## Setup Steps (Quick)

1. **Go to:** https://www.mongodb.com/cloud/atlas → Sign up (free)
2. **Create cluster** (M0 free tier)
3. **Create user** (Database Access → Add User)
4. **Allow IPs** (Network Access → Allow 0.0.0.0/0)
5. **Get string** (Connect → Drivers)
6. **Replace credentials** in connection string
7. **Add to .env** in each service
8. **Run setup script**: `.\setup-mongodb.ps1`

---

## Environment File (.env)

**Location:** Each service folder
**Example:** `user-service/.env`

```env
MONGO_URI=mongodb+srv://moviereview:PASSWORD@cluster0.xxxxx.mongodb.net/user-service?retryWrites=true&w=majority
PORT=4001
```

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `MongoServerSelectionError` | Check internet, verify password, wait for cluster to initialize |
| `Authentication failed` | URL encode special chars: `@`→`%40`, `!`→`%21` |
| `Connection timeout` | Whitelist IP (0.0.0.0/0) in Network Access |
| `Invalid hostname` | Check cluster name in connection string |

---

## URL Encoding for Passwords

If password has special characters:

| Symbol | Encoded |
|--------|---------|
| @ | %40 |
| ! | %21 |
| # | %23 |
| $ | %24 |
| % | %25 |

**Tool:** https://www.urlencoder.org/

---

## Security

✅ DO:
- Store password safely
- Use strong passwords (12+ chars)
- Keep .env in .gitignore

❌ DON'T:
- Commit .env to GitHub
- Share connection strings
- Use simple passwords

---

## Troubleshooting

### Connection not working?
1. Check internet connection
2. Verify credentials in .env
3. Ensure IP is whitelisted
4. Wait 5-10 min after creating cluster
5. Check MongoDB Atlas status

### Can't find MongoDB?
- You don't install MongoDB locally
- MongoDB Atlas is cloud-hosted
- Connection is over internet

### Need to change password?
1. Go to MongoDB Atlas
2. Database Access → Edit User
3. Generate new password
4. Update .env files
5. Restart services

---

## Services & Ports

| Service | Port | .env File |
|---------|------|-----------|
| Frontend | 3002 | (No MongoDB) |
| API Gateway | 3000 | (Routes) |
| User | 4001 | ✅ Add MONGO_URI |
| Auth | 4000 | ✅ Add MONGO_URI |
| Review | 4003 | ✅ Add MONGO_URI |
| Content | 4004 | ✅ Add MONGO_URI |
| Search | 4005 | Mock data |

---

## Start Commands

```powershell
# Terminal 1: User Service
cd user-service
npm install
npm start

# Terminal 2: Frontend
cd frontend
npm install
npm start

# Terminal 3: Search Service (optional)
cd search-service
npm install
npm start

# Then visit:
http://localhost:3002
```

---

## Files Created For You

✅ `MONGODB_ATLAS_SETUP.md` - Complete guide
✅ `MONGODB_API_KEY_GUIDE.md` - API key explanation
✅ `.env.example` - Templates in each service
✅ `setup-mongodb.ps1` - Automated setup
✅ `.gitignore` - Protect .env files
✅ `GETTING_STARTED.md` - Full setup guide

---

**Need help? Read: GETTING_STARTED.md or MONGODB_ATLAS_SETUP.md**

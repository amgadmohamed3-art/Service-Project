# MongoDB Setup Summary

## Quick Overview

This project uses **MongoDB Atlas** - a cloud-hosted MongoDB database service. Here's what you need to know:

### What is MongoDB Atlas?
- **Cloud database service** (no installation needed)
- **Free tier**: 512MB storage, great for development
- **No credit card required** for free tier
- **Connection string**: Contains your username, password, and cluster info

### What is the "API Key"?
In MongoDB Atlas, you don't use an "API key" in the traditional sense. Instead, you use:
- **Username**: Like `moviereview`
- **Password**: Like `MySecurePass123!@`
- These are combined into a **connection string**:
  ```
  mongodb+srv://moviereview:MySecurePass123!@cluster0.xxxxx.mongodb.net/database-name
  ```

---

## 5-Minute Setup

### 1. Create MongoDB Account
- Go to: https://www.mongodb.com/cloud/atlas
- Click "Try Free"
- Sign up with email

### 2. Create Cluster
- Click "Create Deployment"
- Choose "Free Tier"
- Wait 2-3 minutes

### 3. Create Database User
- Go to "Database Access"
- Click "Add New Database User"
- Username: `moviereview`
- Password: Create a strong one (save it!)
- Click "Add User"

### 4. Allow Connections
- Go to "Network Access"
- Click "Add IP Address"
- Click "Allow Access from Anywhere"
- Click "Confirm"

### 5. Get Connection String
- Click "Connect" on your cluster
- Choose "Drivers"
- Select "Node.js 4.x"
- Copy the connection string
- Replace `<username>` and `<password>`

### 6. Set Up Local Environment

**Option A: Using PowerShell Script (Recommended)**
```powershell
# From project root directory
.\setup-mongodb.ps1

# When prompted, paste your MongoDB connection string
# Script will create .env files for all services
```

**Option B: Manual Setup**
1. Copy the connection string
2. For each service folder (user-service, auth-service, etc.):
   - Copy `.env.example` to `.env`
   - Replace placeholder with your connection string
   - Example:
     ```
     MONGO_URI=mongodb+srv://moviereview:PASSWORD@cluster0.xxxxx.mongodb.net/user-service?retryWrites=true&w=majority
     PORT=4001
     ```

---

## Verify Connection Works

### 1. Start User Service
```powershell
cd user-service
npm install
npm start
```

### Look For This Message
```
user-service: MongoDB connected
user-service running on port 4001
```

### If You See an Error
| Error | Solution |
|-------|----------|
| `MongoServerSelectionError` | Check internet connection |
| `Invalid username` | Fix typo in .env MONGO_URI |
| `Connection timeout` | IP whitelist issue - allow all IPs (0.0.0.0/0) |
| `Authentication failed` | Check password, URL encode special chars |

---

## Your MongoDB Info (Example)

After setup, you'll have:
```
Account Email: your@email.com
Username: moviereview
Password: MySecurePass123!@
Cluster: Cluster0
Region: N. Virginia
Storage: 512MB (free tier)

Connection URL:
mongodb+srv://moviereview:MySecurePass123!@cluster0.abc123def456.mongodb.net

Services created:
- user-service database
- auth-service database
- review-service database
- content-service database
```

---

## File Structure After Setup

```
movie-review-soa/
├── user-service/
│   ├── .env              ← Your connection string goes here
│   ├── .env.example      ← Template (don't edit)
│   └── server.js
├── auth-service/
│   ├── .env              ← Your connection string goes here
│   ├── .env.example      ← Template (don't edit)
│   └── server.js
├── review-service/
│   ├── .env              ← Your connection string goes here
│   └── .env.example
├── .gitignore            ← Prevents .env from being committed
├── setup-mongodb.ps1     ← Setup script for PowerShell
├── setup-mongodb.bat     ← Setup script for Command Prompt
└── MONGODB_ATLAS_SETUP.md ← Detailed guide
```

---

## Security Tips

### ✅ DO:
- Store password in password manager
- Use strong passwords (min 12 chars, mix of types)
- Keep `.env` files in `.gitignore`
- Regenerate credentials if compromised

### ❌ DON'T:
- Commit `.env` files to GitHub
- Share connection strings
- Use simple passwords
- Hardcode credentials in code
- Use `0.0.0.0/0` whitelist in production

---

## How Services Connect

```
Frontend (React)
    ↓ (axios requests)
Search Service (Mock data)
    ↓
User Service → MongoDB Atlas (user-service database)
Auth Service → MongoDB Atlas (auth-service database)
Review Service → MongoDB Atlas (review-service database)
Content Service → MongoDB Atlas (content-service database)
```

---

## Testing the Connection

### From PowerShell
```powershell
# Test if service is running and connected to MongoDB
$response = Invoke-WebRequest -Uri "http://localhost:4001" -UseBasicParsing
$response.Content
# Should see: {"service":"user-service","status":"ok"}
```

### From Browser
- Visit: http://localhost:4001
- Should see JSON: `{"service":"user-service","status":"ok"}`

---

## Troubleshooting

### Problem: "Can't connect to MongoDB"

**Check #1: Internet Connection**
```powershell
Test-NetConnection 8.8.8.8 -Port 53
```

**Check #2: IP Whitelist**
- Go to MongoDB Atlas → Network Access
- Ensure your IP is whitelisted or use `0.0.0.0/0`

**Check #3: Credentials**
- Verify username and password in .env file
- Check for typos in connection string

**Check #4: Service Status**
```powershell
# Is the service running?
Get-Process node
```

### Problem: "Connection timeout"
- Wait 5-10 minutes after creating cluster (it takes time to initialize)
- Check firewall settings
- Ensure IP is in whitelist

### Problem: "Authentication failed"
- If password has special characters, URL encode them:
  - `@` → `%40`
  - `!` → `%21`
  - `#` → `%23`
- Example: `password@123` → `password%40123`
- Go to: https://www.urlencoder.org/

---

## Environment Variables Explained

### user-service/.env
```env
MONGO_URI=mongodb+srv://username:password@host/database?options
PORT=4001
```
- `MONGO_URI`: Connection to MongoDB with credentials
- `PORT`: Port service listens on

### auth-service/.env
```env
MONGO_URI=mongodb+srv://username:password@host/database?options
PORT=4000
JWT_SECRET=your-secret-key-for-tokens
```
- `JWT_SECRET`: Secret key for creating/validating JWT tokens

### Other Services
Same as above, different databases and ports

---

## Production Deployment

When deploying to production:

1. **Create separate MongoDB user** (not your admin user)
2. **Restrict IP whitelist** to your server IP only
3. **Use strong passwords** (32+ characters)
4. **Store credentials** in environment variables (not .env)
5. **Use separate clusters** for dev, staging, production
6. **Enable backup** (Atlas does this automatically)
7. **Monitor** Atlas dashboard for activity

---

## Need Help?

### Resources
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Connection String Guide: https://docs.mongodb.com/manual/reference/connection-string/
- Atlas Troubleshooting: https://docs.atlas.mongodb.com/troubleshoot-connection/

### Check Files
- `MONGODB_ATLAS_SETUP.md` - Detailed step-by-step guide
- `.env.example` files - Template environment variables
- `setup-mongodb.ps1` - Automated setup script

---

**You're all set! Run `npm start` in each service to begin.** 🚀

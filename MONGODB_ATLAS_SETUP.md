# MongoDB Atlas Setup Guide - Complete Steps

## What You'll Get
- Free MongoDB cloud database (500MB storage)
- No credit card required for free tier
- Connection string with API key/password
- Global access to your database

## Step-by-Step Setup

### 1. Create MongoDB Atlas Account

1. Go to: https://www.mongodb.com/cloud/atlas
2. Click **"Try Free"**
3. Choose **"Sign up with Email"**
4. Fill in the form:
   - Email: your-email@example.com
   - Password: create a strong password
   - First Name: Your name
   - Last Name: Your name
   - Company: (optional, leave blank)
5. Accept the terms and click **"Create Account"**
6. Verify your email (check inbox for verification link)

### 2. Create Your First Cluster

After verifying email, you'll see the Atlas dashboard:

1. Click **"Create"** (under Deployment section)
2. Choose **"Build a Cluster"**
3. Select **"Free Tier"** (M0)
4. Choose your region (pick closest to you):
   - US: N. Virginia
   - Europe: Ireland
   - Asia: Singapore
5. Keep all other defaults
6. Click **"Create Deployment"**
7. Wait 2-3 minutes for cluster to be created

### 3. Create Database User (Credentials)

While cluster is creating:

1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Username/Password"** authentication
4. Fill in:
   - Username: `moviereview` (or your choice)
   - Password: Create a strong password (save this!)
   - Example: `MySecurePass123!@`
5. Choose **"Built-in Role"**: `Atlas Admin`
6. Click **"Add User"**

**⚠️ IMPORTANT: Save your credentials!**
```
Username: moviereview
Password: MySecurePass123!@
```

### 4. Whitelist IP Address (Network Access)

1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` to allow connections from any IP
   - Fine for development, restrict in production
4. Click **"Confirm"**

### 5. Get Connection String

1. Go to **"Clusters"** (Deployment section)
2. Click **"Connect"** button on your cluster
3. Choose **"Drivers"** option
4. Select **"Node.js"** and version **"4.x"**
5. You'll see a connection string:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 6. Replace Credentials in Connection String

Take your connection string and replace:
- `<username>` with your username (e.g., `moviereview`)
- `<password>` with your password (e.g., `MySecurePass123!@`)

**Example Result:**
```
mongodb+srv://moviereview:MySecurePass123!@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

### 7. Add Database Names

Add database names to the end of your connection string:

**For each service, create a different database:**

**User Service:**
```
mongodb+srv://moviereview:MySecurePass123!@cluster0.abc123.mongodb.net/user-service?retryWrites=true&w=majority
```

**Auth Service:**
```
mongodb+srv://moviereview:MySecurePass123!@cluster0.abc123.mongodb.net/auth-service?retryWrites=true&w=majority
```

**Review Service:**
```
mongodb+srv://moviereview:MySecurePass123!@cluster0.abc123.mongodb.net/review-service?retryWrites=true&w=majority
```

**Content Service:**
```
mongodb+srv://moviereview:MySecurePass123!@cluster0.abc123.mongodb.net/content-service?retryWrites=true&w=majority
```

---

## Set Up Environment Files

### 1. Create `.env` file in User Service

File: `user-service/.env`

```env
MONGO_URI=mongodb+srv://moviereview:MySecurePass123!@cluster0.abc123.mongodb.net/user-service?retryWrites=true&w=majority
PORT=4001
```

### 2. Create `.env` file in Auth Service

File: `auth-service/.env`

```env
MONGO_URI=mongodb+srv://moviereview:MySecurePass123!@cluster0.abc123.mongodb.net/auth-service?retryWrites=true&w=majority
PORT=4000
JWT_SECRET=your-secret-key-12345
```

### 3. Create `.env` file in Review Service

File: `review-service/.env`

```env
MONGO_URI=mongodb+srv://moviereview:MySecurePass123!@cluster0.abc123.mongodb.net/review-service?retryWrites=true&w=majority
PORT=4003
```

### 4. Create `.env` file in Content Service

File: `content-service/.env`

```env
MONGO_URI=mongodb+srv://moviereview:MySecurePass123!@cluster0.abc123.mongodb.net/content-service?retryWrites=true&w=majority
PORT=4004
```

### 5. Create `.env` file in Search Service

File: `search-service/.env`

```env
PORT=4005
# Search service uses mock data, no MongoDB needed
```

---

## Test Your Connection

### 1. Start User Service with MongoDB

```powershell
cd c:\Users\win10-11\movie-review-soa\user-service
npm start
```

**Look for this in terminal:**
```
user-service: MongoDB connected
user-service running on port 4001
```

### 2. If Connection Fails

**Error:** `MongoServerSelectionError`
- Check internet connection
- Verify credentials in `.env` file
- Ensure IP whitelist includes your IP (use 0.0.0.0/0)
- Check password doesn't have special characters that need escaping

**To fix special characters in password:**
- URL encode the password
- Example: `@` → `%40`, `!` → `%21`
- Go to: https://www.urlencoder.org/
- Paste password, copy encoded version

---

## Your MongoDB Atlas Cluster Info

**After setup, you'll have:**

```
Account Email: your-email@example.com
Username: moviereview
Password: MySecurePass123!@
Cluster Name: Cluster0
Region: N. Virginia (or your choice)
Tier: M0 (Free)

Connection String:
mongodb+srv://moviereview:MySecurePass123!@cluster0.xxxxx.mongodb.net/database-name?retryWrites=true&w=majority
```

---

## Architecture with MongoDB Atlas

```
┌─────────────────┐
│   Frontend      │
│  (React 3002)   │
└────────┬────────┘
         │
┌────────▼────────┐
│  API Gateway    │
│   (Port 3000)   │
└────────┬────────┘
         │
    ┌────┴─────────────────────┬──────────────────┐
    │                          │                  │
┌───▼────────┐         ┌──────▼────┐       ┌────▼─────┐
│   User     │         │   Auth     │       │  Review  │
│  Service   │         │  Service   │       │ Service  │
│ (4001)     │         │  (4000)    │       │ (4003)   │
└───┬────────┘         └──────┬─────┘       └────┬─────┘
    │                         │                   │
    └────────────┬────────────┴───────────────────┘
                 │
         ┌───────▼────────┐
         │  MongoDB Atlas │
         │   (Cloud)      │
         │                │
         │ user-service   │
         │ auth-service   │
         │ review-service │
         │content-service │
         └────────────────┘
```

---

## Security Best Practices

### DO:
✅ Save credentials securely (password manager, not in code)
✅ Use `.env` files (added to `.gitignore`)
✅ Use strong passwords (mix uppercase, lowercase, numbers, symbols)
✅ Enable IP whitelist in production
✅ Rotate credentials periodically

### DON'T:
❌ Commit `.env` files to GitHub
❌ Share connection strings
❌ Use `0.0.0.0/0` in production
❌ Use simple passwords
❌ Hardcode credentials in code

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `MongoServerSelectionError` | Check internet, verify credentials |
| `Invalid username/password` | Check `.env` file for typos |
| `getaddrinfo ENOTFOUND` | Network access issue, add IP to whitelist |
| `Connection timeout` | IP whitelist issue, use `0.0.0.0/0` for dev |
| `Authentication failed` | URL encode special characters in password |

---

## Next Steps

1. ✅ Create MongoDB Atlas account
2. ✅ Create cluster
3. ✅ Create database user
4. ✅ Whitelist IP address
5. ✅ Get connection string
6. ✅ Create `.env` files in each service
7. ✅ Start services and test connection
8. ✅ Update frontend to use backend APIs

**Ready to start?** Follow the steps above!

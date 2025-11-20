# MongoDB & Project Architecture Explanation

## How MongoDB Connection Works in This Project

### 1. **Current Setup (Local MongoDB)**
Each microservice in the project is configured to connect to a local MongoDB instance at:
```
mongodb://localhost:27017/{service-name}
```

For example:
- **User Service**: `mongodb://localhost:27017/user-service`
- **Auth Service**: `mongodb://localhost:27017/auth-service`
- **Search Service**: `mongodb://localhost:27017/search-service`
- **Review Service**: `mongodb://localhost:27017/review-service`

### 2. **Environment Variables (.env files)**
Each service can use a `.env` file to override the default MongoDB URI.

Example `.env` file in `user-service/`:
```
MONGO_URI=mongodb://localhost:27017/user-service
PORT=4001
```

The code in `server.js` does this:
```javascript
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/user-service';
```

This means:
- **First priority**: Check for `MONGO_URI` in `.env` file
- **Fallback**: Use the hardcoded local MongoDB default

### 3. **Why You Didn't Add a Key**
You don't need to add MongoDB keys for **local development** because:
- MongoDB runs on your local machine (localhost)
- No authentication required for local connections
- Each service has its own database

### 4. **Production Setup (with MongoDB Atlas)**
When deploying to production, you would:

1. **Create a MongoDB Atlas account** at https://www.mongodb.com/cloud/atlas

2. **Create a cluster** and get a connection string like:
```
mongodb+srv://username:password@cluster.mongodb.net/database-name
```

3. **Add to `.env` file**:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/user-service
```

### 5. **Current Project Structure**

```
movie-review-soa/
├── user-service/          # Port 4001 - Manages users
│   └── MongoDB DB: user-service
├── auth-service/          # Port 4002 - JWT authentication
│   └── MongoDB DB: auth-service
├── search-service/        # Port 4005 - Movie search (NO MongoDB)
├── review-service/        # Port 4003 - Reviews
│   └── MongoDB DB: review-service
├── content-service/       # Port 4004 - Content management
│   └── MongoDB DB: content-service
├── notification-service/  # Port 4006 - Notifications
├── admin-service/         # Port 4007 - Admin
├── api-gateway/           # Port 3000 - Routes to all services
└── frontend/              # Port 3002 - React app (localStorage only)
```

### 6. **To Get MongoDB Running Locally**

**Option A: Using MongoDB Community Edition**
```powershell
# Download and install from: https://www.mongodb.com/try/download/community

# Start MongoDB service (after installation):
mongod

# Or if installed as service:
net start MongoDB
```

**Option B: Using Docker** (Easier!)
```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 7. **Current Demo Mode (No MongoDB Required)**
Since MongoDB isn't running right now, I've updated the authentication to work with **localStorage** only:
- User data is stored in your browser's local storage
- Perfect for development and demos
- Data persists as long as you don't clear browser data
- No backend database needed

### 8. **Service Architecture**

```
Frontend (React)
    ↓
API Gateway (Port 3000)
    ├→ User Service (Port 4001) → MongoDB
    ├→ Auth Service (Port 4002) → MongoDB
    ├→ Search Service (Port 4005) → (Mock data, no DB)
    ├→ Review Service (Port 4003) → MongoDB
    └→ Content Service (Port 4004) → MongoDB
```

## Summary

| Aspect | Current | Production |
|--------|---------|-----------|
| Database | Local MongoDB (localhost) | MongoDB Atlas (Cloud) |
| Auth | localStorage | Backend + JWT |
| User Data | Browser only | MongoDB |
| API Key | None needed | MongoDB username:password |
| Cost | Free | $0-57/month (Atlas) |

## To Enable Full Backend MongoDB Support

1. **Install MongoDB locally** or use Docker
2. **Start all services**:
   ```powershell
   # Terminal 1
   cd user-service; npm start
   
   # Terminal 2
   cd auth-service; npm start
   
   # Terminal 3
   cd search-service; npm start
   
   # Terminal 4
   cd review-service; npm start
   
   # Terminal 5
   cd frontend; npm start
   ```

3. **Create `.env` files** in each service (optional - uses defaults)

4. **Update frontend** to call backend APIs instead of localStorage

For now, the **demo mode with localStorage** works perfectly for testing and development!

# FoodBridge 🌿

## Food Waste & Hunger Management System

A centralized digital platform that connects food surplus generators (restaurants, hotels, event venues, households) with NGOs, volunteers, and communities in need — enabling real-time redistribution of surplus edible food.

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React.js (Vite) |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcrypt |
| Maps | Leaflet.js + OpenStreetMap |
| Styling | Vanilla CSS (Dark Theme) |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally (or MongoDB Atlas connection string)

### Setup

1. **Clone & Install**
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

2. **Configure Environment**
Edit `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/food_management
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

3. **Start the Application**
```bash
# Terminal 1: Start backend
cd server
node server.js

# Terminal 2: Start frontend
cd client
npm run dev
```

4. **Open** http://localhost:5173

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **Donor** | Post surplus food, track donations |
| **NGO** | Browse & claim food, submit requests |
| **Volunteer** | Handle pickups & deliveries |
| **Admin** | Platform management, analytics |

## 📦 API Endpoints

- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/donations` - List donations
- `POST /api/donations` - Create donation
- `PUT /api/donations/:id/claim` - Claim donation
- `GET /api/analytics` - Platform analytics
- `GET /api/notifications` - User notifications

## 📄 License

This project is built for academic purposes — Major Project 2026.

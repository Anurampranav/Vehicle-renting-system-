# 🚗 Signature Drive Rentals — Full Stack

Node.js + Express + MongoDB Atlas backend with HTML/Tailwind/JS frontend.

---

## 📁 Project Structure

```
signature-drive/
├── backend/
│   ├── config/
│   │   ├── db.js           # MongoDB connection
│   │   └── seed.js         # Database seed script
│   ├── middleware/
│   │   ├── auth.js         # JWT protect + restrictTo
│   │   └── errorHandler.js # Central error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   ├── Booking.js
│   │   ├── Payment.js
│   │   ├── Maintenance.js
│   │   ├── Review.js
│   │   ├── Offer.js
│   │   └── Ticket.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── vehicles.js
│   │   ├── bookings.js
│   │   ├── payments.js
│   │   ├── reviews.js
│   │   ├── maintenance.js
│   │   ├── tickets.js
│   │   ├── offers.js
│   │   └── admin.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   └── public/
│       ├── index.html      # Full UI (served by Express in production)
│       └── app.js          # All API calls, no localStorage
├── package.json
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd signature-drive
cd backend && npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — paste your MongoDB Atlas URI
```

**.env**
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/signature_drive?retryWrites=true&w=majority
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Seed the database

```bash
npm run seed
# Creates: admin@sdr.in / admin123
#          priya@gmail.com / priya123
#          6 vehicles, 1 booking, 3 offers
```

### 4. Start the backend

```bash
npm run dev        # development (nodemon)
npm start          # production
```

Server runs at → **http://localhost:5000**

### 5. Open the frontend

Open `frontend/public/index.html` in your browser, **or** serve it with any static server:

```bash
npx serve frontend/public -p 3000
```

---

## 🔌 REST API Reference

All API responses follow:
```json
{ "success": true, "data": ... }
{ "success": false, "message": "..." }
```

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register customer |
| POST | `/api/auth/login` | — | Login (returns JWT) |
| GET  | `/api/auth/me` | 🔒 | Get current user |
| PATCH| `/api/auth/me` | 🔒 | Update profile |

### Vehicles
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET    | `/api/vehicles` | — | List all (filter: category, location, maxPrice, available) |
| GET    | `/api/vehicles/:id` | — | Get single vehicle + reviews |
| POST   | `/api/vehicles` | 🔒 Admin | Add vehicle |
| PUT    | `/api/vehicles/:id` | 🔒 Admin | Update vehicle |
| PATCH  | `/api/vehicles/:id/availability` | 🔒 Admin | Toggle availability |
| DELETE | `/api/vehicles/:id` | 🔒 Admin | Delete vehicle |

### Bookings
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST   | `/api/bookings` | 🔒 | Create booking + payment record |
| GET    | `/api/bookings/my` | 🔒 | My bookings |
| GET    | `/api/bookings` | 🔒 Admin | All bookings (filter: status) |
| GET    | `/api/bookings/:id` | 🔒 | Single booking |
| PATCH  | `/api/bookings/:id/cancel` | 🔒 | Cancel booking |
| PATCH  | `/api/bookings/:id/status` | 🔒 Admin | Update status |

### Payments
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET    | `/api/payments` | 🔒 Admin | All payments |
| GET    | `/api/payments/my` | 🔒 | My payments |
| POST   | `/api/payments/:id/refund` | 🔒 Admin | Issue refund |

### Reviews
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST   | `/api/reviews` | 🔒 | Submit review (completed bookings only) |
| GET    | `/api/reviews` | 🔒 Admin | All reviews |
| GET    | `/api/reviews/vehicle/:vehicleId` | — | Reviews for a vehicle |

### Support Tickets
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST   | `/api/tickets` | Optional | Submit ticket |
| GET    | `/api/tickets/my` | 🔒 | My tickets |
| GET    | `/api/tickets` | 🔒 Admin | All tickets (filter: status, priority) |
| PATCH  | `/api/tickets/:id/reply` | 🔒 Admin | Reply + update status |
| PATCH  | `/api/tickets/:id/status` | 🔒 Admin | Quick status update |

### Offers
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET    | `/api/offers` | — | Active offers |
| POST   | `/api/offers` | 🔒 Admin | Create offer |
| PUT    | `/api/offers/:id` | 🔒 Admin | Update offer |
| DELETE | `/api/offers/:id` | 🔒 Admin | Delete offer |

### Maintenance
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET    | `/api/maintenance` | 🔒 Admin | All records |
| POST   | `/api/maintenance` | 🔒 Admin | Log maintenance |
| PUT    | `/api/maintenance/:id` | 🔒 Admin | Update record |
| DELETE | `/api/maintenance/:id` | 🔒 Admin | Delete record |

### Admin Dashboard
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET    | `/api/admin/stats` | 🔒 Admin | KPIs, recent bookings, earnings |
| GET    | `/api/admin/customers` | 🔒 Admin | Customers + spend |

---

## 🚀 Production Deployment

### Backend → Railway / Render

1. Push to GitHub
2. Connect to [Railway](https://railway.app) or [Render](https://render.com)
3. Set environment variables in dashboard
4. Start command: `node server.js`

### Frontend → Vercel / Netlify

Option A — serve from Express (already configured):
```
NODE_ENV=production
# Express serves frontend/public/index.html for all routes
```

Option B — deploy `frontend/public/` to Vercel/Netlify as a static site, set `API` const in `app.js` to your deployed backend URL.

---

## 🔐 Default Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin / Owner | admin@sdr.in | admin123 |
| Customer | priya@gmail.com | priya123 |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, Tailwind CSS, Vanilla JS |
| Backend | Node.js 18+, Express 4 |
| Database | MongoDB Atlas (Mongoose 8) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Security | Helmet, CORS, express-rate-limit |
| Validation | express-validator |

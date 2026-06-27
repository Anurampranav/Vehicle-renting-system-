# 🚗 Signature Drive – Vehicle Rental Management System

A modern **Full-Stack Vehicle Rental Management System** developed as a **Software Design with UML** project. The system enables customers to browse, book, and pay for rental vehicles online, while administrators can efficiently manage vehicles, bookings, payments, maintenance, offers, reviews, and customer support.

---

## ✨ Features

### 👤 Customer
- User Registration & Login (JWT Authentication)
- Browse & Search Vehicles
- Vehicle Booking System
- Razorpay Payment Integration
- Booking History
- Reviews & Ratings
- Profile Management
- Raise Support Tickets

### 👨‍💼 Admin
- Secure Admin Dashboard
- Manage Users
- Manage Vehicles
- Manage Bookings
- Manage Payments
- Manage Offers
- Manage Maintenance
- Resolve Support Tickets
- Dashboard Analytics

---

## 🛠 Tech Stack

### Frontend
- HTML5
- Tailwind CSS
- JavaScript (ES6)

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- Mongoose

### Authentication & Security
- JWT Authentication
- bcrypt
- Helmet
- CORS
- Express Rate Limit

### Payment Gateway
- Razorpay

---

## 📂 Project Structure

```
Vehicle-renting-system/
│
├── frontend/
│   └── public/
│       ├── index.html
│       ├── app.js
│       └── assets/
│
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── node_modules/
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## 🗄 Database Collections

- Users
- Vehicles
- Bookings
- Payments
- Reviews
- Offers
- Maintenance
- Tickets

---

## 🔐 Security Features

- Password Hashing using bcrypt
- JWT Authentication
- Environment Variables
- Secure REST APIs
- HTTP Security Headers (Helmet)
- API Rate Limiting
- CORS Protection

---

## 📌 UML Diagrams Included

- Use Case Diagram
- Class Diagram
- Sequence Diagram
- Communication Diagram
- Activity Diagram
- State Machine Diagram
- Component Diagram
- Deployment Diagram
- Subsystem Architecture

---

## 💡 OOP Concepts Used

- Encapsulation
- Abstraction
- Inheritance (Role-Based)
- Association
- Composition
- Modular Architecture

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/Anurampranav/Vehicle-renting-system-.git
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
PORT=5000
```

Start the backend:

```bash
npm start
```

---

### Frontend

Open `frontend/public/index.html`

or serve it using Live Server.

---

## 📷 Screenshots

> Add screenshots of:

- Home Page
- Login
- Vehicle Listing
- Booking Page
- Razorpay Payment
- Customer Dashboard
- Admin Dashboard

---

## 🔮 Future Enhancements

- Live Vehicle Tracking
- AI Vehicle Recommendation
- Email & SMS Notifications
- PDF Invoice Generation
- Multi-Branch Management
- Mobile Application

---

## 👨‍💻 Developer

**Anuram Pranav**

GitHub: https://github.com/Anurampranav

---

## ⭐ If you like this project

Give this repository a ⭐ on GitHub!

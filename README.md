# 🚨 AidConnect — Smart Emergency & Public Resource Coordination Platform

> **"Connecting help seekers with verified responders — in real time, when it matters most."**

AidConnect is a full-stack MERN web application built to solve a critical real-world problem: the absence of a structured, intelligent coordination system during emergencies in countries like Pakistan. Whether it's a blood emergency, a road accident, a flood, or any urgent crisis — AidConnect connects the person in need with the nearest verified volunteer or service provider, fast.

---

## 📌 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Tech Stack](#-tech-stack)
- [Core Features](#-core-features)
- [System Architecture](#-system-architecture)
- [Database Design](#-database-design)
- [API Overview](#-api-overview)
- [Frontend Structure](#-frontend-structure)
- [All Pages](#-all-pages-24-total)
- [Team & Role Assignment](#-team--role-assignment)
- [Git Workflow](#-git-workflow)
- [Project Setup](#-project-setup)
- [Deployment](#-deployment)
- [Future Enhancements](#-future-enhancements)

---

## 🔴 Problem Statement

In Pakistan and many developing countries, emergency response suffers from:

- No centralized system to find blood donors by group and location
- Ambulances are hard to reach without direct contacts
- No structured volunteer coordination during disasters like floods
- During crises, people rely on WhatsApp groups and word of mouth
- No way to know **"who can help me right now and how fast?"**

---

## ✅ Solution

AidConnect is an **intelligent multi-role coordination platform** that:

- Lets users post emergency help requests with type, urgency, and location
- Automatically calculates an urgency score and finds the best nearby matches
- Notifies verified volunteers and service providers instantly
- Tracks every request through a full lifecycle (Posted → Accepted → In Progress → Completed)
- Gives admins a powerful analytics dashboard powered by MongoDB aggregation pipelines
- Builds volunteer trust scores based on response rate, completion rate, and ratings

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Styling | Bootstrap 5 + React Bootstrap |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT (JSON Web Tokens), bcrypt |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Forms | React Hook Form |
| Notifications | React Toastify |
| Deployment (Frontend) | Vercel |
| Deployment (Backend) | Render |
| Architecture | MVC Pattern |

---

## 🧩 Core Features

### 🔐 Authentication & Role System
- Register and login with JWT-based authentication
- Four distinct roles: **User**, **Volunteer**, **Service Provider**, **Admin**
- Role-based route protection on both frontend and backend
- Admin can verify or suspend any account

### 🆘 Help Request System
- Users post emergency requests with type, urgency level, location, and description
- Emergency types: Medical, Blood, Accident, Disaster, Other
- Urgency levels: Low, Medium, High, Critical
- System calculates an urgency score (1–100) for prioritization
- Optional proof image upload
- Full request detail view for tracking

### 🎯 Smart Matching Engine
- On request creation, system queries nearby volunteers and providers using MongoDB geo indexing
- Filters by: location radius, availability status, blood group compatibility
- Scores each match based on distance, reliability, and availability
- Sends notifications to matched responders
- Volunteer or provider can accept or decline

### 📊 Volunteer Trust Score
- Each volunteer has a calculated reliability score (0–100)
- Based on: total requests assigned, completion rate, cancellation rate, average rating
- Score displayed on profile and used in matching priority

### 🔄 Request Lifecycle (State Machine)
```
Posted → Accepted → In Progress → Completed
                                → Cancelled
```

### 🛡️ Admin Dashboard
- View and manage all users, volunteers, and providers
- Verify organizations and volunteers
- Suspend accounts
- Full analytics powered by MongoDB aggregation:
  - Most common emergency types
  - Average response and resolution times
  - Most active volunteers
  - Request volume by area and date

---

## 🏗 System Architecture

```
aidconnect/
│
├── aidconnect-backend/              # Node.js + Express API
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── env.js                   # Environment variable validation
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── volunteer.controller.js
│   │   ├── provider.controller.js
│   │   ├── request.controller.js
│   │   ├── match.controller.js
│   │   ├── notification.controller.js
│   │   └── admin.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js        # JWT verification
│   │   ├── role.middleware.js        # Role-based access control
│   │   └── error.middleware.js       # Global error handler
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Volunteer.model.js
│   │   ├── Provider.model.js
│   │   ├── HelpRequest.model.js
│   │   ├── Match.model.js
│   │   ├── Notification.model.js
│   │   └── Rating.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── volunteer.routes.js
│   │   ├── provider.routes.js
│   │   ├── request.routes.js
│   │   ├── match.routes.js
│   │   ├── notification.routes.js
│   │   └── admin.routes.js
│   ├── services/
│   │   ├── matching.service.js       # Core matching engine logic
│   │   ├── scoring.service.js        # Volunteer trust score calculator
│   │   └── notification.service.js   # Notification creation logic
│   ├── utils/
│   │   ├── apiResponse.js            # Standardized API responses
│   │   ├── asyncHandler.js           # Async error wrapper
│   │   └── geoHelper.js              # Location & radius utilities
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js                     # Entry point
│
└── aidconnect-frontend/              # React + Vite
    └── src/
        ├── api/
        │   ├── auth.api.js
        │   ├── request.api.js
        │   ├── volunteer.api.js
        │   ├── provider.api.js
        │   ├── notification.api.js
        │   └── admin.api.js
        ├── assets/
        ├── components/
        │   ├── common/
        │   │   ├── Navbar.jsx
        │   │   ├── Footer.jsx
        │   │   ├── Loader.jsx
        │   │   ├── Modal.jsx
        │   │   ├── Badge.jsx
        │   │   └── ProtectedRoute.jsx
        │   ├── cards/
        │   │   ├── RequestCard.jsx
        │   │   ├── VolunteerCard.jsx
        │   │   └── ProviderCard.jsx
        │   ├── forms/
        │   │   ├── HelpRequestForm.jsx
        │   │   ├── LoginForm.jsx
        │   │   ├── RegisterForm.jsx
        │   │   └── ProfileForm.jsx
        │   └── dashboard/
        │       ├── StatsCard.jsx
        │       ├── RequestTable.jsx
        │       └── NotificationPanel.jsx
        ├── context/
        │   ├── AuthContext.jsx
        │   └── NotificationContext.jsx
        ├── hooks/
        │   ├── useAuth.js
        │   ├── useRequests.js
        │   └── useNotifications.js
        ├── pages/
        │   ├── auth/
        │   │   ├── Login.jsx
        │   │   └── Register.jsx
        │   ├── user/
        │   │   ├── UserDashboard.jsx
        │   │   ├── CreateRequest.jsx
        │   │   ├── MyRequests.jsx
        │   │   ├── RequestDetail.jsx
        │   │   └── UserProfile.jsx
        │   ├── volunteer/
        │   │   ├── VolunteerDashboard.jsx
        │   │   ├── ActiveRequest.jsx
        │   │   ├── MyHistory.jsx
        │   │   └── VolunteerProfile.jsx
        │   ├── provider/
        │   │   ├── ProviderDashboard.jsx
        │   │   ├── ManageAvailability.jsx
        │   │   └── ProviderProfile.jsx
        │   ├── admin/
        │   │   ├── AdminDashboard.jsx
        │   │   ├── ManageUsers.jsx
        │   │   ├── ManageRequests.jsx
        │   │   ├── ManageVolunteers.jsx
        │   │   ├── ManageProviders.jsx
        │   │   └── Analytics.jsx
        │   └── public/
        │       ├── Landing.jsx
        │       ├── AboutUs.jsx
        │       ├── HowItWorks.jsx
        │       └── NotFound.jsx
        ├── routes/
        │   └── AppRoutes.jsx
        ├── utils/
        │   ├── constants.js
        │   ├── formatters.js
        │   └── validators.js
        ├── App.jsx
        ├── main.jsx
        └── index.css
```

---

## 🗄 Database Design

MongoDB Atlas with 7 collections:

| Collection | Purpose |
|---|---|
| `Users` | Base account for all roles. Stores GeoJSON location. |
| `Volunteers` | Extended profile: blood group, skills, trust score, availability |
| `Providers` | Organization info: type, license, operating hours, location |
| `HelpRequests` | Core of the system: emergency type, urgency, status lifecycle |
| `Matches` | Records every match notification — who was notified, who responded |
| `Notifications` | In-app alerts for all users |
| `Ratings` | Post-completion ratings from users to volunteers/providers |

### Schema Highlights

**Users**
```js
{
  name, email, password, phone, role,
  location: { type: "Point", coordinates: [lng, lat] },
  isVerified, isActive, profileImage,
  createdAt, updatedAt
}
```

**HelpRequests**
```js
{
  requesterId, emergencyType, urgencyLevel, urgencyScore,
  description, proofImage, bloodGroupNeeded,
  location: { type: "Point", coordinates: [lng, lat] },
  status,         // posted → accepted → in_progress → completed/cancelled
  assignedTo, assignedType,
  postedAt, acceptedAt, completedAt,
  responseTime, resolutionTime
}
```

**Volunteers**
```js
{
  userId, bloodGroup, skills, isAvailable, serviceRadius,
  totalRequests, completedRequests, cancelledRequests,
  averageRating, reliabilityScore, currentRequest
}
```

### Advanced Database Concepts Demonstrated

| Concept | Where Used |
|---|---|
| GeoJSON + 2dsphere index | Users, Providers, HelpRequests |
| Aggregation pipelines | All analytics endpoints |
| Compound indexing | status + urgencyScore, type + location |
| Weighted scoring algorithm | reliabilityScore in Volunteers |
| State machine in DB | status field in HelpRequests |
| Population & referencing | Across all 7 collections |
| Pagination & filtering | All admin list endpoints |

---

## 🛣 API Overview

**49 endpoints across 7 modules:**

| Module | Base Route | Endpoints |
|---|---|---|
| Auth | `/api/auth` | 4 |
| Users | `/api/users` | 6 |
| Help Requests | `/api/requests` | 10 |
| Volunteers | `/api/volunteers` | 9 |
| Providers | `/api/providers` | 8 |
| Matches | `/api/matches` | 3 |
| Admin | `/api/admin` | 9 |
| **Total** | | **49** |

All responses follow a standardized format:
```json
{
  "success": true,
  "message": "Request created successfully",
  "data": {}
}
```

---

## 🖥 Frontend Structure

Built with **React (Vite)** and styled using **Bootstrap 5 + React Bootstrap** for full responsiveness. Layout is div-based and follows Responsive Web Design principles as required by course specifications.

### React Concepts Used

| Concept | Usage |
|---|---|
| Components | Every UI element is a reusable component |
| State (useState) | Form inputs, toggles, loading states |
| Effects (useEffect) | Data fetching on page load |
| Context | AuthContext (global session), NotificationContext |
| Props | Cards, forms, dashboard components |
| Custom Hooks | useAuth, useRequests, useNotifications |
| React Router | Role-based routing via AppRoutes.jsx |
| Protected Routes | ProtectedRoute.jsx wraps all role-specific pages |

---

## 📄 All Pages (24 Total)

| # | Page | Role | Description |
|---|---|---|---|
| 1 | Landing | Public | Platform homepage |
| 2 | AboutUs | Public | Mission and team info |
| 3 | HowItWorks | Public | Step-by-step platform guide |
| 4 | NotFound | Public | 404 error page |
| 5 | Login | Auth | User login |
| 6 | Register | Auth | New user registration with role selection |
| 7 | UserDashboard | User | Overview of active request and quick actions |
| 8 | CreateRequest | User | Post a new emergency help request |
| 9 | MyRequests | User | History of all submitted requests |
| 10 | RequestDetail | User | Full detail view of a single request |
| 11 | UserProfile | User | Edit personal information |
| 12 | VolunteerDashboard | Volunteer | Feed of nearby open requests |
| 13 | ActiveRequest | Volunteer | Currently accepted request — update status |
| 14 | MyHistory | Volunteer | Past completed and cancelled responses |
| 15 | VolunteerProfile | Volunteer | Profile with trust score and ratings |
| 16 | ProviderDashboard | Provider | Incoming relevant requests |
| 17 | ManageAvailability | Provider | Toggle availability and operating hours |
| 18 | ProviderProfile | Provider | Organization info and service details |
| 19 | AdminDashboard | Admin | System-wide statistics overview |
| 20 | ManageUsers | Admin | View, verify, and suspend users |
| 21 | ManageRequests | Admin | All requests with filters and status |
| 22 | ManageVolunteers | Admin | Volunteer list with trust scores |
| 23 | ManageProviders | Admin | Verify and manage service providers |
| 24 | Analytics | Admin | Charts and aggregation-powered insights |

---

## 👥 Team & Role Assignment

Each member owns a **complete vertical slice** — model, controller, routes, and frontend pages. There are zero shared files between members except those owned exclusively by the Lead. All cross-module communication happens through API calls only.

---

### 👑 Haseeb — Team Lead + Core Matching Engine

**Owns:** The heart of AidConnect — help request system, matching engine, core setup, and deployment.

**Backend:**
```
config/db.js
config/env.js
server.js
models/HelpRequest.model.js
models/Match.model.js
controllers/request.controller.js
controllers/match.controller.js
routes/request.routes.js
routes/match.routes.js
services/matching.service.js
services/notification.service.js
utils/geoHelper.js
utils/asyncHandler.js
utils/apiResponse.js
```

**Frontend:**
```
pages/user/UserDashboard.jsx
pages/user/CreateRequest.jsx
pages/user/MyRequests.jsx
pages/user/RequestDetail.jsx
components/cards/RequestCard.jsx
components/forms/HelpRequestForm.jsx
context/AuthContext.jsx
routes/AppRoutes.jsx
```

**Additional Responsibilities:**
- Initialize both repos and create full folder structure for the team
- Set up MongoDB Atlas cluster and share connection string
- Final integration of all branches
- Deployment on Vercel + Render
- Maintain README and documentation

---

### 💻 Salman — Auth + Volunteer System

**Owns:** Authentication foundation, middleware layer, and complete volunteer module.

**Backend:**
```
models/User.model.js
models/Volunteer.model.js
controllers/auth.controller.js
controllers/volunteer.controller.js
routes/auth.routes.js
routes/volunteer.routes.js
middleware/auth.middleware.js
middleware/role.middleware.js
middleware/error.middleware.js
services/scoring.service.js
utils/validators.js
```

**Frontend:**
```
pages/auth/Login.jsx
pages/auth/Register.jsx
pages/volunteer/VolunteerDashboard.jsx
pages/volunteer/ActiveRequest.jsx
pages/volunteer/MyHistory.jsx
pages/volunteer/VolunteerProfile.jsx
components/common/ProtectedRoute.jsx
components/common/Navbar.jsx
components/common/Loader.jsx
hooks/useAuth.js
```

**Note:** Salman's auth middleware is a dependency for all protected routes across the entire application. His branch must be merged to `dev` first before anyone else merges.

---

### 🎨 Samrah — Service Provider + Notifications + Public UI

**Owns:** Service provider module, notification system, all public-facing pages, and shared UI components.

**Backend:**
```
models/Provider.model.js
models/Notification.model.js
controllers/provider.controller.js
controllers/notification.controller.js
routes/provider.routes.js
routes/notification.routes.js
```

**Frontend:**
```
pages/provider/ProviderDashboard.jsx
pages/provider/ManageAvailability.jsx
pages/provider/ProviderProfile.jsx
pages/public/Landing.jsx
pages/public/AboutUs.jsx
pages/public/HowItWorks.jsx
pages/public/NotFound.jsx
components/common/Footer.jsx
components/common/Modal.jsx
components/common/Badge.jsx
components/cards/ProviderCard.jsx
components/cards/VolunteerCard.jsx
components/forms/ProfileForm.jsx
context/NotificationContext.jsx
hooks/useNotifications.js
```

---

### 📊 Rabia — Admin Panel + Analytics + Ratings

**Owns:** Complete admin system, analytics dashboard powered by MongoDB aggregation, and rating module.

**Backend:**
```
models/Rating.model.js
controllers/admin.controller.js
controllers/user.controller.js
routes/admin.routes.js
routes/user.routes.js
```

**Frontend:**
```
pages/admin/AdminDashboard.jsx
pages/admin/ManageUsers.jsx
pages/admin/ManageRequests.jsx
pages/admin/ManageVolunteers.jsx
pages/admin/ManageProviders.jsx
pages/admin/Analytics.jsx
pages/user/UserProfile.jsx
components/dashboard/StatsCard.jsx
components/dashboard/RequestTable.jsx
components/dashboard/NotificationPanel.jsx
components/forms/LoginForm.jsx
components/forms/RegisterForm.jsx
utils/constants.js
utils/formatters.js
hooks/useRequests.js
```

---

## 🌿 Git Workflow

### Branch Structure

```
main                  ← protected, production-ready only
dev                   ← integration branch

salman-auth           ← Salman's working branch
haseeb-core           ← Haseeb's working branch
samrah-provider       ← Samrah's working branch
rabia-admin           ← Rabia's working branch
```

### Merge Order (Strict)

```
1. salman-auth     → dev    (auth + middleware, everyone depends on it)
2. haseeb-core     → dev    (request system, needed by other modules)
3. samrah-provider → dev
4. rabia-admin     → dev
5. dev             → main   (final, after full testing)
```

### Team Rules

1. You only commit and push to **your own branch**
2. Never edit a file that belongs to another member
3. All cross-module communication happens through **API calls only**
4. Only Haseeb pushes to `main` and touches `server.js`, `db.js`, `AppRoutes.jsx`
5. Always pull from `dev` before starting your day

---

## ⚙️ Project Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier)
- Git

### Backend Setup

```bash
# Clone the repo
git clone https://github.com/your-org/aidconnect.git
cd aidconnect/aidconnect-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Fill in your values

# Start development server
npm run dev
```

### Backend `.env`

```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Frontend Setup

```bash
cd aidconnect/aidconnect-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Frontend `.env`

```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Install All Dependencies

**Backend:**
```bash
npm install express mongoose dotenv bcryptjs jsonwebtoken cors
npm install --save-dev nodemon
```

**Frontend:**
```bash
npm install react-router-dom axios react-hook-form recharts react-toastify bootstrap react-bootstrap lucide-react
```

---

## 🚀 Deployment

| Service | Platform | Purpose |
|---|---|---|
| Frontend | Vercel | Auto-deploy from `main` branch |
| Backend | Render | Web service connected to GitHub |
| Database | MongoDB Atlas | Free M0 cluster |

### Deployment Checklist
- [ ] Update `VITE_API_BASE_URL` to deployed backend URL on Vercel
- [ ] Configure CORS on backend to allow requests from Vercel domain
- [ ] Set all environment variables on Render dashboard
- [ ] Verify MongoDB Atlas network access allows Render (set `0.0.0.0/0` for free tier)
- [ ] Test all API endpoints on live URL before submission
- [ ] Add live frontend URL and backend API URL to project report

---

## 📝 Project Report Outline

As required by CS 343 Web Technologies course specification:

1. **Introduction & Motivation** — Why AidConnect, what problem it solves in Pakistan
2. **GitHub Repository Link**
3. **Description of Website** — All 24 pages, modules, and user flows
4. **Layout Description** — Bootstrap 5 responsiveness, div-based structure, breakpoints
5. **Screenshots** — Every page with brief description
6. **Functional Requirements** — All 49 API endpoints, all 4 roles, all features
7. **Non-Functional Requirements** — Performance, security, scalability, responsiveness
8. **Conclusion**

---

## 🔮 Future Enhancements

- **Real-time notifications** using Socket.io
- **Disaster Mode** — admin broadcasts mass alert to all volunteers in an area
- **Heatmap** of high-risk zones using request clustering
- **Volunteer reputation leaderboard**
- **SMS notifications** via Twilio
- **Mobile app** using React Native
- **Map integration** for live tracking of responders

---

## 📁 Repository Structure

```
aidconnect/
├── aidconnect-backend/
└── aidconnect-frontend/
```

---

## 👨‍💻 Team

| Name | Role | Domain |
|---|---|---|
| **Haseeb** (Lead) | Full Stack | Core Engine, Matching System, Deployment |
| **Salman** | Full Stack | Authentication, Volunteer Module |
| **Samrah** | Full Stack | Provider Module, Notifications, Public UI |
| **Rabia** | Full Stack | Admin Panel, Analytics, Ratings |

---

*NUST SEECS — Department of Computing*
*CS 343: Web Technologies | BSCS-14A | Spring 2026*
*Instructor: Dr. Qaiser Riaz*
*Semester 4 Group Project — AidConnect*
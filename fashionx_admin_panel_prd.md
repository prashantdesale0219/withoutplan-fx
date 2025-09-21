# FashionX Admin Panel PRD (MERN + Next.js)

**Project:** FashionX Admin Panel  
**Stack:**  
- **Frontend:** Next.js (App Router, JSX, JS)  
- **Backend:** Node.js + Express  
- **Database:** MongoDB + Mongoose  
- **Authentication:** JWT (existing) + Role-Based Access Control (RBAC)  
- **Notes:** No Redis / Cloud Storage

---

## 1. Goal & Purpose

**Goal:**  
Provide administrators full visibility and control over user activity, subscription plans, credit usage, media generation, and profile data, including filtering and analytics.

**Purpose:**  
- Track all users and their subscriptions.  
- Monitor credit usage and media generation (images, text-to-image, text-to-video, scene generation).  
- Provide filtering and searching by plan, credit usage, media activity, and Terms & Conditions acceptance.  
- View complete user profiles from the dashboard.  
- Ensure role-based access for administrative operations.

---

## 2. Roles

**Admin:**  
- Login using existing JWT authentication.  
- Role: `admin`.  
- Permissions controlled via role.  
- Actions permitted for admin:  
  - Access dashboard.  
  - View user list and profiles.  
  - Reset user credits.  
  - Access media activity.  
  - Access analytics.  

*Note:* No super-admin role; only one role (`admin`) exists.

---

## 3. Features / Modules

### 3.1 Role-Based Access (RBAC)
- Each JWT token includes a `role` field.  
- Middleware checks role for protected routes.  

**Example Middleware (Node.js / Express):**
```javascript
function checkRole(role) {
  return (req, res, next) => {
    const userRole = req.user.role; // decoded from JWT
    if (userRole !== role) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}

// Usage in routes
router.get("/api/admin/users", authenticateJWT, checkRole("admin"), getAllUsers);
```

### 3.2 Admin Dashboard Overview
**KPIs / Metrics:**  
- Total users registered  
- Users per plan (Free, Basic, Pro, Enterprise)  
- Total credits used (overall and per plan)  
- Total media generated: images, videos, scenes  
- Users who accepted Terms & Conditions vs. those who did not  

**Recent Activity:**  
Table displaying latest user media generation with prompt, type, and plan.

### 3.3 User Management
**Users List Page:**  
- Columns: Name, Email, Plan, Credits Remaining / Used, Media Generated (Images / Videos / Scenes), T&C accepted, Signup Date, Last Login  
- Filters: Plan, credits remaining, media type generated, T&C acceptance  
- Search: Name, Email, Prompt (optional)  
- Actions: View profile, reset credits, deactivate user  

**User Profile Page:**  
- Full user information: name, email, plan, credits, T&C status, last login  
- Media history: images, videos, scene generations with timestamps & prompts  
- Plan details: start & expiry date, credit allocation  
- Option to download user media/report in CSV format

### 3.4 Media Tracking
- Track per user: images, videos, scene generations  
- Filters & search: media type, user, date

### 3.5 Analytics / Dashboard Charts
- Total users per plan (pie chart)  
- Credits usage per plan (bar chart)  
- Media generation trends (line chart over time)  
- Users T&C acceptance ratio  

---

## 4. Backend Structure (MERN)

### MongoDB Collections

**Users (existing)**
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "password": "hashed",
  "plan": "Free|Basic|Pro|Enterprise",
  "credits": {
    "total": "Number",
    "used": "Number"
  },
  "mediaGenerated": [
    {
      "type": "image|video|scene",
      "prompt": "string",
      "url": "string",
      "createdAt": "Date"
    }
  ],
  "termsAccepted": "Boolean",
  "lastLogin": "Date",
  "createdAt": "Date"
}
```

**Admins**
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "password": "hashed",
  "role": "admin",
  "createdAt": "Date"
}
```

### Backend API Endpoints

| Module    | Endpoint                     | Method | Description |
|-----------|------------------------------|--------|-------------|
| Auth      | /api/admin/login             | POST   | Admin login (JWT) |
| Users     | /api/admin/users             | GET    | Get all users (protected with role `admin`) |
| Users     | /api/admin/users/:id         | GET    | Get full user profile & media history |
| Users     | /api/admin/users/:id/credits | PATCH  | Reset or update user credits |
| Media     | /api/admin/users/:id/media   | GET    | Get user media with filtering |
| Analytics | /api/admin/analytics         | GET    | KPIs for dashboard |

**Query Example:**
```
GET /api/admin/users?plan=Pro&media=image&tcAccepted=true&search=deepnex
```

*All routes are protected using `authenticateJWT` + `checkRole("admin")` middleware.*

---

## 5. Frontend Structure (Next.js / JSX / JS)

**Pages / Components (App Router)**  
- `/admin/login` → Login Page (existing JWT auth)  
- `/admin/dashboard` → KPIs + Charts + Recent Activity Table  
- `/admin/users` → User List Table (filters, search, actions)  
- `/admin/users/[id]` → User Profile + Media History  
- `/admin/analytics` → Media & Credits Graphs  

**Components:**  
- `/components/Sidebar.jsx` → Navigation  
- `/components/Header.jsx` → Notifications, admin info  
- `/components/KPI.jsx` → Dashboard metrics  
- `/components/MediaTable.jsx` → Table with media data, filters  

**Libraries / Tools Suggested:**  
- Charts: Chart.js / Recharts  
- Table: React Table / Material UI Table  
- UI: Tailwind CSS / Ant Design  
- Forms: React Hook Form

---

## 6. Security & Access

- Role-based access for all protected admin routes  
- JWT authentication (existing)  
- Admin only (role = `admin`)  
- Input validation for filters & search  
- Passwords hashed via bcrypt

---

## 7. Optional Enhancements

- Download CSV / PDF reports of users or media  
- Pagination for users & media tables  
- Alerts for high credit usage or suspicious activity  
- Date filters for media generation trends

---

✅ **Professional PRD ready-to-implement with JWT + Role-Based Access Control (Admin only)**


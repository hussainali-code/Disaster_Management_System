# Complete Role-Based Functionality & Full-Stack Integration

## Background

The Smart Disaster Response MIS has **5 roles** defined in the database:
1. **Administrator** — Full system access, user management, audit trail, approvals
2. **Emergency_Operator** — Incident management, team deployment, hospital management, approvals
3. **Field_Officer** — View incidents, update team assignments, view hospitals
4. **Warehouse_Manager** — Resource/inventory management, dispatch, approvals
5. **Finance_Officer** — Financial transaction recording, financial summaries, approvals

## Current State Analysis

After thorough review, here is what **each role currently CAN do** and what is **MISSING**:

---

### 1. Administrator ✅ Mostly Complete — Missing: User Management, Disaster Event CRUD on frontend, Audit Trail UI

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| View Dashboard (all stats) | ✅ | ✅ | Complete |
| Manage Incidents (CRUD + assign + status) | ✅ | ✅ | Complete |
| Manage Teams (create + assign + complete) | ✅ | ✅ | Complete |
| Manage Resources (add + request + dispatch) | ✅ | ✅ | Complete |
| Manage Hospitals (view + admit + discharge) | ✅ | ✅ | Complete |
| Manage Finance (record + view summary) | ✅ | ✅ | Complete |
| Manage Approvals (review + approve/reject + history) | ✅ | ✅ | Complete |
| **Manage Users (CRUD, activate/deactivate)** | ❌ | ❌ | **MISSING** |
| **Manage Disaster Events (create + update status)** | ✅ Backend | ❌ Frontend | **MISSING UI** |
| **View Audit Trail** | ✅ Backend | ❌ Frontend | **MISSING UI** |

### 2. Emergency_Operator ✅ Mostly Complete — Missing: Disaster Event management UI

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| View Dashboard | ✅ | ✅ | Complete |
| Manage Incidents (create + assign + status) | ✅ | ✅ | Complete |
| Deploy Teams (assign) | ✅ | ✅ | Complete |
| View Hospitals + Admit/Discharge | ✅ | ✅ | Complete |
| Request Resources | ✅ | ✅ | Complete |
| View/Process Approvals | ✅ | ✅ | Complete |
| **Create/Update Disaster Events** | ✅ Backend | ❌ Frontend | **MISSING UI** |

### 3. Field_Officer ⚠️ Limited — Missing: Several key features

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| View Dashboard | ✅ | ✅ | Complete |
| View Incidents (read-only) | ✅ | ✅ | Complete |
| View Teams + Complete Assignments | ✅ | ✅ | Complete |
| View Hospitals (read-only) | ✅ | ✅ | Complete |
| **Submit Field Reports (create reports from field)** | ✅ Backend (public route) | ⚠️ Limited | Exists but should be a dedicated field-report button |
| **View assigned incidents only (filtered to own assignments)** | ❌ | ❌ | **MISSING** |

### 4. Warehouse_Manager ✅ Mostly Complete — Minor gap

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| View Dashboard | ✅ | ✅ | Complete |
| Add Resources / View Inventory | ✅ | ✅ | Complete |
| Request Allocation | ✅ | ✅ | Complete |
| Dispatch Approved Allocations | ✅ | ✅ | Complete |
| Process Approvals (resource-related) | ✅ | ✅ | Complete |
| **Update Resource Quantity (restock)** | ❌ | ❌ | **MISSING** |

### 5. Finance_Officer ✅ Mostly Complete

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| View Dashboard | ✅ | ✅ | Complete |
| Record Transactions | ✅ | ✅ | Complete |
| View Transactions + Summary | ✅ | ✅ | Complete |
| Process Approvals (financial) | ✅ | ✅ | Complete |

---

## Proposed Changes

### Component 1: Admin User Management (Backend + Frontend)

> [!IMPORTANT]
> This is the biggest missing piece. Admin should be able to manage all users in the system.

#### [NEW] [users.routes.js](file:///d:/DATABASE_PROJECT/src/routes/users.routes.js)
- `GET /api/users` — List all users (Admin only)
- `POST /api/users` — Create new user (Admin only)
- `PATCH /api/users/:id` — Update user (role, email, is_active) (Admin only)
- `PATCH /api/users/:id/toggle-status` — Activate/deactivate user (Admin only)
- `PATCH /api/users/:id/reset-password` — Reset password (Admin only)

#### [NEW] [users.controller.js](file:///d:/DATABASE_PROJECT/src/controllers/users.controller.js)
- Full CRUD for users with bcrypt password hashing
- Audit logging on user changes

#### [NEW] [Users.jsx](file:///d:/DATABASE_PROJECT/frontend/src/pages/Users.jsx)
- Users management page with:
  - Users list table (ID, username, email, role, status, created_at)
  - Create User modal
  - Edit User modal (change role, email)
  - Toggle active/inactive with confirmation
  - Reset password modal

---

### Component 2: Disaster Events Management UI (Frontend)

#### [NEW] [Events.jsx](file:///d:/DATABASE_PROJECT/frontend/src/pages/Events.jsx)
- Disaster Events page for Admin and Operator with:
  - List of all disaster events with filters
  - Create Event modal (name, type, location, start_date)
  - Update Event Status (Active → Contained → Closed)
  - Stats cards (total, active, contained, closed)

---

### Component 3: Audit Trail UI (Admin)

#### [NEW] [AuditTrail.jsx](file:///d:/DATABASE_PROJECT/frontend/src/pages/AuditTrail.jsx)
- Admin-only page showing:
  - Table of audit log entries from `vw_AuditTrail`
  - Filters by action type, table name
  - Timestamped entries with user info

---

### Component 4: Resource Restock (Warehouse Manager)

#### [MODIFY] [resources.controller.js](file:///d:/DATABASE_PROJECT/src/controllers/resources.controller.js)
- Add `updateResourceStock` controller — PATCH to update quantity_available

#### [MODIFY] [resources.routes.js](file:///d:/DATABASE_PROJECT/src/routes/resources.routes.js)
- Add `PATCH /api/resources/:id/restock` route (Admin + Warehouse_Manager)

#### [MODIFY] [Resources.jsx](file:///d:/DATABASE_PROJECT/frontend/src/pages/Resources.jsx)
- Add "Restock" button on each inventory row for Admin/Warehouse Manager
- Restock modal to update quantity

---

### Component 5: Router & Navigation Updates

#### [MODIFY] [App.jsx](file:///d:/DATABASE_PROJECT/frontend/src/App.jsx)
- Add routes for `/users`, `/events`, `/audit-trail`

#### [MODIFY] [Sidebar.jsx](file:///d:/DATABASE_PROJECT/frontend/src/components/Sidebar.jsx)
- Add "Users" menu item (Admin only)
- Add "Disaster Events" menu item (Admin + Operator + Field)
- Add "Audit Trail" menu item (Admin only)

#### [MODIFY] [server.js](file:///d:/DATABASE_PROJECT/server.js)
- Register `/api/users` route

---

## Summary of Changes

| # | What | Files | Role(s) Impacted |
|---|------|-------|------------------|
| 1 | User Management CRUD | 2 new + 2 modified | Administrator |
| 2 | Disaster Events UI | 1 new + 2 modified | Admin, Operator |
| 3 | Audit Trail UI | 1 new + 2 modified | Administrator |
| 4 | Resource Restock | 2 modified + 1 frontend | Warehouse Manager, Admin |
| 5 | Router + Navigation | 3 modified | All roles |

---

## Verification Plan

### Automated Tests
- Start backend server and verify all new API endpoints respond correctly
- Run the frontend dev server and visually verify each role's dashboard and navigation

### Manual Verification
- Login as each of the 5 roles and confirm:
  - Correct sidebar items appear
  - All CRUD operations work and hit the database
  - Role-based access control prevents unauthorized actions
  - Modals open, submit, and close correctly

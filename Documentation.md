# Phase 5: Project Documentation
## Smart Disaster Response MIS

This document fulfills the requirements for Phase 5 of the Smart Disaster Response MIS project.

---

## 1. Design Rationale

The system architecture was designed with a focus on **role-based security**, **real-time operations**, and **data integrity**, which are critical in disaster management scenarios.

### 1.1 Architecture & Tech Stack
- **Backend**: Node.js with Express provides a lightweight, asynchronous, and non-blocking architecture, making it ideal for I/O heavy operations such as handling multiple incoming emergency requests and serving dashboards simultaneously.
- **Frontend**: React.js with Vite ensures a highly responsive Single Page Application (SPA). A custom Vanilla CSS design system was used to create a premium, glassmorphism-inspired UI to reduce cognitive load on operators during high-stress situations.
- **Database**: Microsoft SQL Server was chosen due to its robust ACID compliance, comprehensive transaction handling, and advanced indexing capabilities.
- **Real-time Communication**: Native WebSockets (`express-ws`) were implemented to push critical updates (such as new reports or changing team statuses) to the frontend instantly without relying on continuous HTTP polling.

### 1.2 Security & Access Control
- **Authentication**: JWT (JSON Web Tokens) with a short-to-medium lifespan ensures secure, stateless authentication. Passwords are encrypted using `bcrypt`.
- **RBAC (Role-Based Access Control)**: Different user roles (`Administrator`, `Emergency_Operator`, `Field_Officer`, `Warehouse_Manager`, `Finance_Officer`) are strictly enforced both on the backend routes and via a React ProtectedRoute wrapper.
- **Audit Logging**: A dedicated `Audit_Log` table automatically tracks critical database mutations via SQL Triggers, satisfying legal and compliance requirements for financial and operational actions.

---

## 2. Normalization Steps

The database was designed up to the **Third Normal Form (3NF)** to minimize redundancy and prevent insertion, update, and deletion anomalies.

### Step 1: First Normal Form (1NF)
- Ensured all tables have a defined Primary Key.
- Eliminated repeating groups. For example, rather than a `Disaster_Event` having multiple columns for assigned teams (`team1`, `team2`, `team3`), a separate `Team_Assignments` table was created.
- All attributes hold atomic values (e.g., location strings, individual quantities).

### Step 2: Second Normal Form (2NF)
- Ensured all non-key attributes are fully functionally dependent on the primary key.
- In `Resource_Allocations`, attributes like `quantity_requested` depend entirely on the composite relationship (which is modelled with a surrogate key `allocation_id` but logically depends on the Event, Resource, and Requester), rather than partially depending on just the Resource or the Event.

### Step 3: Third Normal Form (3NF)
- Eliminated transitive dependencies.
- For example, patient information relies on the `Hospital`. Instead of repeating the hospital's location and available beds in the `Patients` table, the `Patients` table only stores the `hospital_id`. The application joins with the `Hospitals` table when location data is needed.

---

## 3. Performance Optimization Report

To guarantee high availability and quick read-times during an ongoing crisis, several database-level optimizations were implemented.

### 3.1 Indexing Strategy
A careful balance between read and write performance was maintained:
- **Filtered Indexes**: Indexes were placed on highly queried status columns (e.g., `Emergency_Reports(status)`, `Rescue_Teams(availability_status)`).
- **Composite Indexes**: We used composite indexes for common dashboard queries, such as `IX_EmergencyReports_Type_Severity` (disaster_type, severity, status).
- **Foreign Key Indexes**: All foreign keys (e.g., `event_id` in `Resource_Allocations`) were explicitly indexed to speed up heavily used `JOIN` operations.

### 3.2 View Abstraction
Complex queries involving multiple joins (such as the `vw_ActiveIncidents` and `vw_HospitalCapacity`) were abstracted into **SQL Views**. This provides two benefits:
1. **Security**: Roles like `Emergency_Operator` can query the view without needing direct `SELECT` access to underlying sensitive tables.
2. **Performance**: Reduces the computational load on the Node.js backend by letting SQL Server's query optimizer handle the complex execution plans natively.

### 3.3 Transaction Handling & Stored Procedures
Complex, multi-step operations are wrapped in **Stored Procedures** with `BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK` blocks.
- **Example**: `sp_RequestResourceAllocation` verifies stock, creates an allocation record, and generates an approval request in a single atomic transaction. This prevents partial data writes and race conditions during high-traffic events.

### 3.4 Automated Triggers
To avoid race conditions and reduce backend API round-trips, **SQL Triggers** were used for cascading logic:
- Automatically decrementing hospital beds upon patient admission (`trg_Patient_BedManagement`).
- Automatically deducting resource inventory when a dispatch is approved (`trg_ResourceAllocation_Dispatch`).

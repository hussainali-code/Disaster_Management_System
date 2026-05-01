-- ============================================================
-- Smart Disaster Response MIS
-- Database: Microsoft SQL Server
-- Phase 2: DDL - Tables, Constraints, Indexes, Triggers, Views
-- ============================================================

USE master;
GO

IF DB_ID('DisasterMIS') IS NOT NULL
    DROP DATABASE DisasterMIS;
GO

CREATE DATABASE DisasterMIS;
GO

USE DisasterMIS;
GO

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE Users (
    user_id       INT IDENTITY(1,1) PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    role          VARCHAR(30)  NOT NULL
                  CHECK (role IN ('Administrator','Emergency_Operator','Field_Officer','Warehouse_Manager','Finance_Officer')),
    is_active     BIT          NOT NULL DEFAULT 1,
    created_at    DATETIME2    NOT NULL DEFAULT SYSDATETIME()
);
GO

-- ============================================================
-- 2. AUDIT LOG
-- ============================================================
CREATE TABLE Audit_Log (
    log_id      INT IDENTITY(1,1) PRIMARY KEY,
    user_id     INT           NULL REFERENCES Users(user_id),
    action      VARCHAR(20)   NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT')),
    table_name  VARCHAR(60)   NOT NULL,
    record_id   INT           NULL,
    old_value   NVARCHAR(MAX) NULL,
    new_value   NVARCHAR(MAX) NULL,
    logged_at   DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);
GO

-- ============================================================
-- 3. DISASTER EVENTS
-- ============================================================
CREATE TABLE Disaster_Events (
    event_id      INT IDENTITY(1,1) PRIMARY KEY,
    event_name    VARCHAR(120) NOT NULL,
    disaster_type VARCHAR(30)  NOT NULL
                  CHECK (disaster_type IN ('Flood','Earthquake','Fire','Landslide','Cyclone','Other')),
    location      VARCHAR(150) NOT NULL,
    start_date    DATE         NOT NULL,
    end_date      DATE         NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'Active'
                  CHECK (status IN ('Active','Contained','Closed')),
    created_at    DATETIME2    NOT NULL DEFAULT SYSDATETIME()
);
GO

-- ============================================================
-- 4. EMERGENCY REPORTS
-- ============================================================
CREATE TABLE Emergency_Reports (
    report_id        INT IDENTITY(1,1) PRIMARY KEY,
    event_id         INT          NULL REFERENCES Disaster_Events(event_id),
    location         VARCHAR(200) NOT NULL,
    disaster_type    VARCHAR(30)  NOT NULL
                     CHECK (disaster_type IN ('Flood','Earthquake','Fire','Landslide','Cyclone','Other')),
    severity         VARCHAR(10)  NOT NULL CHECK (severity IN ('Low','Medium','High','Critical')),
    status           VARCHAR(20)  NOT NULL DEFAULT 'Pending'
                     CHECK (status IN ('Pending','Assigned','InProgress','Resolved','Closed')),
    reporter_contact VARCHAR(100) NULL,
    reported_at      DATETIME2    NOT NULL DEFAULT SYSDATETIME()
);
GO

-- ============================================================
-- 5. RESCUE TEAMS
-- ============================================================
CREATE TABLE Rescue_Teams (
    team_id             INT IDENTITY(1,1) PRIMARY KEY,
    team_name           VARCHAR(100) NOT NULL UNIQUE,
    team_type           VARCHAR(20)  NOT NULL CHECK (team_type IN ('Medical','Fire','Rescue','Search')),
    current_location    VARCHAR(150) NOT NULL,
    availability_status VARCHAR(20)  NOT NULL DEFAULT 'Available'
                        CHECK (availability_status IN ('Available','Assigned','Busy','Completed','Offline')),
    created_at          DATETIME2    NOT NULL DEFAULT SYSDATETIME()
);
GO

-- ============================================================
-- 6. TEAM ASSIGNMENTS
-- ============================================================
CREATE TABLE Team_Assignments (
    assignment_id INT IDENTITY(1,1) PRIMARY KEY,
    team_id       INT          NOT NULL REFERENCES Rescue_Teams(team_id),
    report_id     INT          NOT NULL REFERENCES Emergency_Reports(report_id),
    assigned_by   INT          NOT NULL REFERENCES Users(user_id),
    assigned_at   DATETIME2    NOT NULL DEFAULT SYSDATETIME(),
    completed_at  DATETIME2    NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'Assigned'
                  CHECK (status IN ('Assigned','InProgress','Completed','Cancelled'))
);
GO

-- ============================================================
-- 7. TEAM ACTIVITY LOG
-- ============================================================
CREATE TABLE Team_Activity_Log (
    activity_id   INT IDENTITY(1,1) PRIMARY KEY,
    team_id       INT       NOT NULL REFERENCES Rescue_Teams(team_id),
    assignment_id INT       NULL REFERENCES Team_Assignments(assignment_id),
    status_from   VARCHAR(20) NOT NULL,
    status_to     VARCHAR(20) NOT NULL,
    changed_at    DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

-- ============================================================
-- 8. WAREHOUSE
-- ============================================================
CREATE TABLE Warehouse (
    warehouse_id INT IDENTITY(1,1) PRIMARY KEY,
    name         VARCHAR(120) NOT NULL,
    location     VARCHAR(150) NOT NULL,
    manager_name VARCHAR(100) NOT NULL
);
GO

-- Insert the single central warehouse
INSERT INTO Warehouse (name, location, manager_name)
VALUES ('Central Disaster Response Warehouse', 'Islamabad, Capital Territory', 'To Be Assigned');
GO

-- ============================================================
-- 9. RESOURCES
-- ============================================================
CREATE TABLE Resources (
    resource_id         INT IDENTITY(1,1) PRIMARY KEY,
    warehouse_id        INT          NOT NULL REFERENCES Warehouse(warehouse_id),
    resource_name       VARCHAR(100) NOT NULL,
    resource_type       VARCHAR(30)  NOT NULL
                        CHECK (resource_type IN ('Food','Water','Medicine','Shelter','Equipment','Other')),
    quantity_available  INT          NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    low_stock_threshold INT          NOT NULL DEFAULT 50,
    unit                VARCHAR(20)  NOT NULL
);
GO

-- ============================================================
-- 10. RESOURCE ALLOCATIONS
-- ============================================================
CREATE TABLE Resource_Allocations (
    allocation_id      INT IDENTITY(1,1) PRIMARY KEY,
    resource_id        INT          NOT NULL REFERENCES Resources(resource_id),
    event_id           INT          NOT NULL REFERENCES Disaster_Events(event_id),
    requested_by       INT          NOT NULL REFERENCES Users(user_id),
    approved_by        INT          NULL REFERENCES Users(user_id),
    quantity_requested INT          NOT NULL CHECK (quantity_requested > 0),
    quantity_dispatched INT         NOT NULL DEFAULT 0,
    quantity_consumed  INT          NOT NULL DEFAULT 0,
    status             VARCHAR(20)  NOT NULL DEFAULT 'Pending'
                       CHECK (status IN ('Pending','Approved','Dispatched','Consumed','Rejected','Cancelled')),
    requested_at       DATETIME2    NOT NULL DEFAULT SYSDATETIME(),
    approved_at        DATETIME2    NULL
);
GO

-- ============================================================
-- 11. HOSPITALS
-- ============================================================
CREATE TABLE Hospitals (
    hospital_id     INT IDENTITY(1,1) PRIMARY KEY,
    hospital_name   VARCHAR(150) NOT NULL,
    location        VARCHAR(150) NOT NULL,
    total_beds      INT          NOT NULL CHECK (total_beds > 0),
    available_beds  INT          NOT NULL CHECK (available_beds >= 0),
    contact_number  VARCHAR(20)  NULL,
    CONSTRAINT chk_beds CHECK (available_beds <= total_beds)
);
GO

-- ============================================================
-- 12. PATIENTS
-- ============================================================
CREATE TABLE Patients (
    patient_id         INT IDENTITY(1,1) PRIMARY KEY,
    hospital_id        INT          NOT NULL REFERENCES Hospitals(hospital_id),
    report_id          INT          NULL REFERENCES Emergency_Reports(report_id),
    patient_name       VARCHAR(100) NOT NULL,
    condition_severity VARCHAR(10)  NOT NULL CHECK (condition_severity IN ('Stable','Serious','Critical')),
    is_critical        BIT          NOT NULL DEFAULT 0,
    admitted_at        DATETIME2    NOT NULL DEFAULT SYSDATETIME(),
    discharged_at      DATETIME2    NULL
);
GO

-- ============================================================
-- 13. FINANCIAL TRANSACTIONS
-- ============================================================
CREATE TABLE Financial_Transactions (
    transaction_id     INT IDENTITY(1,1) PRIMARY KEY,
    event_id           INT           NOT NULL REFERENCES Disaster_Events(event_id),
    recorded_by        INT           NOT NULL REFERENCES Users(user_id),
    transaction_type   VARCHAR(20)   NOT NULL
                       CHECK (transaction_type IN ('Donation','Expense','Procurement','Distribution')),
    amount             DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description        VARCHAR(255)  NOT NULL,
    source_or_recipient VARCHAR(150) NULL,
    transaction_date   DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);
GO

-- ============================================================
-- 14. APPROVAL REQUESTS
-- ============================================================
CREATE TABLE Approval_Requests (
    request_id    INT IDENTITY(1,1) PRIMARY KEY,
    requested_by  INT          NOT NULL REFERENCES Users(user_id),
    approved_by   INT          NULL REFERENCES Users(user_id),
    request_type  VARCHAR(30)  NOT NULL
                  CHECK (request_type IN ('Resource_Distribution','Rescue_Deployment','Financial_Approval')),
    reference_id  INT          NOT NULL,   -- FK to relevant table (allocation_id / assignment_id / transaction_id)
    status        VARCHAR(20)  NOT NULL DEFAULT 'Pending'
                  CHECK (status IN ('Pending','Approved','Rejected','Cancelled')),
    notes         NVARCHAR(500) NULL,
    requested_at  DATETIME2    NOT NULL DEFAULT SYSDATETIME(),
    decided_at    DATETIME2    NULL
);
GO


-- ============================================================
-- INDEXES (Performance Optimisation)
-- ============================================================

-- Emergency Reports: heavily filtered by location, type, severity, status
CREATE INDEX IX_EmergencyReports_Location     ON Emergency_Reports(location);
CREATE INDEX IX_EmergencyReports_DisasterType ON Emergency_Reports(disaster_type);
CREATE INDEX IX_EmergencyReports_Severity     ON Emergency_Reports(severity);
CREATE INDEX IX_EmergencyReports_Status       ON Emergency_Reports(status);
CREATE INDEX IX_EmergencyReports_ReportedAt   ON Emergency_Reports(reported_at DESC);
-- Composite: dashboard filtering
CREATE INDEX IX_EmergencyReports_Type_Severity ON Emergency_Reports(disaster_type, severity, status);

-- Disaster Events
CREATE INDEX IX_DisasterEvents_Type     ON Disaster_Events(disaster_type);
CREATE INDEX IX_DisasterEvents_Status   ON Disaster_Events(status);
CREATE INDEX IX_DisasterEvents_Location ON Disaster_Events(location);

-- Team Assignments: join-heavy
CREATE INDEX IX_TeamAssignments_TeamId   ON Team_Assignments(team_id);
CREATE INDEX IX_TeamAssignments_ReportId ON Team_Assignments(report_id);
CREATE INDEX IX_TeamAssignments_Status   ON Team_Assignments(status);

-- Rescue Teams: filtered by status & type
CREATE INDEX IX_RescueTeams_Status ON Rescue_Teams(availability_status);
CREATE INDEX IX_RescueTeams_Type   ON Rescue_Teams(team_type);

-- Resources: frequently queried by type
CREATE INDEX IX_Resources_Type        ON Resources(resource_type);
CREATE INDEX IX_Resources_WarehouseId ON Resources(warehouse_id);

-- Resource Allocations: filtered by event and status
CREATE INDEX IX_ResourceAllocations_EventId  ON Resource_Allocations(event_id);
CREATE INDEX IX_ResourceAllocations_Status   ON Resource_Allocations(status);
CREATE INDEX IX_ResourceAllocations_ReqAt    ON Resource_Allocations(requested_at DESC);
-- Composite: event + status
CREATE INDEX IX_ResourceAllocations_Event_Status ON Resource_Allocations(event_id, status);

-- Financial Transactions: audit, reporting
CREATE INDEX IX_FinancialTx_EventId  ON Financial_Transactions(event_id);
CREATE INDEX IX_FinancialTx_Type     ON Financial_Transactions(transaction_type);
CREATE INDEX IX_FinancialTx_Date     ON Financial_Transactions(transaction_date DESC);
-- Composite: event + type + date (common report query)
CREATE INDEX IX_FinancialTx_Event_Type_Date ON Financial_Transactions(event_id, transaction_type, transaction_date DESC);

-- Approval Requests: filtered by status and type
CREATE INDEX IX_ApprovalRequests_Status      ON Approval_Requests(status);
CREATE INDEX IX_ApprovalRequests_RequestType ON Approval_Requests(request_type);
CREATE INDEX IX_ApprovalRequests_RequestedBy ON Approval_Requests(requested_by);

-- Audit Log: high-volume, queried by user and table
CREATE INDEX IX_AuditLog_UserId    ON Audit_Log(user_id);
CREATE INDEX IX_AuditLog_TableName ON Audit_Log(table_name);
CREATE INDEX IX_AuditLog_LoggedAt  ON Audit_Log(logged_at DESC);

-- Patients: filtered by hospital and severity
CREATE INDEX IX_Patients_HospitalId ON Patients(hospital_id);
CREATE INDEX IX_Patients_Severity   ON Patients(condition_severity);

GO


-- ============================================================
-- TRIGGERS (Database-Level Automation)
-- ============================================================

-- TRIGGER 1: On Team Assignment INSERT → set team status to Assigned
--            and log the status transition
CREATE OR ALTER TRIGGER trg_TeamAssignment_Insert
ON Team_Assignments
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Update team availability
    UPDATE rt
    SET rt.availability_status = 'Assigned'
    FROM Rescue_Teams rt
    INNER JOIN inserted i ON rt.team_id = i.team_id;

    -- Log status change
    INSERT INTO Team_Activity_Log (team_id, assignment_id, status_from, status_to, changed_at)
    SELECT i.team_id, i.assignment_id, 'Available', 'Assigned', SYSDATETIME()
    FROM inserted i;

    -- Log in audit
    INSERT INTO Audit_Log (user_id, action, table_name, record_id, new_value, logged_at)
    SELECT i.assigned_by, 'INSERT', 'Team_Assignments', i.assignment_id,
           CONCAT('team_id=', i.team_id, ' report_id=', i.report_id), SYSDATETIME()
    FROM inserted i;
END;
GO

-- TRIGGER 2: On Team Assignment UPDATE (status → Completed) → set team back to Available
CREATE OR ALTER TRIGGER trg_TeamAssignment_Complete
ON Team_Assignments
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(status)
    BEGIN
        -- When assignment completes, free up the team
        UPDATE rt
        SET rt.availability_status = 'Available'
        FROM Rescue_Teams rt
        INNER JOIN inserted i ON rt.team_id = i.team_id
        WHERE i.status = 'Completed';

        -- Log all status transitions
        INSERT INTO Team_Activity_Log (team_id, assignment_id, status_from, status_to, changed_at)
        SELECT i.team_id, i.assignment_id, d.status, i.status, SYSDATETIME()
        FROM inserted i
        INNER JOIN deleted d ON i.assignment_id = d.assignment_id
        WHERE i.status <> d.status;
    END
END;
GO

-- TRIGGER 3: On Resource Allocation status → Dispatched → deduct from warehouse stock
--            Also enforce no negative inventory
CREATE OR ALTER TRIGGER trg_ResourceAllocation_Dispatch
ON Resource_Allocations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(status)
    BEGIN
        -- Deduct stock when dispatched
        UPDATE r
        SET r.quantity_available = r.quantity_available - i.quantity_requested
        FROM Resources r
        INNER JOIN inserted i ON r.resource_id = i.resource_id
        INNER JOIN deleted d  ON i.allocation_id = d.allocation_id
        WHERE i.status = 'Dispatched' AND d.status = 'Approved';

        -- Enforce no negative inventory (rollback if violated)
        IF EXISTS (
            SELECT 1 FROM Resources r
            INNER JOIN inserted i ON r.resource_id = i.resource_id
            WHERE r.quantity_available < 0
        )
        BEGIN
            RAISERROR('Insufficient stock: cannot dispatch more than available quantity.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Emit low stock warning into audit log
        INSERT INTO Audit_Log (user_id, action, table_name, record_id, new_value, logged_at)
        SELECT NULL, 'UPDATE', 'Resources', r.resource_id,
               CONCAT('LOW STOCK ALERT: ', r.resource_name, ' - qty=', r.quantity_available),
               SYSDATETIME()
        FROM Resources r
        INNER JOIN inserted i ON r.resource_id = i.resource_id
        WHERE i.status = 'Dispatched' AND r.quantity_available <= r.low_stock_threshold;

        -- Audit the allocation update
        INSERT INTO Audit_Log (user_id, action, table_name, record_id, old_value, new_value, logged_at)
        SELECT i.requested_by, 'UPDATE', 'Resource_Allocations', i.allocation_id,
               d.status, i.status, SYSDATETIME()
        FROM inserted i
        INNER JOIN deleted d ON i.allocation_id = d.allocation_id
        WHERE i.status <> d.status;
    END
END;
GO

-- TRIGGER 4: On Approval Request UPDATE (→ Approved/Rejected) → update referenced record
CREATE OR ALTER TRIGGER trg_ApprovalRequest_Decision
ON Approval_Requests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(status)
    BEGIN
        -- Propagate approval to Resource_Allocations
        UPDATE ra
        SET ra.status = CASE WHEN i.status = 'Approved' THEN 'Approved' ELSE 'Rejected' END,
            ra.approved_by = i.approved_by,
            ra.approved_at = SYSDATETIME()
        FROM Resource_Allocations ra
        INNER JOIN inserted i ON ra.allocation_id = i.reference_id
        WHERE i.request_type = 'Resource_Distribution'
          AND i.status IN ('Approved','Rejected');

        -- Propagate approval to Team_Assignments
        UPDATE ta
        SET ta.status = CASE WHEN i.status = 'Approved' THEN 'InProgress' ELSE 'Cancelled' END
        FROM Team_Assignments ta
        INNER JOIN inserted i ON ta.assignment_id = i.reference_id
        WHERE i.request_type = 'Rescue_Deployment'
          AND i.status IN ('Approved','Rejected');

        -- Audit
        INSERT INTO Audit_Log (user_id, action, table_name, record_id, old_value, new_value, logged_at)
        SELECT i.approved_by, 'UPDATE', 'Approval_Requests', i.request_id,
               d.status, i.status, SYSDATETIME()
        FROM inserted i
        INNER JOIN deleted d ON i.request_id = d.request_id
        WHERE i.status <> d.status;
    END
END;
GO

-- TRIGGER 5: On Patient INSERT → decrement hospital available_beds
--            On Patient UPDATE (discharged) → increment available_beds
CREATE OR ALTER TRIGGER trg_Patient_BedManagement
ON Patients
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- On admission: decrement beds
    UPDATE h
    SET h.available_beds = h.available_beds - 1
    FROM Hospitals h
    INNER JOIN inserted i ON h.hospital_id = i.hospital_id
    WHERE NOT EXISTS (SELECT 1 FROM deleted d WHERE d.patient_id = i.patient_id);

    -- Prevent overbooking
    IF EXISTS (SELECT 1 FROM Hospitals WHERE available_beds < 0)
    BEGIN
        RAISERROR('No available beds in this hospital.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- On discharge: increment beds
    UPDATE h
    SET h.available_beds = h.available_beds + 1
    FROM Hospitals h
    INNER JOIN inserted i ON h.hospital_id = i.hospital_id
    INNER JOIN deleted  d ON i.patient_id = d.patient_id
    WHERE i.discharged_at IS NOT NULL AND d.discharged_at IS NULL;
END;
GO

-- TRIGGER 6: Log all Financial Transactions on INSERT
CREATE OR ALTER TRIGGER trg_FinancialTx_Audit
ON Financial_Transactions
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Audit_Log (user_id, action, table_name, record_id, new_value, logged_at)
    SELECT i.recorded_by, 'INSERT', 'Financial_Transactions', i.transaction_id,
           CONCAT('type=', i.transaction_type, ' amount=', i.amount, ' event_id=', i.event_id),
           SYSDATETIME()
    FROM inserted i;
END;
GO


-- ============================================================
-- VIEWS (Role-Based Data Abstraction)
-- ============================================================

-- VIEW 1: Active Incidents Dashboard (Emergency Operators)
CREATE OR ALTER VIEW vw_ActiveIncidents AS
SELECT
    er.report_id,
    er.location,
    er.disaster_type,
    er.severity,
    er.status        AS report_status,
    er.reported_at,
    de.event_name,
    de.status        AS event_status,
    rt.team_name,
    rt.team_type,
    ta.status        AS assignment_status
FROM Emergency_Reports er
LEFT JOIN Disaster_Events  de ON er.event_id    = de.event_id
LEFT JOIN Team_Assignments ta ON er.report_id   = ta.report_id
LEFT JOIN Rescue_Teams     rt ON ta.team_id     = rt.team_id
WHERE er.status NOT IN ('Resolved','Closed');
GO

-- VIEW 2: Resource Stock Summary (Warehouse Manager)
CREATE OR ALTER VIEW vw_ResourceStock AS
SELECT
    r.resource_id,
    r.resource_name,
    r.resource_type,
    r.quantity_available,
    r.low_stock_threshold,
    r.unit,
    CASE WHEN r.quantity_available <= r.low_stock_threshold THEN 'LOW STOCK' ELSE 'OK' END AS stock_alert,
    w.name     AS warehouse_name,
    w.location AS warehouse_location
FROM Resources r
INNER JOIN Warehouse w ON r.warehouse_id = w.warehouse_id;
GO

-- VIEW 3: Hospital Capacity Overview
CREATE OR ALTER VIEW vw_HospitalCapacity AS
SELECT
    h.hospital_id,
    h.hospital_name,
    h.location,
    h.total_beds,
    h.available_beds,
    h.total_beds - h.available_beds AS occupied_beds,
    CAST(ROUND(
        (CAST(h.total_beds - h.available_beds AS FLOAT) / NULLIF(h.total_beds,0)) * 100
    , 1) AS DECIMAL(5,1))           AS occupancy_pct,
    COUNT(p.patient_id)             AS current_patients,
    SUM(CASE WHEN p.is_critical = 1 THEN 1 ELSE 0 END) AS critical_patients
FROM Hospitals h
LEFT JOIN Patients p ON h.hospital_id = p.hospital_id AND p.discharged_at IS NULL
GROUP BY h.hospital_id, h.hospital_name, h.location, h.total_beds, h.available_beds;
GO

-- VIEW 4: Financial Summary per Event (Finance Officers)
CREATE OR ALTER VIEW vw_FinancialSummaryByEvent AS
SELECT
    de.event_id,
    de.event_name,
    de.disaster_type,
    SUM(CASE WHEN ft.transaction_type = 'Donation'     THEN ft.amount ELSE 0 END) AS total_donations,
    SUM(CASE WHEN ft.transaction_type = 'Expense'      THEN ft.amount ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN ft.transaction_type = 'Procurement'  THEN ft.amount ELSE 0 END) AS total_procurement,
    SUM(CASE WHEN ft.transaction_type = 'Distribution' THEN ft.amount ELSE 0 END) AS total_distribution,
    SUM(CASE WHEN ft.transaction_type = 'Donation'     THEN ft.amount ELSE 0 END)
  - SUM(CASE WHEN ft.transaction_type IN ('Expense','Procurement','Distribution') THEN ft.amount ELSE 0 END)
                                                                                   AS net_balance,
    COUNT(ft.transaction_id) AS transaction_count
FROM Disaster_Events de
LEFT JOIN Financial_Transactions ft ON de.event_id = ft.event_id
GROUP BY de.event_id, de.event_name, de.disaster_type;
GO

-- VIEW 5: Pending Approvals Queue (Admin + domain heads)
CREATE OR ALTER VIEW vw_PendingApprovals AS
SELECT
    ar.request_id,
    ar.request_type,
    ar.reference_id,
    ar.status,
    ar.notes,
    ar.requested_at,
    u.username    AS requested_by_user,
    u.role        AS requester_role
FROM Approval_Requests ar
INNER JOIN Users u ON ar.requested_by = u.user_id
WHERE ar.status = 'Pending';
GO

-- VIEW 6: Rescue Team Status Board (Field Officers)
CREATE OR ALTER VIEW vw_RescueTeamStatus AS
SELECT
    rt.team_id,
    rt.team_name,
    rt.team_type,
    rt.current_location,
    rt.availability_status,
    ta.assignment_id,
    ta.status      AS assignment_status,
    er.location    AS incident_location,
    er.severity    AS incident_severity,
    ta.assigned_at
FROM Rescue_Teams rt
LEFT JOIN Team_Assignments ta ON rt.team_id = ta.team_id AND ta.status NOT IN ('Completed','Cancelled')
LEFT JOIN Emergency_Reports er ON ta.report_id = er.report_id;
GO

-- VIEW 7: MIS Incident Statistics (Admin / Reporting)
CREATE OR ALTER VIEW vw_IncidentStatistics AS
SELECT
    disaster_type,
    severity,
    COUNT(*)                                               AS total_reports,
    SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END)  AS resolved_count,
    SUM(CASE WHEN status = 'Pending'  THEN 1 ELSE 0 END)  AS pending_count,
    AVG(DATEDIFF(MINUTE, reported_at, SYSDATETIME()))      AS avg_response_min
FROM Emergency_Reports
GROUP BY disaster_type, severity;
GO

-- VIEW 8: Audit Trail (Administrator only)
CREATE OR ALTER VIEW vw_AuditTrail AS
SELECT
    al.log_id,
    al.action,
    al.table_name,
    al.record_id,
    al.old_value,
    al.new_value,
    al.logged_at,
    u.username,
    u.role
FROM Audit_Log al
LEFT JOIN Users u ON al.user_id = u.user_id;
GO


-- ============================================================
-- SAMPLE DML - Seed Data
-- ============================================================

-- Users (passwords are bcrypt hashes of 'Password@123')
INSERT INTO Users (username, password_hash, email, role) VALUES
('admin_sara',    '$2b$10$HASHEDPASSWORD1', 'sara@disastermi.gov',    'Administrator'),
('op_khalid',     '$2b$10$HASHEDPASSWORD2', 'khalid@disastermi.gov',  'Emergency_Operator'),
('field_ali',     '$2b$10$HASHEDPASSWORD3', 'ali@disastermi.gov',     'Field_Officer'),
('wm_fatima',     '$2b$10$HASHEDPASSWORD4', 'fatima@disastermi.gov',  'Warehouse_Manager'),
('finance_omar',  '$2b$10$HASHEDPASSWORD5', 'omar@disastermi.gov',    'Finance_Officer');

-- Disaster Events
INSERT INTO Disaster_Events (event_name, disaster_type, location, start_date, status) VALUES
('Sindh Floods 2026',       'Flood',       'Sindh, Pakistan',   '2026-07-01', 'Active'),
('Balochistan Earthquake',  'Earthquake',  'Quetta, Pakistan',  '2026-04-15', 'Active'),
('Karachi Urban Fire',      'Fire',        'Karachi, Pakistan', '2026-03-10', 'Contained');

-- Emergency Reports
INSERT INTO Emergency_Reports (event_id, location, disaster_type, severity, reporter_contact) VALUES
(1, 'Sukkur, Sindh',    'Flood',       'Critical', '03001234567'),
(1, 'Larkana, Sindh',   'Flood',       'High',     NULL),
(2, 'Quetta Centre',    'Earthquake',  'Critical', '03337654321'),
(3, 'Saddar, Karachi',  'Fire',        'Medium',   '03211112222');

-- Rescue Teams
INSERT INTO Rescue_Teams (team_name, team_type, current_location) VALUES
('Alpha Medical Unit',  'Medical', 'Islamabad Base'),
('Bravo Fire Squad',    'Fire',    'Islamabad Base'),
('Charlie Rescue',      'Rescue',  'Lahore Base'),
('Delta Search Team',   'Search',  'Karachi Base');

-- Resources
INSERT INTO Resources (warehouse_id, resource_name, resource_type, quantity_available, low_stock_threshold, unit) VALUES
(1, 'Rice Bags',        'Food',      5000, 500,  'bags'),
(1, 'Drinking Water',   'Water',    20000, 2000, 'liters'),
(1, 'Paracetamol',      'Medicine',  8000, 800,  'tablets'),
(1, 'Tents',            'Shelter',   1200, 100,  'units'),
(1, 'Stretchers',       'Equipment',  300,  30,  'units');

-- Hospitals
INSERT INTO Hospitals (hospital_name, location, total_beds, available_beds, contact_number) VALUES
('Civil Hospital Karachi',    'Karachi',    500, 120, '021-99261000'),
('JPMC Karachi',              'Karachi',    300,  80, '021-99261600'),
('Civil Hospital Quetta',     'Quetta',     400,  95, '081-9201200'),
('Sukkur General Hospital',   'Sukkur',     200,  60, '071-5631020');

-- Financial Transactions
INSERT INTO Financial_Transactions (event_id, recorded_by, transaction_type, amount, description, source_or_recipient) VALUES
(1, 5, 'Donation',    500000.00, 'Corporate donation for flood relief',    'ABC Corporation'),
(1, 5, 'Expense',      75000.00, 'Helicopter fuel for aerial relief',      'Pakistan Air Services'),
(2, 5, 'Procurement', 200000.00, 'Emergency medicine procurement',         'City Pharma'),
(1, 5, 'Donation',    150000.00, 'Individual donor contribution',          'Ahmed Khan');

GO


-- ============================================================
-- STORED PROCEDURES (Transaction Handling)
-- ============================================================

-- SP 1: Assign rescue team to report (ACID transaction)
CREATE OR ALTER PROCEDURE sp_AssignRescueTeam
    @team_id    INT,
    @report_id  INT,
    @assigned_by INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Validate team is available
        IF NOT EXISTS (
            SELECT 1 FROM Rescue_Teams
            WHERE team_id = @team_id AND availability_status = 'Available'
        )
        BEGIN
            RAISERROR('Team is not available for assignment.', 16, 1);
            ROLLBACK; RETURN;
        END

        -- Validate report is pending
        IF NOT EXISTS (
            SELECT 1 FROM Emergency_Reports
            WHERE report_id = @report_id AND status = 'Pending'
        )
        BEGIN
            RAISERROR('Report is not in Pending state.', 16, 1);
            ROLLBACK; RETURN;
        END

        -- Insert assignment (trigger will update team status + log)
        INSERT INTO Team_Assignments (team_id, report_id, assigned_by, status)
        VALUES (@team_id, @report_id, @assigned_by, 'Assigned');

        -- Update report status
        UPDATE Emergency_Reports SET status = 'Assigned' WHERE report_id = @report_id;

        COMMIT;
        SELECT 'Team assigned successfully.' AS result;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END;
GO

-- SP 2: Allocate resources (ACID transaction with approval request creation)
CREATE OR ALTER PROCEDURE sp_RequestResourceAllocation
    @resource_id        INT,
    @event_id           INT,
    @requested_by       INT,
    @quantity_requested INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Validate sufficient stock
        IF NOT EXISTS (
            SELECT 1 FROM Resources
            WHERE resource_id = @resource_id
              AND quantity_available >= @quantity_requested
        )
        BEGIN
            RAISERROR('Insufficient stock for requested quantity.', 16, 1);
            ROLLBACK; RETURN;
        END

        -- Create allocation record (Pending state)
        DECLARE @alloc_id INT;
        INSERT INTO Resource_Allocations
            (resource_id, event_id, requested_by, quantity_requested, status)
        VALUES
            (@resource_id, @event_id, @requested_by, @quantity_requested, 'Pending');

        SET @alloc_id = SCOPE_IDENTITY();

        -- Create approval request
        INSERT INTO Approval_Requests
            (requested_by, request_type, reference_id, status)
        VALUES
            (@requested_by, 'Resource_Distribution', @alloc_id, 'Pending');

        COMMIT;
        SELECT @alloc_id AS allocation_id, 'Allocation request submitted for approval.' AS result;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END;
GO

-- SP 3: Process approval decision
CREATE OR ALTER PROCEDURE sp_ProcessApproval
    @request_id  INT,
    @approved_by INT,
    @decision    VARCHAR(10),   -- 'Approved' or 'Rejected'
    @notes       NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF @decision NOT IN ('Approved','Rejected')
        BEGIN
            RAISERROR('Decision must be Approved or Rejected.', 16, 1);
            ROLLBACK; RETURN;
        END

        IF NOT EXISTS (SELECT 1 FROM Approval_Requests WHERE request_id = @request_id AND status = 'Pending')
        BEGIN
            RAISERROR('Approval request not found or already decided.', 16, 1);
            ROLLBACK; RETURN;
        END

        -- Update approval request (trigger propagates to referenced table)
        UPDATE Approval_Requests
        SET status     = @decision,
            approved_by = @approved_by,
            decided_at  = SYSDATETIME(),
            notes       = @notes
        WHERE request_id = @request_id;

        COMMIT;
        SELECT 'Approval processed: ' + @decision AS result;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END;
GO

-- SP 4: Admit patient with bed check
CREATE OR ALTER PROCEDURE sp_AdmitPatient
    @hospital_id        INT,
    @report_id          INT = NULL,
    @patient_name       VARCHAR(100),
    @condition_severity VARCHAR(10),
    @is_critical        BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (
            SELECT 1 FROM Hospitals WHERE hospital_id = @hospital_id AND available_beds > 0
        )
        BEGIN
            RAISERROR('No available beds at this hospital.', 16, 1);
            ROLLBACK; RETURN;
        END

        INSERT INTO Patients (hospital_id, report_id, patient_name, condition_severity, is_critical)
        VALUES (@hospital_id, @report_id, @patient_name, @condition_severity, @is_critical);

        COMMIT;
        SELECT SCOPE_IDENTITY() AS patient_id, 'Patient admitted successfully.' AS result;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END;
GO

PRINT 'DisasterMIS database created successfully with all tables, indexes, triggers, views, and stored procedures.';
GO

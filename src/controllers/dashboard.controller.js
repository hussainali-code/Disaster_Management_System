const { getPool, sql } = require('../config/db');

// GET /api/dashboard/overview  — top-level stats for admin dashboard
const getOverview = async (req, res) => {
    try {
        const pool = await getPool();

        const [reports, teams, resources, hospitals, finance] = await Promise.all([
            pool.request().query(`
                SELECT 
                    COUNT(*) AS total_reports,
                    SUM(CASE WHEN status = 'Pending'    THEN 1 ELSE 0 END) AS pending,
                    SUM(CASE WHEN status = 'Assigned'   THEN 1 ELSE 0 END) AS assigned,
                    SUM(CASE WHEN status = 'Resolved'   THEN 1 ELSE 0 END) AS resolved,
                    SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) AS critical
                FROM Emergency_Reports
            `),
            pool.request().query(`
                SELECT 
                    COUNT(*) AS total_teams,
                    SUM(CASE WHEN availability_status = 'Available' THEN 1 ELSE 0 END) AS available,
                    SUM(CASE WHEN availability_status = 'Assigned'  THEN 1 ELSE 0 END) AS assigned,
                    SUM(CASE WHEN availability_status = 'Busy'      THEN 1 ELSE 0 END) AS busy
                FROM Rescue_Teams
            `),
            pool.request().query(`SELECT COUNT(*) AS low_stock_items FROM vw_ResourceStock WHERE stock_alert = 'LOW STOCK'`),
            pool.request().query(`
                SELECT SUM(total_beds) AS total_beds, SUM(available_beds) AS available_beds
                FROM Hospitals
            `),
            pool.request().query(`
                SELECT 
                    SUM(CASE WHEN transaction_type = 'Donation' THEN amount ELSE 0 END) AS total_donations,
                    SUM(CASE WHEN transaction_type = 'Expense'  THEN amount ELSE 0 END) AS total_expenses
                FROM Financial_Transactions
            `)
        ]);

        res.json({
            success: true,
            data: {
                reports:   reports.recordset[0],
                teams:     teams.recordset[0],
                resources: resources.recordset[0],
                hospitals: hospitals.recordset[0],
                finance:   finance.recordset[0],
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/dashboard/incident-stats  — uses vw_IncidentStatistics view
const getIncidentStats = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`SELECT * FROM vw_IncidentStatistics`);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/dashboard/audit-trail  — admin only
const getAuditTrail = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT TOP 200 * FROM vw_AuditTrail ORDER BY logged_at DESC
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getOverview, getIncidentStats, getAuditTrail };

const { getPool, sql } = require('../config/db');

// GET /api/reports  — get all reports (with filters)
const getAllReports = async (req, res) => {
    try {
        const pool = await getPool();
        const { severity, status, disaster_type } = req.query; // optional filters from URL

        let query = `
            SELECT 
                er.report_id, er.location, er.disaster_type, er.severity,
                er.status, er.reporter_contact, er.reported_at,
                de.event_name,
                rt.team_name, ta.status AS assignment_status
            FROM Emergency_Reports er
            LEFT JOIN Disaster_Events  de ON er.event_id  = de.event_id
            LEFT JOIN Team_Assignments ta ON er.report_id = ta.report_id 
                AND ta.status NOT IN ('Completed','Cancelled')
            LEFT JOIN Rescue_Teams rt ON ta.team_id = rt.team_id
            WHERE 1=1
        `;

        const request = pool.request();

        // Dynamically add filters if provided
        if (severity) {
            query += ' AND er.severity = @severity';
            request.input('severity', sql.VarChar, severity);
        }
        if (status) {
            query += ' AND er.status = @status';
            request.input('status', sql.VarChar, status);
        }
        if (disaster_type) {
            query += ' AND er.disaster_type = @disaster_type';
            request.input('disaster_type', sql.VarChar, disaster_type);
        }

        query += ' ORDER BY er.reported_at DESC';

        const result = await request.query(query);
        res.json({ success: true, count: result.recordset.length, data: result.recordset });

    } catch (err) {
        console.error('getAllReports error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// GET /api/reports/:id  — get one report by ID
const getReportById = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('report_id', sql.Int, req.params.id)
            .query(`
                SELECT er.*, de.event_name, de.status AS event_status
                FROM Emergency_Reports er
                LEFT JOIN Disaster_Events de ON er.event_id = de.event_id
                WHERE er.report_id = @report_id
            `);

        if (!result.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Report not found.' });
        }
        res.json({ success: true, data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// POST /api/reports  — submit a new emergency report (PUBLIC — no login needed)
const createReport = async (req, res) => {
    const { location, disaster_type, severity, reporter_contact, event_id } = req.body;

    if (!location || !disaster_type || !severity) {
        return res.status(400).json({ 
            success: false, 
            message: 'Location, disaster type, and severity are required.' 
        });
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('event_id',         sql.Int,     event_id || null)
            .input('location',         sql.VarChar, location)
            .input('disaster_type',    sql.VarChar, disaster_type)
            .input('severity',         sql.VarChar, severity)
            .input('reporter_contact', sql.VarChar, reporter_contact || null)
            .query(`
                INSERT INTO Emergency_Reports 
                    (event_id, location, disaster_type, severity, reporter_contact, status)
                OUTPUT INSERTED.report_id, INSERTED.reported_at
                VALUES 
                    (@event_id, @location, @disaster_type, @severity, @reporter_contact, 'Pending')
            `);

        res.status(201).json({ 
            success: true, 
            message: 'Emergency report submitted successfully.',
            data: result.recordset[0]
        });
    } catch (err) {
        console.error('createReport error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// PATCH /api/reports/:id/status  — update report status
const updateReportStatus = async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['Pending','Assigned','InProgress','Resolved','Closed'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    try {
        const pool = await getPool();
        await pool.request()
            .input('report_id', sql.Int,     req.params.id)
            .input('status',    sql.VarChar, status)
            .query(`UPDATE Emergency_Reports SET status = @status WHERE report_id = @report_id`);

        res.json({ success: true, message: `Report status updated to ${status}.` });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getAllReports, getReportById, createReport, updateReportStatus };
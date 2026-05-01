const { getPool, sql } = require('../config/db');

// GET /api/approvals/pending  — uses vw_PendingApprovals view
const getPendingApprovals = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`SELECT * FROM vw_PendingApprovals ORDER BY requested_at ASC`);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/approvals/:id/decide  — approve or reject (calls stored proc)
const processApproval = async (req, res) => {
    const { decision, notes } = req.body;
    if (!decision || !['Approved','Rejected'].includes(decision)) {
        return res.status(400).json({ success: false, message: 'decision must be Approved or Rejected.' });
    }
    try {
        const pool = await getPool();
        await pool.request()
            .input('request_id',  sql.Int,     req.params.id)
            .input('approved_by', sql.Int,     req.user.user_id)
            .input('decision',    sql.VarChar, decision)
            .input('notes',       sql.NVarChar, notes || null)
            .execute('sp_ProcessApproval');

        res.json({ success: true, message: `Request ${decision} successfully.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/approvals/history  — full approval history
const getApprovalHistory = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT ar.*, 
                   u1.username AS requested_by_name,
                   u2.username AS approved_by_name
            FROM Approval_Requests ar
            JOIN Users u1 ON ar.requested_by = u1.user_id
            LEFT JOIN Users u2 ON ar.approved_by = u2.user_id
            ORDER BY ar.requested_at DESC
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getPendingApprovals, processApproval, getApprovalHistory };

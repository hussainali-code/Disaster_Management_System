const { getPool, sql } = require('../config/db');

// GET /api/teams
const getAllTeams = async (req, res) => {
    try {
        const pool = await getPool();
        const { status, team_type } = req.query;
        let query = `SELECT * FROM Rescue_Teams WHERE 1=1`;
        const request = pool.request();
        if (status)    { query += ' AND availability_status = @status';    request.input('status',    sql.VarChar, status); }
        if (team_type) { query += ' AND team_type = @team_type';           request.input('team_type', sql.VarChar, team_type); }
        query += ' ORDER BY team_name';
        const result = await request.query(query);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/teams/status-board  — uses the view we created
const getStatusBoard = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`SELECT * FROM vw_RescueTeamStatus ORDER BY team_name`);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/teams/assign  — calls stored procedure sp_AssignRescueTeam
const assignTeam = async (req, res) => {
    const { team_id, report_id } = req.body;
    if (!team_id || !report_id) {
        return res.status(400).json({ success: false, message: 'team_id and report_id are required.' });
    }
    try {
        const pool = await getPool();
        // Call the stored procedure — it handles the full ACID transaction
        const result = await pool.request()
            .input('team_id',     sql.Int, team_id)
            .input('report_id',   sql.Int, report_id)
            .input('assigned_by', sql.Int, req.user.user_id)
            .execute('sp_AssignRescueTeam');

        res.json({ success: true, message: 'Team assigned successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/teams/:id/complete — mark assignment as complete
const completeAssignment = async (req, res) => {
    const { assignment_id } = req.body;
    try {
        const pool = await getPool();
        await pool.request()
            .input('assignment_id', sql.Int, assignment_id)
            .query(`
                UPDATE Team_Assignments 
                SET status = 'Completed', completed_at = SYSDATETIME()
                WHERE assignment_id = @assignment_id
            `);
        res.json({ success: true, message: 'Assignment marked complete.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/teams  — create a new rescue team (Admin only)
const createTeam = async (req, res) => {
    const { team_name, team_type, current_location } = req.body;
    if (!team_name || !team_type || !current_location) {
        return res.status(400).json({ success: false, message: 'team_name, team_type and current_location are required.' });
    }
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('team_name',        sql.VarChar, team_name)
            .input('team_type',        sql.VarChar, team_type)
            .input('current_location', sql.VarChar, current_location)
            .query(`
                INSERT INTO Rescue_Teams (team_name, team_type, current_location)
                OUTPUT INSERTED.team_id, INSERTED.team_name
                VALUES (@team_name, @team_type, @current_location)
            `);
        res.status(201).json({ success: true, message: 'Team created.', data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getAllTeams, getStatusBoard, assignTeam, completeAssignment, createTeam };

const { getPool, sql } = require('../config/db');

// GET /api/events  — list all disaster events (for dropdowns)
const getAllEvents = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`SELECT event_id, event_name, disaster_type, location, start_date, status FROM Disaster_Events ORDER BY start_date DESC`);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/events  — create a disaster event (Admin / Operator)
const createEvent = async (req, res) => {
    const { event_name, disaster_type, location, start_date, status } = req.body;
    if (!event_name || !disaster_type || !location || !start_date) {
        return res.status(400).json({ success: false, message: 'event_name, disaster_type, location and start_date are required.' });
    }
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('event_name',    sql.VarChar, event_name)
            .input('disaster_type', sql.VarChar, disaster_type)
            .input('location',      sql.VarChar, location)
            .input('start_date',    sql.Date,    start_date)
            .input('status',        sql.VarChar, status || 'Active')
            .query(`
                INSERT INTO Disaster_Events (event_name, disaster_type, location, start_date, status)
                OUTPUT INSERTED.event_id, INSERTED.event_name
                VALUES (@event_name, @disaster_type, @location, @start_date, @status)
            `);
        res.status(201).json({ success: true, message: 'Disaster event created.', data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/events/:id/status — update event status
const updateEventStatus = async (req, res) => {
    const { status } = req.body;
    if (!['Active','Contained','Closed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    try {
        const pool = await getPool();
        await pool.request()
            .input('event_id', sql.Int,     req.params.id)
            .input('status',   sql.VarChar, status)
            .query(`UPDATE Disaster_Events SET status = @status WHERE event_id = @event_id`);
        res.json({ success: true, message: `Event status updated to ${status}.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getAllEvents, createEvent, updateEventStatus };

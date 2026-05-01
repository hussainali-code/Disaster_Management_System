const { getPool, sql } = require('../config/db');

// GET /api/finance  — all transactions
const getAllTransactions = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT ft.*, de.event_name, u.username AS recorded_by_name
            FROM Financial_Transactions ft
            JOIN Disaster_Events de ON ft.event_id    = de.event_id
            JOIN Users u            ON ft.recorded_by = u.user_id
            ORDER BY ft.transaction_date DESC
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/finance/summary  — uses vw_FinancialSummaryByEvent view
const getFinancialSummary = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`SELECT * FROM vw_FinancialSummaryByEvent ORDER BY event_id`);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/finance  — record a transaction
const createTransaction = async (req, res) => {
    const { event_id, transaction_type, amount, description, source_or_recipient } = req.body;
    if (!event_id || !transaction_type || !amount || !description) {
        return res.status(400).json({ success: false, message: 'event_id, transaction_type, amount and description are required.' });
    }
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('event_id',            sql.Int,        event_id)
            .input('recorded_by',         sql.Int,        req.user.user_id)
            .input('transaction_type',    sql.VarChar,    transaction_type)
            .input('amount',              sql.Decimal,    amount)
            .input('description',         sql.VarChar,    description)
            .input('source_or_recipient', sql.VarChar,    source_or_recipient || null)
            .query(`
                INSERT INTO Financial_Transactions 
                    (event_id, recorded_by, transaction_type, amount, description, source_or_recipient)
                OUTPUT INSERTED.transaction_id, INSERTED.transaction_date
                VALUES 
                    (@event_id, @recorded_by, @transaction_type, @amount, @description, @source_or_recipient)
            `);
        res.status(201).json({ success: true, message: 'Transaction recorded.', data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getAllTransactions, getFinancialSummary, createTransaction };

const { getPool, sql } = require('../config/db');

// GET /api/resources  — uses vw_ResourceStock view
const getAllResources = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`SELECT * FROM vw_ResourceStock ORDER BY stock_alert DESC, resource_name`);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/resources/request  — request resource allocation (calls stored proc)
const requestAllocation = async (req, res) => {
    const { resource_id, event_id, quantity_requested } = req.body;
    if (!resource_id || !event_id || !quantity_requested) {
        return res.status(400).json({ success: false, message: 'resource_id, event_id and quantity_requested are required.' });
    }
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('resource_id',        sql.Int, resource_id)
            .input('event_id',           sql.Int, event_id)
            .input('requested_by',       sql.Int, req.user.user_id)
            .input('quantity_requested', sql.Int, quantity_requested)
            .execute('sp_RequestResourceAllocation');

        res.status(201).json({ success: true, message: 'Allocation request submitted for approval.', data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/resources/allocations  — view all allocations
const getAllocations = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT ra.*, r.resource_name, r.resource_type, de.event_name,
                   u.username AS requested_by_name
            FROM Resource_Allocations ra
            JOIN Resources r          ON ra.resource_id  = r.resource_id
            JOIN Disaster_Events de   ON ra.event_id     = de.event_id
            JOIN Users u              ON ra.requested_by = u.user_id
            ORDER BY ra.requested_at DESC
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/resources  — add a new resource to the warehouse (Admin / Warehouse Manager)
const createResource = async (req, res) => {
    const { resource_name, resource_type, quantity_available, low_stock_threshold, unit } = req.body;
    if (!resource_name || !resource_type || !unit) {
        return res.status(400).json({ success: false, message: 'resource_name, resource_type and unit are required.' });
    }
    try {
        const pool = await getPool();
        // Central warehouse is always warehouse_id = 1
        const result = await pool.request()
            .input('resource_name',       sql.VarChar, resource_name)
            .input('resource_type',       sql.VarChar, resource_type)
            .input('quantity_available',  sql.Int,     quantity_available  || 0)
            .input('low_stock_threshold', sql.Int,     low_stock_threshold || 50)
            .input('unit',                sql.VarChar, unit)
            .query(`
                INSERT INTO Resources (warehouse_id, resource_name, resource_type, quantity_available, low_stock_threshold, unit)
                OUTPUT INSERTED.resource_id, INSERTED.resource_name
                VALUES (1, @resource_name, @resource_type, @quantity_available, @low_stock_threshold, @unit)
            `);
        res.status(201).json({ success: true, message: 'Resource added.', data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/resources/allocations/:id/dispatch — dispatch an approved allocation (Warehouse Manager / Admin)
const dispatchAllocation = async (req, res) => {
    try {
        const pool = await getPool();
        // Verify it's in Approved state first
        const check = await pool.request()
            .input('allocation_id', sql.Int, req.params.id)
            .query(`SELECT status FROM Resource_Allocations WHERE allocation_id = @allocation_id`);

        if (!check.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Allocation not found.' });
        }
        if (check.recordset[0].status !== 'Approved') {
            return res.status(400).json({ success: false, message: 'Only Approved allocations can be dispatched.' });
        }

        await pool.request()
            .input('allocation_id', sql.Int, req.params.id)
            .input('approved_by',   sql.Int, req.user.user_id)
            .query(`
                UPDATE Resource_Allocations
                SET status             = 'Dispatched',
                    quantity_dispatched = quantity_requested,
                    approved_by        = @approved_by
                WHERE allocation_id = @allocation_id
            `);

        res.json({ success: true, message: 'Allocation dispatched. Warehouse stock updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/resources/:id/restock — update quantity in warehouse (Admin / Warehouse Manager)
const updateResourceStock = async (req, res) => {
    const { quantity_to_add } = req.body;
    if (!quantity_to_add || isNaN(quantity_to_add) || Number(quantity_to_add) <= 0) {
        return res.status(400).json({ success: false, message: 'quantity_to_add must be a positive number.' });
    }
    try {
        const pool = await getPool();
        const check = await pool.request()
            .input('resource_id', sql.Int, req.params.id)
            .query(`SELECT resource_id, resource_name, quantity_available FROM Resources WHERE resource_id = @resource_id`);

        if (!check.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Resource not found.' });
        }

        const result = await pool.request()
            .input('resource_id', sql.Int,  req.params.id)
            .input('qty',         sql.Int,  Number(quantity_to_add))
            .query(`
                UPDATE Resources
                SET quantity_available = quantity_available + @qty
                OUTPUT INSERTED.resource_id, INSERTED.resource_name, INSERTED.quantity_available
                WHERE resource_id = @resource_id
            `);

        // Audit log the restock
        await pool.request()
            .input('user_id',    sql.Int,      req.user.user_id)
            .input('record_id',  sql.Int,      req.params.id)
            .input('new_value',  sql.NVarChar, `Restocked ${check.recordset[0].resource_name} +${quantity_to_add} units. New qty: ${result.recordset[0].quantity_available}`)
            .query(`
                INSERT INTO Audit_Log (user_id, action, table_name, record_id, new_value)
                VALUES (@user_id, 'UPDATE', 'Resources', @record_id, @new_value)
            `);

        res.json({ success: true, message: `Stock updated. New quantity: ${result.recordset[0].quantity_available}`, data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getAllResources, requestAllocation, getAllocations, createResource, dispatchAllocation, updateResourceStock };

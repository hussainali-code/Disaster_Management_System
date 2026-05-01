const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/db');

// GET /api/users — list all users (Admin only)
const getAllUsers = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT user_id, username, email, role, is_active, created_at
            FROM Users
            ORDER BY created_at DESC
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error('getAllUsers error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// POST /api/users — create a new user (Admin only)
const createUser = async (req, res) => {
    const { username, email, password, role } = req.body;
    const validRoles = ['Administrator', 'Emergency_Operator', 'Field_Officer', 'Warehouse_Manager', 'Finance_Officer'];

    if (!username || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'username, email, password, and role are required.' });
    }
    if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    try {
        const pool = await getPool();

        // Check if username or email already exists
        const existing = await pool.request()
            .input('username', sql.VarChar, username)
            .input('email', sql.VarChar, email)
            .query(`SELECT user_id FROM Users WHERE username = @username OR email = @email`);

        if (existing.recordset.length > 0) {
            return res.status(409).json({ success: false, message: 'Username or email already exists.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .input('password_hash', sql.VarChar, password_hash)
            .input('email', sql.VarChar, email)
            .input('role', sql.VarChar, role)
            .query(`
                INSERT INTO Users (username, password_hash, email, role)
                OUTPUT INSERTED.user_id, INSERTED.username, INSERTED.email, INSERTED.role, INSERTED.is_active, INSERTED.created_at
                VALUES (@username, @password_hash, @email, @role)
            `);

        // Audit log
        await pool.request()
            .input('user_id', sql.Int, req.user.user_id)
            .input('record_id', sql.Int, result.recordset[0].user_id)
            .query(`
                INSERT INTO Audit_Log (user_id, action, table_name, record_id, new_value)
                VALUES (@user_id, 'INSERT', 'Users', @record_id, 'New user created: ${username} (${role})')
            `);

        res.status(201).json({ success: true, message: 'User created successfully.', data: result.recordset[0] });
    } catch (err) {
        console.error('createUser error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// PATCH /api/users/:id — update user details (Admin only)
const updateUser = async (req, res) => {
    const { email, role } = req.body;
    const validRoles = ['Administrator', 'Emergency_Operator', 'Field_Officer', 'Warehouse_Manager', 'Finance_Officer'];

    if (!email && !role) {
        return res.status(400).json({ success: false, message: 'Provide at least email or role to update.' });
    }
    if (role && !validRoles.includes(role)) {
        return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    try {
        const pool = await getPool();

        // Build dynamic update query
        let setClauses = [];
        const request = pool.request().input('user_id', sql.Int, req.params.id);

        if (email) {
            setClauses.push('email = @email');
            request.input('email', sql.VarChar, email);
        }
        if (role) {
            setClauses.push('role = @role');
            request.input('role', sql.VarChar, role);
        }

        await request.query(`UPDATE Users SET ${setClauses.join(', ')} WHERE user_id = @user_id`);

        // Audit log
        await pool.request()
            .input('admin_id', sql.Int, req.user.user_id)
            .input('record_id', sql.Int, req.params.id)
            .input('new_value', sql.NVarChar, `Updated: ${email ? 'email=' + email : ''} ${role ? 'role=' + role : ''}`.trim())
            .query(`
                INSERT INTO Audit_Log (user_id, action, table_name, record_id, new_value)
                VALUES (@admin_id, 'UPDATE', 'Users', @record_id, @new_value)
            `);

        res.json({ success: true, message: 'User updated successfully.' });
    } catch (err) {
        console.error('updateUser error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// PATCH /api/users/:id/toggle-status — activate or deactivate a user (Admin only)
const toggleUserStatus = async (req, res) => {
    try {
        const pool = await getPool();

        // Prevent admin from deactivating themselves
        if (parseInt(req.params.id) === req.user.user_id) {
            return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
        }

        // Get current status
        const current = await pool.request()
            .input('user_id', sql.Int, req.params.id)
            .query(`SELECT is_active, username FROM Users WHERE user_id = @user_id`);

        if (!current.recordset[0]) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const newStatus = current.recordset[0].is_active ? 0 : 1;
        const statusLabel = newStatus ? 'activated' : 'deactivated';

        await pool.request()
            .input('user_id', sql.Int, req.params.id)
            .input('is_active', sql.Bit, newStatus)
            .query(`UPDATE Users SET is_active = @is_active WHERE user_id = @user_id`);

        // Audit log
        await pool.request()
            .input('admin_id', sql.Int, req.user.user_id)
            .input('record_id', sql.Int, req.params.id)
            .input('new_value', sql.NVarChar, `User ${current.recordset[0].username} ${statusLabel}`)
            .query(`
                INSERT INTO Audit_Log (user_id, action, table_name, record_id, new_value)
                VALUES (@admin_id, 'UPDATE', 'Users', @record_id, @new_value)
            `);

        res.json({ success: true, message: `User ${statusLabel} successfully.` });
    } catch (err) {
        console.error('toggleUserStatus error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// PATCH /api/users/:id/reset-password — reset password (Admin only)
const resetPassword = async (req, res) => {
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    try {
        const pool = await getPool();

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(new_password, salt);

        await pool.request()
            .input('user_id', sql.Int, req.params.id)
            .input('password_hash', sql.VarChar, password_hash)
            .query(`UPDATE Users SET password_hash = @password_hash WHERE user_id = @user_id`);

        // Audit log
        await pool.request()
            .input('admin_id', sql.Int, req.user.user_id)
            .input('record_id', sql.Int, req.params.id)
            .query(`
                INSERT INTO Audit_Log (user_id, action, table_name, record_id, new_value)
                VALUES (@admin_id, 'UPDATE', 'Users', @record_id, 'Password reset by admin')
            `);

        res.json({ success: true, message: 'Password reset successfully.' });
    } catch (err) {
        console.error('resetPassword error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getAllUsers, createUser, updateUser, toggleUserStatus, resetPassword };

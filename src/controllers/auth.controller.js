const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');
require('dotenv').config();

// POST /api/auth/login
// Body: { username, password }
const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username and password are required.' 
        });
    }

    try {
        const pool = await getPool();

        // Find the user in the database by username
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query(`
                SELECT user_id, username, password_hash, email, role, is_active 
                FROM Users 
                WHERE username = @username
            `);

        const user = result.recordset[0];

        // User not found
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password.' 
            });
        }

        // Account disabled
        if (!user.is_active) {
            return res.status(403).json({ 
                success: false, 
                message: 'Your account has been deactivated. Contact admin.' 
            });
        }

        // Compare the entered password with the stored hash
        // bcrypt.compare does this securely (never compare plain text!)
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password.' 
            });
        }

        // Create a JWT token containing the user's id and role
        // This token is sent back to React and stored there
        // React will attach it to every future request
        const token = jwt.sign(
            { 
                user_id: user.user_id, 
                username: user.username, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN } // token expires in 8 hours
        );

        // Log the login in audit table
        await pool.request()
            .input('user_id', sql.Int, user.user_id)
            .input('table_name', sql.VarChar, 'Users')
            .input('record_id', sql.Int, user.user_id)
            .query(`
                INSERT INTO Audit_Log (user_id, action, table_name, record_id, new_value)
                VALUES (@user_id, 'LOGIN', @table_name, @record_id, 'User logged in')
            `);

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
            }
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

// GET /api/auth/me  (get currently logged in user's profile)
const getMe = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, req.user.user_id)
            .query(`
                SELECT user_id, username, email, role, is_active, created_at 
                FROM Users WHERE user_id = @user_id
            `);

        if (!result.recordset[0]) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.json({ success: true, user: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { login, getMe };
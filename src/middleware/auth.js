const jwt = require('jsonwebtoken');
require('dotenv').config();

// This function runs BEFORE every protected route
// It checks: "Did this request come with a valid login token?"
const verifyToken = (req, res, next) => {
    // The token comes in the request header like:
    // Authorization: Bearer eyJhbGci...
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // grab the part after "Bearer "

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. No token provided. Please login first.' 
        });
    }

    try {
        // jwt.verify checks the token is genuine and not expired
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // attach user info to the request so controllers can use it
        next();             // all good — move on to the actual route handler
    } catch (err) {
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid or expired token. Please login again.' 
        });
    }
};

module.exports = { verifyToken };
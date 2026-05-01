// RBAC = Role Based Access Control
// Usage: authorizeRoles('Administrator', 'Finance_Officer')
// This returns a middleware function that checks if the logged-in user
// has one of the allowed roles

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user was set by verifyToken middleware (runs before this)
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(403).json({ 
                success: false, 
                message: 'No role found on your account.' 
            });
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                success: false, 
                message: `Access denied. Your role (${userRole}) cannot perform this action.` 
            });
        }

        next(); // role is allowed — continue
    };
};

// Convenience: pre-built role groups you'll use across routes
const ROLES = {
    ADMIN:     'Administrator',
    OPERATOR:  'Emergency_Operator',
    FIELD:     'Field_Officer',
    WAREHOUSE: 'Warehouse_Manager',
    FINANCE:   'Finance_Officer',
};

module.exports = { authorizeRoles, ROLES };
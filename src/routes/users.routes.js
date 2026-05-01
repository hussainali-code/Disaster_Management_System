const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUser, toggleUserStatus, resetPassword } = require('../controllers/users.controller');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles, ROLES } = require('../middleware/rbac');

// All user management routes are Admin-only
router.get('/',                    verifyToken, authorizeRoles(ROLES.ADMIN), getAllUsers);
router.post('/',                   verifyToken, authorizeRoles(ROLES.ADMIN), createUser);
router.patch('/:id',               verifyToken, authorizeRoles(ROLES.ADMIN), updateUser);
router.patch('/:id/toggle-status', verifyToken, authorizeRoles(ROLES.ADMIN), toggleUserStatus);
router.patch('/:id/reset-password',verifyToken, authorizeRoles(ROLES.ADMIN), resetPassword);

module.exports = router;

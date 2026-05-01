// ---- approvals.routes.js ----
const express = require('express');
const router = express.Router();
const { getPendingApprovals, processApproval, getApprovalHistory } = require('../controllers/approvals.controller');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles, ROLES } = require('../middleware/rbac');

router.get('/pending',         verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.FINANCE, ROLES.OPERATOR), getPendingApprovals);
router.get('/history',         verifyToken, authorizeRoles(ROLES.ADMIN), getApprovalHistory);
router.post('/:id/decide',     verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.FINANCE, ROLES.OPERATOR), processApproval);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getOverview, getIncidentStats, getAuditTrail } = require('../controllers/dashboard.controller');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles, ROLES } = require('../middleware/rbac');

router.get('/overview',        verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR, ROLES.FINANCE, ROLES.WAREHOUSE, ROLES.FIELD), getOverview);
router.get('/incident-stats',  verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR), getIncidentStats);
router.get('/audit-trail',     verifyToken, authorizeRoles(ROLES.ADMIN), getAuditTrail);

module.exports = router;

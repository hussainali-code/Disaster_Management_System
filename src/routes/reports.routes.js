const express = require('express');
const router = express.Router();
const { getAllReports, getReportById, createReport, updateReportStatus } = require('../controllers/reports.controller');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles, ROLES } = require('../middleware/rbac');

// PUBLIC — citizens submit reports without logging in
router.post('/', createReport);

// PROTECTED — only staff can view and manage reports
router.get('/',     verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR, ROLES.FIELD), getAllReports);
router.get('/:id',  verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR, ROLES.FIELD), getReportById);
router.patch('/:id/status', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR), updateReportStatus);

module.exports = router;
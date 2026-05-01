const express = require('express');
const router = express.Router();
const { getAllTransactions, getFinancialSummary, createTransaction } = require('../controllers/finance.controller');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles, ROLES } = require('../middleware/rbac');

router.get('/',         verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.FINANCE), getAllTransactions);
router.get('/summary',  verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.FINANCE), getFinancialSummary);
router.post('/',        verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.FINANCE), createTransaction);

module.exports = router;

// ---- teams.routes.js ----
const express = require('express');
const router = express.Router();
const { getAllTeams, getStatusBoard, assignTeam, completeAssignment, createTeam } = require('../controllers/teams.controller');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles, ROLES } = require('../middleware/rbac');

router.get('/',              verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR, ROLES.FIELD), getAllTeams);
router.get('/status-board',  verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR, ROLES.FIELD), getStatusBoard);
router.post('/',             verifyToken, authorizeRoles(ROLES.ADMIN), createTeam);
router.post('/assign',       verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR), assignTeam);
router.patch('/complete',    verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR, ROLES.FIELD), completeAssignment);

module.exports = router;

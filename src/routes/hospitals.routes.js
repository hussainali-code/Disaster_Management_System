const express = require('express');
const router = express.Router();
const { getAllHospitals, admitPatient, dischargePatient, getAllPatients } = require('../controllers/hospitals.controller');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles, ROLES } = require('../middleware/rbac');

router.get('/',               verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR, ROLES.FIELD), getAllHospitals);
router.get('/patients',       verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR, ROLES.FIELD), getAllPatients);
router.post('/admit',         verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR), admitPatient);
router.patch('/discharge/:id',verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR), dischargePatient);

module.exports = router;

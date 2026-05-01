const express = require('express');
const router  = express.Router();
const { getAllEvents, createEvent, updateEventStatus } = require('../controllers/events.controller');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles, ROLES } = require('../middleware/rbac');

router.get('/',               verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR, ROLES.FIELD, ROLES.WAREHOUSE, ROLES.FINANCE), getAllEvents);
router.post('/',              verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR), createEvent);
router.patch('/:id/status',   verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.OPERATOR), updateEventStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getAllResources, requestAllocation, getAllocations, createResource, dispatchAllocation, updateResourceStock } = require('../controllers/resources.controller');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles, ROLES } = require('../middleware/rbac');

router.get('/',                          verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.OPERATOR), getAllResources);
router.get('/allocations',               verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.OPERATOR), getAllocations);
router.post('/',                         verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE), createResource);
router.post('/request',                  verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.OPERATOR), requestAllocation);
router.patch('/allocations/:id/dispatch', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE), dispatchAllocation);
router.patch('/:id/restock',              verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.WAREHOUSE), updateResourceStock);

module.exports = router;

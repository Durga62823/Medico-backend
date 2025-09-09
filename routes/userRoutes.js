const express = require('express');
const {
  getProfile,
  updateProfile,
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserPassword,
  updateUserRole,
  deleteUser,
  getStaffList
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const {
  userIdParamSchema,
  createUserSchema,
  updateUserSchema,
  updateUserPasswordSchema,
  updateUserRoleSchema,
  getAllUsersQuerySchema,
  getStaffQuerySchema
} = require('../utils/validators');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin-only user management
router.get('/', protect, authorize('admin'), validate(getAllUsersQuerySchema, 'query'), getAllUsers);
router.post('/', protect, authorize('admin'), validate(createUserSchema), createUser);
router.get('/staff', protect, authorize('Admin','Doctor','Nurse'), validate(getStaffQuerySchema, 'query'), getStaffList);
router.get('/:id', protect, authorize('admin'), validate(userIdParamSchema, 'params'), getUserById);
router.put('/:id', protect, authorize('admin'), validate(userIdParamSchema, 'params'), validate(updateUserSchema), updateUser);
router.put('/:id/password', protect, authorize('admin'), validate(userIdParamSchema, 'params'), validate(updateUserPasswordSchema), updateUserPassword);
router.put('/:id/role', protect, authorize('admin'), validate(userIdParamSchema, 'params'), validate(updateUserRoleSchema), updateUserRole);
router.delete('/:id', protect, authorize('admin'), validate(userIdParamSchema, 'params'), deleteUser);
// routes/userRoutes.js


module.exports = router;
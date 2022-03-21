const { check } = require('express-validator');
const UserService = require('../user/UserService');

exports.RegisterValidation = [
  check('username')
    .notEmpty()
    .withMessage('Username can not be null')
    .bail() // if username is null then do not go on
    .isLength({ min: 4, max: 32 })
    .withMessage('Must have min 4 and max 32 characters'),
  check('email')
    .notEmpty()
    .withMessage('Email can not be null')
    .bail()
    .isEmail()
    .withMessage('Email is not valid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findyByEmail(email);
      if (user) {
        throw new Error('Email in use');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('Password can not be null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

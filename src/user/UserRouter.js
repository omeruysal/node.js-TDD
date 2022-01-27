const express = require('express');
const router = express.Router();
const UserService = require('../user/UserService');
const { check, validationResult } = require('express-validator');
const User = require('./User');

router.post(
  '/api/1.0/users',
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
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors.array().forEach((error) => (validationErrors[error.param] = error.msg));
      return res.status(400).send({ validationErrors: validationErrors });
    }
    await UserService.save(req.body);
    return res.send({ message: 'User created' });
  }
);

module.exports = router;

// const validateUsername = (req, res, next) => {
//     const user = req.body;
//     if (user.username === null) {
//       return res.status(400).send({
//         validationErrors: {
//           username: 'Username can not be null',
//         },
//       });
//     }
//     next();
//   };

//   const validateEmail = (req, res, next) => {
//     const user = req.body;
//     if (user.email === null) {
//       return res.status(400).send({
//         validationErrors: {
//           email: 'Email can not be null',
//         },
//       });
//     }
//     next();
//   };

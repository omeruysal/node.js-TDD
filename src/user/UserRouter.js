const express = require('express');
const { validationResult } = require('express-validator');
const ValidationException = require('../error/ValidationException');
const { RegisterValidation } = require('../middleware/validation');
const router = express.Router();
const UserService = require('../user/UserService');

router.post('/api/1.0/users', RegisterValidation, async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    next(new ValidationException(errors.array()));
  }

  try {
    await UserService.save(req.body);

    return res.send({ message: 'User created' });
  } catch (error) {
    next(error);
  }
});

router.post('/api/1.0/users/token/:token', async (req, res, next) => {
  try {
    const token = req.params.token;
    await UserService.activate(token);
    return res.send({ message: 'Account is activated' });
  } catch (error) {
    next(error);
  }
});

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

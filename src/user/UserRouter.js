const express = require('express');
const { validationResult } = require('express-validator');
const { RegisterValidation } = require('../middleware/validation');
const router = express.Router();
const UserService = require('../user/UserService');

router.post('/api/1.0/users', RegisterValidation, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = {};
    errors.array().forEach((error) => (validationErrors[error.param] = error.msg));
    return res.status(400).send({ validationErrors: validationErrors });
  }

  await UserService.save(req.body);

  return res.send({ message: 'User created' });
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

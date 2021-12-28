const express = require('express');
const router = express.Router();
const UserService = require('../user/UserService');

router.post('/api/1.0/users', async (req, res) => {
  try {
    await UserService.save(req.body);
    return res.send({ message: 'User created' });
  } catch (error) {}
});

module.exports = router;

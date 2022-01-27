const User = require('../user/User');
const bcrypt = require('bcrypt');
const { where } = require('sequelize/dist');

const save = async (body) => {
  const hash = await bcrypt.hash(body.password, 10);
  const user = { ...body, password: hash };
  await User.create(user);
};

const findyByEmail = async (email) => {
  return await User.findOne({ where: { email } });
};
module.exports = { save, findyByEmail };

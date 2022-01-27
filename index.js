const app = require('./src/app');
const sequelize = require('./src/config/database');

sequelize.sync({ force: true }); // setting true for force to db to sync db with the latest updates and clean db every time when we run project

app.listen(3000, () => {
  console.log('Server is running');
});

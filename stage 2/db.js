import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('postgres://postgres:3421@localhost:4601/stores', {
  dialect: 'postgres',
  logging: false,
});

export default sequelize;
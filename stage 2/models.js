// models.js
import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const Store = sequelize.define('Store', {
  name: {type: DataTypes.STRING,unique: true,allowNull: false,},
  location: {type: DataTypes.TEXT,allowNull: false,},
})
const Product = sequelize.define('Product', {
  name: {type: DataTypes.STRING,allowNull: false,unique: true,},
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
})
const StockMovement = sequelize.define('StockMovement', {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('restock', 'sale', 'manual remove'),
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: sequelize.NOW,
  },
});
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const ApiLog = sequelize.define('ApiLog', {
  endpoint: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: sequelize.NOW,
  },
});
Store.hasMany(Product, { onDelete: 'CASCADE' });
Product.belongsTo(Store);

Product.hasMany(StockMovement, { onDelete: 'CASCADE' });
StockMovement.belongsTo(Product);

User.hasMany(ApiLog);
ApiLog.belongsTo(User);
User.hasMany(Store);
Store.belongsTo(User, { onDelete: 'CASCADE' });
sequelize.sync({ alter: true }).then(() => {
  console.log('Tables are synchronized');
});

export { Store, Product, StockMovement, User, ApiLog };

import { Sequelize, Op } from 'sequelize';
import { createClient } from 'redis';

const writeDatabaseConfig = {
  dialect: 'postgres',
  host: process.env.WRITE_DB_HOST || 'localhost',
  port: process.env.WRITE_DB_PORT || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '3421',
  database: process.env.DB_NAME || 'inventory',
  logging: false
};
const readDatabaseConfig = {
  dialect: 'postgres',
  host: process.env.READ_DB_HOST || 'localhost',
  port: process.env.READ_DB_PORT || 5433,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '3421',
  database: process.env.DB_NAME || 'inventory',
  logging: false
};
const writeDb = new Sequelize(writeDatabaseConfig);
const readDb = new Sequelize(readDatabaseConfig);
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.on('error', (err) => console.log('Redis Client Error', err));
(async () => {
  await redisClient.connect();
})();
export const getProductDetails = async (productId) => {
  const cacheKey = `product:${productId}`;
  const cachedProduct = await redisClient.get(cacheKey);
  if (cachedProduct) {
    return JSON.parse(cachedProduct);
  }
  const product = await Product.findByPk(productId, {
    sequelize: readDb
  });
  
  if (product) {
    await redisClient.set(cacheKey, JSON.stringify(product), {
      EX: 300
    });
  }
  return product;
};
export const invalidateProductCache = async (productId) => {
  const cacheKey = `product:${productId}`;
  await redisClient.del(cacheKey);
};
export { writeDb as default, readDb, redisClient, Op };
import amqp from 'amqplib';
import { Product, Store } from './models';
let channel;
let connection;
export const setupMessageQueue = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertQueue('inventory-updates', { durable: true });
    await channel.assertQueue('audit-logs', { durable: true });
    console.log('Message queue connected');
    return channel;
  } catch (error) {
    console.error('Message queue connection error:', error);
    throw error;
  }
};
export const publishToQueue = async (queueName, message) => {
  try {
    if (!channel) await setupMessageQueue();
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
      persistent: true
    });
  } catch (error) {
    console.error(`Error publishing to queue ${queueName}:`, error);
    throw error;
  }
};
export const updateProductStockAsync = TryCatch(async (req, res) => {
  const { productId, quantity, status } = req.body;
  const user = await User.findOne({ where: { username: req.user } });

  if (!user) return res.status(404).json({ error: "User not found" });
  await publishToQueue('inventory-updates', {
    productId,
    quantity,
    status,
    userId: user.id,
    timestamp: new Date()
  });
  res.status(202).json({ 
    message: "Stock update request received and will be processed shortly",
    requestId: uuidv4()
  });
});
export const startInventoryWorker = async () => {
  try {
    if (!channel) await setupMessageQueue();
    
    channel.consume('inventory-updates', async (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());
          const { productId, quantity, status, userId } = data;
          const transaction = await sequelize.transaction();
          
          try {
            const product = await Product.findByPk(productId, { transaction });
            if (!product) throw new Error("Product not found");
            
            const store = await Store.findByPk(product.storeId, { transaction });
            if (store.userId !== userId) throw new Error("Unauthorized");
            
            product.quantity = quantity;
            await product.save({ transaction });
            await StockMovement.create({
              productId, 
              quantity, 
              status,
              timestamp: data.timestamp
            }, { transaction });
            await transaction.commit();
            await publishToQueue('audit-logs', {
              action: 'stock_update',
              productId,
              oldQuantity: product.quantity,
              newQuantity: quantity,
              status,
              userId,
              timestamp: data.timestamp
            });
            
          } catch (error) {
            await transaction.rollback();
            console.error('Error processing inventory update:', error);
            await publishToQueue('failed-updates', {
              original: data,
              error: error.message,
              timestamp: new Date()
            });
          }
        } catch (parseError) {
          console.error('Error parsing message:', parseError);
        }
        channel.ack(msg);
      }
    });
    console.log('Inventory worker started');
  } catch (error) {
    console.error('Error starting inventory worker:', error);
  }
};
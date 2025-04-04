import sequelize from "./db.js";
import { Store, Product, StockMovement, User, ApiLog } from "./models.js";
import { sendToken, TryCatch, ErrorHandler } from "./utility.js";
import { hash, compare } from "bcrypt";
const register = async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await hash(password, 10)
  const user = await User.create({
    username,
    password_hash: hashedPassword,
  });
  sendToken(res, user, 201, "User created successfully");
};
const login = TryCatch(async (req, res, next) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } })
  if (!user) return next(new ErrorHandler("Invalid username or password", 404))
  const isMatch = await compare(password, user.password_hash);
  if (!isMatch)
    return next(new ErrorHandler("Invalid username or password", 404))
  sendToken(res, user, 200, `Welcome back ${user.username}!`);
});
const addStore = TryCatch(async (req, res) => {
  const { name, location } = req.body;
  const user = await User.findOne({ where: { username: req.user } })
  if (!user) return res.status(404).json({ error: "User not found" });
  const store = await Store.create({ name, location, userId: user.id });
  res.status(201).json(store);
});
const listStores = TryCatch(async (req, res) => {
  const user = await User.findOne({ where: { username: req.user } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const stores = await Store.findAll({ where: { userId: user.id } });
  res.status(200).json(stores);
});
const addProduct = TryCatch(async (req, res) => {
  const { storeId, name, price, quantity } = req.body;
  const user = await User.findOne({ where: { username: req.user } });

  if (!user) return res.status(404).json({ error: "User not found" });

  const store = await Store.findOne({ where: { id: storeId, userId: user.id } });
  if (!store) return res.status(404).json({ error: "Store not found or unauthorized" });

  const product = await Product.create({ name, price, quantity, storeId });
  res.status(201).json(product);
});
const updateProductStock = TryCatch(async (req, res) => {
  const { productId, quantity, status } = req.body;
  const user = await User.findOne({ where: { username: req.user } });

  if (!user) return res.status(404).json({ error: "User not found" })
  const product = await Product.findOne({ where: { id: productId } })
  if (!product) return res.status(404).json({ error: "Product not found" })
  const store = await Store.findOne({ where: { id: product.storeId, userId: user.id } });
  if (!store) return res.status(403).json({ error: "Unauthorized to update product in this store" });
  product.quantity = quantity;
  await product.save();
  await StockMovement.create({ productId, quantity, status })
  res.status(200).json({ message: "Product quantity updated & stock movement logged", product });
});
const getStockReport = TryCatch(async (req, res) => {
  const { storeId, startDate, endDate } = req.query;
  const user = await User.findOne({ where: { username: req.user } });
  if (!user) return res.status(404).json({ error: "User not found" })
  const store = await Store.findOne({ where: { id: storeId, userId: user.id } });
  if (!store) return res.status(403).json({ error: "Unauthorized to access report for this store" });
  const report = await StockMovement.findAll({
    where: {
      timestamp: { [sequelize.Op.between]: [new Date(startDate), new Date(endDate)] },
    },
    include: { model: Product, where: { storeId } },
  });
  res.status(200).json(report);
});

export {
  register,
  login,
  addProduct,
  updateProductStock,
  addStore,
  listStores,
  getStockReport,
};

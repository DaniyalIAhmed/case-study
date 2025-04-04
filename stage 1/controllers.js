import sequelize from "./db.js";
import { Store, Product, StockMovement, User, ApiLog } from "./models.js";
import { sendToken, TryCatch, ErrorHandler } from "./utility.js";
import { hash, compare } from "bcrypt";
//user activities
const register = async (req, res) => {
    console.log(req.body);
    return res.send({success: true, message: 'Connected!'})
  const { username, password } = req.body;
  const hashedPassword = await hash(password, 10);
  const user = await User.create({
    username,
    password_hash: hashedPassword,
  });
  sendToken(res, user, 201, "User created successfully");
};
const login = TryCatch(async (req, res, next) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (!user) return next(new ErrorHandler("Invalid username or password", 404));
  const isMatch = await compare(password, user.password_hash);
  if (!isMatch)
    return next(new ErrorHandler("Invalid username or password", 404));
  sendToken(res, user, 200, `Welcome back ${user.username}!`);
});
//Store activities


export { register, login };

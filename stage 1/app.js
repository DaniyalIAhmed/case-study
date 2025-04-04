import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// import routes from "./routers.js";
import { errorMiddleware } from "./middlewares.js";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
// import sequelize from "./db.js";
// import { Store, Product, StockMovement, User, ApiLog } from "./models.js";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Request limit reached, please try again in about 15 minutes.",
});
dotenv.config({
  path: "./.env",
});
// app.use(limiter);
app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});
// app.use("/api", routes);
app.use("/api", (req,res)=>{console.log(req.body); return res.send({success: true, message: 'Connected!'})});
app.use(errorMiddleware);
console.log('Working till here')
const PORT = process.env.PORT || 4601;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

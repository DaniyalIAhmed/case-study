import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import { errorMiddleware } from "./middlewares.js";
import routes from "./routes.js";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Request limit reached, please try again in about 15 minutes.",
});
dotenv.config({
  path: "./.env",
});
app.use(limiter);
app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});
app.use("/api", routes);
app.use(errorMiddleware);
const PORT = process.env.PORT || 4601;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

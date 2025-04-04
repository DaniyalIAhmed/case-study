import jwt from "jsonwebtoken";
import { ErrorHandler } from "./utility.js";

const isAuthenticated = (req, res, next) => {
  const token = req.cookies["token"];
  if (!token) {
    return next(new ErrorHandler("Please login first", 401));
  }
  const data = jwt.verify(token, process.env.JWT_SECRET);
  req.user = data.username;
  next();
};
const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
export { isAuthenticated, errorMiddleware };
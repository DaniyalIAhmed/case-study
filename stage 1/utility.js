import jwt from "jsonwebtoken";

const sendToken = (res, user, code, message) => {
  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {});
  res
    .status(code)
    .cookie("token", token, {
      httpOnly: true,
      maxAge: 15 * 24 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
    })
    .json({
      success: true,
      message,
    });
};
const TryCatch = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    next(error);
  }
};

class ErrorHandler extends Error {
  constructor(m, statusCode) {
    super(m);
    this.statusCode = statusCode;
  }
}

export { sendToken, TryCatch, ErrorHandler };

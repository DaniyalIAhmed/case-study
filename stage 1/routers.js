import express from "express";
import {
  login,
  register,
} from "./controllers.js";
import { isAuthenticated } from "./middlewares.js";

const router = express.Router();

router.post("/user/register", register);
router.post("/user/login", login);

//Authenticated routes:
router.use(isAuthenticated);

export default router;

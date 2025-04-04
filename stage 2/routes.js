import express from "express";
import {
  login,
  register, 
  addStore, 
  listStores, 
  addProduct, 
  updateProductStock, 
  getStockReport 
} from "./controllers.js";
import { isAuthenticated, logApiRequest } from "./middlewares.js";

const router = express.Router();

router.post("/user/register", register);
router.post("/user/login", login);

//Authenticated routes:
router.use(isAuthenticated, logApiRequest);
router.post("/store/add", addStore);
router.get("/store/list", listStores);
router.post("/product/add", addProduct);
router.put("/product/update", updateProductStock);
router.get("/report", getStockReport);

export default router;

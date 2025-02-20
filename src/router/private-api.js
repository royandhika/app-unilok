import express from "express";
import { authMiddleware } from "../middleware/auth-middleware.js";
import userController from "../controller/user-controller.js";
import sessionController from "../controller/session-controller.js";

const privateRouter = new express.Router();
privateRouter.use(authMiddleware);
// users
privateRouter.get("/v1/users/me/profiles", userController.getUserProfile);
privateRouter.patch("/v1/users/me/profiles", userController.patchUserProfile);
privateRouter.post("/v1/users/me/addresses", userController.postUserAddress);
privateRouter.get("/v1/users/me/addresses", userController.getUserAddress);
privateRouter.get("/v1/users/me/addresses/:id", userController.getUserAddressId);
// sessions
privateRouter.post("/v1/users/me/sessions/refresh", sessionController.postSessionRefresh);
privateRouter.get("/v1/users/me/sessions", sessionController.getSession);
privateRouter.delete("/v1/users/me/sessions", sessionController.deleteSession);
privateRouter.delete("/v1/users/me/sessions/all", sessionController.deleteSessionAll);
// products
// post product
// patch product
// get product
// get product id
// orders
// post order
// get order
// get order id

export { privateRouter };

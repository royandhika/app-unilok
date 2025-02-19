import express from "express";
import userController from "../controller/user-controller.js";
import usersessionController from "../controller/usersession-controller.js";

const publicRouter = new express.Router();
// users
publicRouter.post("/v1/users", userController.postUser);
// sessions
publicRouter.post("/v1/users/me/sessions", usersessionController.postSession);
// properties
// publicRouter.get("/api/v1/properties", propertyController.getAll);
// publicRouter.get("/api/v1/properties/:propertyId", propertyController.get);

export { publicRouter };

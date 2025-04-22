import express from "express";
import userController from "../controller/user-controller.js";
import sessionController from "../controller/session-controller.js";

const publicRouter = new express.Router();
// users
publicRouter.post("/v1/users", userController.postUser);
publicRouter.get("/v1/users/verif/:token", userController.getUserVerif);
// sessions
publicRouter.post("/v1/users/me/sessions", sessionController.postSession);
// properties
// publicRouter.get("/api/v1/properties", propertyController.getAll);
// publicRouter.get("/api/v1/properties/:propertyId", propertyController.get);

export { publicRouter };

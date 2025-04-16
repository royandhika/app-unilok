import express from "express";
import { authMiddleware } from "../middleware/auth-middleware.js";
import userController from "../controller/user-controller.js";
import sessionController from "../controller/session-controller.js";
import productController from "../controller/product-controller.js";
import orderController from "../controller/order-controller.js";
import cartController from "../controller/cart-controller.js";
import reviewController from "../controller/review-controller.js";
import { avatarUploader, multerBody, productUploader } from "../middleware/multer-middleware.js";
import wishlistController from "../controller/wishlist-controller.js";

const privateRouter = new express.Router();
privateRouter.use(authMiddleware);
// users
privateRouter.patch("/v1/users", userController.patchUser);
privateRouter.get("/v1/users/me/profiles", userController.getUserProfile);
privateRouter.patch("/v1/users/me/profiles", userController.patchUserProfile);
privateRouter.post("/v1/users/me/avatar", multerBody, avatarUploader, userController.postUserAvatar);
privateRouter.post("/v1/users/me/addresses", userController.postUserAddress);
privateRouter.get("/v1/users/me/addresses", userController.getUserAddress);
privateRouter.get("/v1/users/me/addresses/:addressId", userController.getUserAddressId);
privateRouter.patch("/v1/users/me/addresses/:addressId", userController.patchUserAddressId);
privateRouter.delete("/v1/users/me/addresses/:addressId", userController.deleteUserAddressId);
privateRouter.get("/v1/users/me/wishlist", wishlistController.getAllWishlist);
// sessions
privateRouter.post("/v1/users/me/sessions/refresh", sessionController.postSessionRefresh);
privateRouter.get("/v1/users/me/sessions", sessionController.getSession);
privateRouter.delete("/v1/users/me/sessions", sessionController.deleteSession);
privateRouter.delete("/v1/users/me/sessions/all", sessionController.deleteSessionAll);
// products
privateRouter.post("/v1/products", productController.postProduct);
privateRouter.post("/v1/colours", productController.postColour);
privateRouter.get("/v1/colours", productController.getColour);
// privateRouter.post("/v1/products/:productId/images", productController.postProductImage);
privateRouter.post("/v1/products/:productId/images", multerBody, productUploader, productController.postProductImage);
privateRouter.get("/v1/products/:productId/images", productController.getProductImage);
privateRouter.patch("/v1/products/:productId/images/:imageId", productController.patchProductImage);
privateRouter.delete("/v1/products/:productId/images/:imageId", productController.deleteProductImage);
privateRouter.post("/v1/products/:productId/variants", productController.postProductVariant);
privateRouter.get("/v1/products", productController.getProduct);
privateRouter.get("/v1/products/:productId", productController.getProductId);
privateRouter.get("/v1/products/:productId/variants/:variantId", productController.getProductVariantId);
privateRouter.post("/v1/products/:productId/wishlist", wishlistController.postWishlist);
privateRouter.get("/v1/products/:productId/wishlist", wishlistController.getWishlist);
// orders
privateRouter.get("/v1/shipping-cost", orderController.getShippingCost);
privateRouter.post("/v1/orders", orderController.postOrder);
privateRouter.get("/v1/orders", orderController.getOrder);
privateRouter.get("/v1/orders/:orderId", orderController.getOrderId);
privateRouter.patch("/v1/orders/:orderId", orderController.patchOrder);
privateRouter.get("/v1/orders-count", orderController.getOrderCount);
// cart
privateRouter.post("/v1/cart", cartController.postCart);
privateRouter.get("/v1/cart", cartController.getCart);
privateRouter.patch("/v1/cart/:cartId", cartController.patchCart);
privateRouter.delete("/v1/cart/:cartId", cartController.deleteCart);
// reviews
privateRouter.post("/v1/orders/:orderId/items/:itemId/review", reviewController.postReview);
privateRouter.get("/v1/products/:id/review", reviewController.getReviewByProduct);

export { privateRouter };

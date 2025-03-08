import multer from "multer";
import path from "path";
import os from "os";
import fs from "fs";

const multerBody = (req, res, next) => {
    req.authBody = req.body;
    next();
};

const multerUploader = (folder, limit, type, field = null) => {
    const pathFolder = path.join(os.homedir(), "uploads", folder);

    if (!fs.existsSync(pathFolder)) {
        fs.mkdirSync(pathFolder, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, pathFolder);
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            const randomString = Date.now() + Math.round(Math.random() * 1e9);
            const uniqueName = `${folder}${randomString}${ext}`;
            cb(null, uniqueName);
        },
    });

    const uploader = multer({ storage, limit });

    if (type === "single") return uploader.single(folder);
    if (type === "any") return uploader.any(folder); 
};

const avatarUploader = multerUploader("avatar", { fileSize: 2 * 1024 * 1024 }, "single");
const productUploader = multerUploader("product", { fileSize: 10 * 1024 * 1024 }, "any");

export { multerBody, avatarUploader, productUploader };

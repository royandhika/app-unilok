import multer from "multer";
import path from "path";
import os from "os";
import fs from "fs";

const multerBody = (req, res, next) => {
    req.authBody = req.body;
    next();
};

const pathAvatar = path.join(os.homedir(), "uploads/avatar");
if (!fs.existsSync(pathAvatar)) {
    fs.mkdirSync(pathAvatar, { recursive: true });
}

const storageAvatar = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, pathAvatar);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const randomString = Date.now() + Math.round(Math.random() * 1e9);
        const uniqueName = `${file.fieldname}${randomString}${ext}`;
        cb(null, uniqueName);
    },
});

const limitAvatar = {
    fileSize: 2 * 1024 * 1024, // 2MB
};

const uploadAvatar = multer({ storage: storageAvatar, limits: limitAvatar }).single("avatar");

export { multerBody, uploadAvatar };

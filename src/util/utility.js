import { ResponseError } from "../error/response-error.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
const jwtKey = process.env.JWT_SECRET_KEY;
import nodemailer from "nodemailer";

const validate = (schema, request) => {
    const result = schema.validate(request, {
        abortEarly: false,
    });
    if (result.error) {
        let errorMessage = result.error.message;
        errorMessage = errorMessage.replace(/['"]/g, "");
        errorMessage = errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);

        throw new ResponseError(400, errorMessage);
    } else {
        return result.value;
    }
};

const signToken = async (payload, type) => {
    const expiresIn = type === "refresh" ? "30d" : type === "access" ? "1d" : type === "verif" ? "30m" : undefined;

    // Payloadnya butuh id & username
    const payloadId = payload.id ? payload.id : payload.user_id;

    const token = jwt.sign(
        {
            id: payloadId,
            username: payload.username,
        },
        jwtKey,
        {
            expiresIn: expiresIn,
        }
    );

    return token;
};

const verifyToken = async (token) => {
    try {
        const payload = jwt.verify(token, jwtKey);
        return payload;
    } catch {
        const payload = undefined;
        return payload;
    }
};

const transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_DOMAIN,
        pass: process.env.EMAIL_PASS,
    },
});

const verifEmail = (email, token) => {
    const url = `${process.env.BASE_DOM}/users/verify/${token}`;
    transporter.sendMail(
        {
            from: process.env.EMAIL_DOMAIN,
            to: email,
            subject: "Email Verification",
            html: `
            <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; font-size: 14px; color: #333;">
                <div style="text-align: center; padding: 20px 0;">
                    <img src="https://your-company-logo.com/logo.png" alt="COMPANY" style="max-width: 150px;">
                </div>
                <p>Please confirm your email address by clicking the link below:</p>
                <p><strong><a href="${url}" target="_blank" style="color: #007bff; text-decoration: none;">Verification link</a></strong></p>
                <p>Please keep in mind that the link will be valid only for 30 minutes and can be used only once.</p>
                <p>If you didn't request this change, please ignore this message.</p>
                <p>Thank you.<br>COMPANY</p>
                <hr>
                <p style="font-size: 12px; color: #666; text-align: center;">
                    Please note that this is a no-reply email.<br>
                    If you would like to contact us, please click <a href="https://company.com/contact" target="_blank">here</a>.
                </p>
                <p style="font-size: 12px; color: #666; text-align: center;">
                    <strong>COMPANY</strong> / Address Line, City, Country. Corp. ID no. 123456789.<br>
                    VAT no. 123456789.
                </p>
                <p style="font-size: 12px; color: #666; text-align: center;">© 2025 COMPANY. All Rights Reserved.</p>
            </div>
            `,
        },
        (err, info) => {
            if (err) {
                throw new ResponseError(400, err);
            }
        }
    );
};

export { validate, signToken, verifyToken, verifEmail };

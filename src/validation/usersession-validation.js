import Joi from "joi";

const loginValidation = Joi.object({
    username: Joi.string().max(20).required(),
    password: Joi.string()
        .max(20)
        .pattern(new RegExp("^(?=.*[A-Z])(?=.*\\d)(?=.*[!@\\-_#$%^&*])[A-Za-z\\d!@\\-_#$%^&*]{8,20}$"))
        .required(),
}).unknown();

export { loginValidation };

import Joi from "joi";

// Ini bikin 'schema' joi
const registerValidation = Joi.object({
    username: Joi.string().max(20).required(),
    password: Joi.string()
        .max(20)
        .pattern(new RegExp("^(?=.*[A-Z])(?=.*\\d)(?=.*[!@\\-_#$%^&*])[A-Za-z\\d!@\\-_#$%^&*]{8,20}$"))
        .required(),
    email: Joi.string().max(30).email({ minDomainSegments: 2 }).required(),
    phone: Joi.string().max(20).pattern(new RegExp("^[0-9]+$")).optional(),
});

const updateValidation = Joi.object({
    avatar: Joi.string().max(255).optional(),
    full_name: Joi.string().max(50).pattern(new RegExp("^[A-Za-zÀ-ÖØ-öø-ÿ]+([ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$")).required(),
    birthdate: Joi.date().required(),
    gender: Joi.string().required(),
}).unknown();

export { registerValidation, updateValidation };

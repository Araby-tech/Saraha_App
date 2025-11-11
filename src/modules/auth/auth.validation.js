import Joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";

export const sendForgotPassword = {
    body: Joi.object().keys({
        email: generalFields.email.required()
    })
}
export const verifyForgotPassword = {
    body: sendForgotPassword.body.append({
        otp: generalFields.otp.required()
    })
}
export const resetPassword = {
    body: verifyForgotPassword.body.append({
        password:generalFields.password.required(),
        confirmPassword:generalFields.confirmPassword.required()
    })
}

export const login = {
    body: Joi.object().keys({
        email: generalFields.email.required(),
        password: generalFields.password.required(),
    }).required().options({ allowUnknown: false })
}

export const signup = {
    body: login.body.append({
        fullName: generalFields.fullName.required(),
        confirmPassword: generalFields.confirmPassword.required(),
        phone: generalFields.phone.required(),
    }).required().options({ allowUnknown: false }),
}

export const confirmEmail = {
    body: Joi.object().keys({
        email: generalFields.email.required(),
        otp: generalFields.otp.required()
    }).required().options({ allowUnknown: false }),
}

export const loginWithGmail = {
    body: Joi.object().keys({
        idToken: Joi.string().required()
    }).required().options({ allowUnknown: false })
}
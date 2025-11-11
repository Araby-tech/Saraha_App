import { asyncHandler } from "../utils/response.js"
import Joi from "joi"
import { Types } from "mongoose"
import { genderEnum } from "../DB/models/User.models.js"
export const generalFields = {

    fullName: Joi.string().pattern(RegExp(/^[A-Z][a-z]{1,19}\s{1}[A-Z][a-z]{1,19}$/)).min(2).max(20).messages({
        "string.min": "min length is 2 char",
        "any.required": "fullName is mandatory",
    }),
    email: Joi.string().email({ minDomainSegments: 2, maxDomainSegments: 3, tlds: { allow: ['net', 'com', 'edu'] } }),
    password: Joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)),
    confirmPassword: Joi.string().valid(Joi.ref("password")),
    phone: Joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/)),
    otp: Joi.string().pattern(new RegExp(/^\d{6}$/)),
    gender: Joi.string().valid(...Object.values(genderEnum)),
    id: Joi.string().hex().custom((value, helper) => {
        return Types.ObjectId.isValid(value) || helper.message("In-Valid ObjectId")
    }),
    string: Joi.string(),
    file: {
        fieldname: Joi.string(),
        originalname: Joi.string(),
        encoding: Joi.string(),
        mimetype: Joi.string(),
        // finalPath: Joi.string(),
        destination: Joi.string(),
        filename: Joi.string(),
        path: Joi.string(),
        size: Joi.number().positive()
    }
}

export const validation = (schema) => {
    return asyncHandler(
        async (req, res, next) => {
            const validationError = []
            for (const key of Object.keys(schema)) {
                const validationResult = schema[key].validate(req[key], { abortEarly: false })
                if (validationResult.error) {
                    validationError.push({
                        key, details: validationResult.error.details.map(ele => {
                            return { message: ele.message, path: ele.path[0] }
                        })
                    })
                }
            }
            if (validationError.length) {
                return res.status(400).json({ error_message: "validation Error", validationError })
            }
            return next()
        }
    )
}
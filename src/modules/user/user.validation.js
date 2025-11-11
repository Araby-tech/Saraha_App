import Joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";
import { logoutEnum } from "../../utils/security/token.security.js";
import { fileValidation } from "../../utils/multer/local.multer.js";

export const logout = {
    body: Joi.object().keys({
        flag: Joi.string().valid(...Object.values(logoutEnum)).default(logoutEnum.stayLoggedIn)
    })
}
export const shareProfile = {
    params: Joi.object().keys({
        userId: generalFields.id.required()
    })
}

export const updateBasicInfo = {
    body: Joi.object().keys({
        fullName: generalFields.fullName,
        phone: generalFields.phone,
        gender: generalFields.gender
    })
}
export const updatePassword = {
    body: logout.body.append({
        oldPassword: generalFields.password.required(),
        password: generalFields.password.not(Joi.ref("oldPassword")).required(),
        confirmPassword: generalFields.confirmPassword.required(),
    }).required()
}
export const profileImage = {
    file: Joi.object().keys({
        fieldname: generalFields.file.fieldname.valid('image').required(),
        originalname: generalFields.file.originalname.required(),
        encoding: generalFields.file.encoding.required(),
        mimetype: generalFields.file.mimetype.valid(...Object.values(fileValidation.image)).required(),
        // finalPath: generalFields.file.finalPath.required(),
        destination: generalFields.file.destination.required(),
        filename: generalFields.file.filename.required(),
        path: generalFields.file.path.required(),
        size: generalFields.file.size.required()
    }).required()
}

export const profileCoverImage = {
    files: Joi.array().items(
        Joi.object().keys({
            fieldname: generalFields.file.fieldname.valid('images').required(),
            originalname: generalFields.file.originalname.required(),
            encoding: generalFields.file.encoding.required(),
            mimetype: generalFields.file.mimetype.valid(...Object.values(fileValidation.image)).required(),
            // finalPath: generalFields.file.finalPath.required(),
            destination: generalFields.file.destination.required(),
            filename: generalFields.file.filename.required(),
            path: generalFields.file.path.required(),
            size: generalFields.file.size.required()
        }).required()
    ).min(1).max(2).required()

}

export const freezeAccount = {
    params: Joi.object().keys({
        userId: generalFields.id
    })
}
export const restoreAccount = {
    params: Joi.object().keys({
        userId: generalFields.id.required()
    })
}
export const deleteAccount = {
    params: Joi.object().keys({
        userId: generalFields.id.required()
    })
}
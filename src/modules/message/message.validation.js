import Joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";
import { fileValidation } from "../../utils/multer/cloud.multer.js";

export const sendMessage = {
    params: Joi.object().keys({
        receiverId: generalFields.id.required()
    }).required(),

    body: Joi.object().keys({
        content: generalFields.string.min(2).max(200000)
    }).required(),

    files: Joi.array().items(
        Joi.object().keys({
            fieldname: generalFields.file.fieldname.valid('attachments').required(),
            originalname: generalFields.file.originalname.required(),
            encoding: generalFields.file.encoding.required(),
            mimetype: generalFields.file.mimetype.valid(...Object.values(fileValidation.image)).required(),
            destination: generalFields.file.destination.required(),
            filename: generalFields.file.filename.required(),
            path: generalFields.file.path.required(),
            size: generalFields.file.size.required()
        })
    ).min(0).max(2),
}
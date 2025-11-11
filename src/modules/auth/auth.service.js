import * as dotenv from "dotenv"
import path from "node:path"
dotenv.config({ path: path.join("./src/config/.env.dev") })
import { providerEnum, UserModel } from "../../DB/models/User.models.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import { generateHash } from "../../utils/security/hash.security.js";
import { compareHash } from "../../utils/security/hash.security.js";
import { generateLoginCredentials } from "../../utils/security/token.security.js"
import * as DBService from "../../DB/db.service.js"
import { OAuth2Client } from 'google-auth-library';
import { sendEmail } from "../../utils/email/send.email.js"
import { emailEvent } from "../../utils/events/email.event.js"
import { customAlphabet } from "nanoid"
import { generateEncryption } from "../../utils/security/encryption.security.js";
import { title } from "node:process";


export const signup = asyncHandler(
    async (req, res, next) => {
        const { fullName, email, password, phone } = req.body;
        // console.log({ fullName, email, password, phone })
        if (await DBService.findOne({ model: UserModel, filter: { email } }))
            return next(new Error("Email exist", { cause: 409 }))
        const hashPassword = await generateHash({ plaintext: password })
        const encPhone = await generateEncryption({ plaintext: phone })
        const otp = customAlphabet("0123456789", 6)()
        const confirmEmailOtp = await generateHash({ plaintext: otp })
        const [user] = await DBService.create({
            model: UserModel, data: [{ fullName, email, password: hashPassword, phone: encPhone, confirmEmailOtp }]
        })
        emailEvent.emit("confirmEmail", { to: email, otp: otp })
        return successResponse({ res, status: 201, data: { user } })

    }
)
export const confirmEmail = asyncHandler(
    async (req, res, next) => {
        const { email, otp } = req.body;
        const user = await DBService.findOne({
            model: UserModel,
            filter: {
                email,
                confirmEmail: { $exists: false },
                confirmEmailOtp: { $exists: true }
            }
        })
        if (!user) {
            return next(new Error("In-Valid account or already verified", { cause: 404 }))
        }
        if (! await compareHash({ plaintext: otp, hashValue: user.confirmEmailOtp })) {
            return next(new Error("In-Valid otp"))
        }
        const updatedUser = await DBService.updateOne({
            model: UserModel,
            filter: { email },
            data: {
                confirmEmail: Date.now(),
                $unset: { confirmEmailOtp: true },
                $inc: { __v: 1 }
            }
        })
        return updatedUser.matchedCount ? successResponse({ res, status: 200, data: {} })
            : next(new Error("Fail to confirm user email "))
    }
)
export const login = asyncHandler(
    async (req, res, next) => {
        const { email, password } = req.body;
        const user = await DBService.findOne({ model: UserModel, filter: { email, provider: providerEnum.system } })
        if (!user) {
            return next(new Error("In-Valid Login Data", { cause: 404 }))
        }

        if (!user.confirmEmail) {
            return next("please verify your account first")
        }
        if (user.deletedAt) {
            return next("this account is deleted")
        }

        const match = await compareHash({ plaintext: password, hashValue: user.password })
        // console.log({ FE: password, DB: user.password, match })

        if (!match) {
            return next(new Error("In-Valid Login Data", { cause: 404 }))
        }

        const credentials = await generateLoginCredentials({ user })
        return successResponse({ res, data: { credentials } })
    }
)
export const sendForgotPassword = asyncHandler(
    async (req, res, next) => {
        const { email } = req.body
        const otp = customAlphabet("0123456789", 6)()
        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: {
                email,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false },
                provider: providerEnum.system,
            },
            data: {
                forgotPasswordOtp: await generateHash({ plaintext: otp })
            }
        })
        if (!user) {
            return next(new Error("In-Valid Account", { cause: 404 }))
        }
        emailEvent.emit("SendForgotPassword", { to: email, subject: "Forgot Password", title: "Reset-Password", otp })
        return successResponse({ res })
    }
)

export const verifyForgotPassword = asyncHandler(
    async (req, res, next) => {
        const { email, otp } = req.body
        const user = await DBService.findOne({
            model: UserModel,
            filter: {
                email,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false },
                forgotPasswordOtp: { $exists: true },
                provider: providerEnum.system,
            },
        })
        if (!user) {
            return next(new Error("In-Valid Account", { cause: 404 }))
        }
        if (!await compareHash({ plaintext: otp, hashValue: user.forgotPasswordOtp })) {
            return next(new Error("In-Valid otp", { cause: 400 }))
        }
        return successResponse({ res })
    }
)

export const resetPassword = asyncHandler(
    async (req, res, next) => {
        const { email, otp, password } = req.body
        const user = await DBService.findOne({
            model: UserModel,
            filter: {
                email,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false },
                forgotPasswordOtp: { $exists: true },
                provider: providerEnum.system,
            },
        })
        if (!user) {
            return next(new Error("In-Valid Account", { cause: 404 }))
        }
        if (!await compareHash({ plaintext: otp, hashValue: user.forgotPasswordOtp })) {
            return next(new Error("In-Valid otp", { cause: 400 }))
        }
        await DBService.updateOne({
            model: UserModel,
            filter: {
                email
            },
            data: {
                password: await generateHash({ plaintext: password }),
                changeCredentialsTime: new Date(),
                $unset: {
                    forgotPasswordOtp: 1
                }
            }
        })
        return successResponse({ res })
    }
)

async function verifyGoogleAccount({ idToken }) {

    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.WEB_CLIENT_IDS.split(","),
    });
    const payload = ticket.getPayload();
    return payload

}
export const signupWithGmail = asyncHandler(
    async (req, res, next) => {
        const { idToken } = req.body
        const { picture, name, email, email_verified } = await verifyGoogleAccount({ idToken })
        if (!email_verified) {
            return next(new Error("NOT verified account", { cause: 400 }))
        }
        const user = await DBService.findOne({
            model: UserModel,
            filter: { email }
        })
        if (user) {
            if (user.provider === providerEnum.google) {
                const credentials = await generateLoginCredentials({ user })
                return successResponse({ res, status: 200, data: { credentials } })
            }
            return next(new Error("Email Exist", { cause: 409 }))
        }

        const [newUser] = await DBService.create({
            model: UserModel,
            data: [{
                fullName: name,
                email,
                picture,
                confirmEmail: Date.now(),
                provider: providerEnum.google
            }]
        })

        const credentials = await generateLoginCredentials({ user: newUser })
        return successResponse({ res, status: 201, data: { credentials } })
        // return successResponse({ res, status: 201, data: { user: newUser._id } })

    }
)

export const loginWithGmail = asyncHandler(
    async (req, res, next) => {
        const { idToken } = req.body
        const { email, email_verified } = await verifyGoogleAccount({ idToken })
        if (!email_verified) {
            return next(new Error("NOT verified account", { cause: 400 }))
        }
        const user = await DBService.findOne({
            model: UserModel,
            filter: { email, provider: providerEnum.google }
        })
        if (!user) {
            return next(new Error("In-Valid login data or In-Valid provider", { cause: 404 }))
        }

        const credentials = await generateLoginCredentials({ user })
        return successResponse({ res, status: 200, data: { credentials } })

    }
)
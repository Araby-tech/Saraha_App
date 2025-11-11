import { roleEnum, UserModel } from "../../DB/models/User.models.js";
import { asyncHandler, successResponse } from "../../utils/response.js"
import { generateEncryption, decryptEncryption } from "../../utils/security/encryption.security.js"
import { createRevokeToken, generateLoginCredentials, logoutEnum } from "../../utils/security/token.security.js"
import * as DBService from "../../DB/db.service.js"
import { generateHash, compareHash } from "../../utils/security/hash.security.js";
import { TokenModel } from "../../DB/models/token.model.js";
import { cloud, deleteFolderByPrefix, deleteResources, destroyFile, uploadFile, uploadFiles } from "../../utils/multer/cloudinary.js";


export const logout = asyncHandler(
    async (req, res, next) => {
        const { flag } = req.body;
        let status = 200
        switch (flag) {
            case logoutEnum.signoutFromAll:
                await DBService.updateOne({
                    model: UserModel,
                    filter: { _id: req.decoded._id },
                    data: {
                        changeCredentialsTime: new Date()
                    }
                })
                break;

            default:
                await createRevokeToken({ req })
                status = 201
                break;
        }
        return successResponse({ res, status, data: {} })
    }
);


// Get Profile
export const profile = asyncHandler(
    async (req, res, next) => {
        const user = await DBService.findById({
            model: UserModel,
            id: req.user._id,
            populate: [{ path: "messages" }]
        })
        user.phone = await decryptEncryption({ cipherText: req.user.phone })

        return successResponse({ res, data: { user } })
    }
);

// Share Profile (public profile)
export const shareProfile = asyncHandler(
    async (req, res, next) => {
        const { userId } = req.params
        const user = await DBService.findOne({
            model: UserModel,
            filter: {
                _id: userId,
                confirmEmail: { $exists: true },
            }
        })
        if (user?.phone) {
            user.phone = await decryptEncryption({ cipherText: user.phone })
        }
        return user
            ? successResponse({ res, data: { user } })
            : next(new Error("In-valid Account", { cause: 404 }))
    }
);

// Update Basic Info
export const updateBasicInfo = asyncHandler(
    async (req, res, next) => {
        if (req.body.phone) {
            req.body.phone = await generateEncryption({ plaintext: req.body.phone })
        }
        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: { _id: req.user._id },
            data: req.body
        })
        return user
            ? successResponse({ res, data: { user } })
            : next(new Error("In-valid Account", { cause: 404 }))
    }
);
// Update Password
export const updatePassword = asyncHandler(
    async (req, res, next) => {
        const { oldPassword, password, flag } = req.body
        if (!await compareHash({ plaintext: oldPassword, hashValue: req.user.password })) {
            return next(new Error("In-valid old password"))
        }
        if (req.user.oldPasswords?.length) {

            for (const hashPassword of req.user.oldPasswords) {
                if (await compareHash({ plaintext: password, hashValue: hashPassword })) {
                    return next(new Error("This password is used before"))
                }
            }
        }

        let updatedData = {}
        switch (flag) {
            case logoutEnum.signoutFromAll:
                updatedData.changeCredentialsTime = new Date()
                break;
            case logoutEnum.signout:
                await createRevokeToken({ req })
                break;

            default:
                break;
        }
        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: { _id: req.user._id },
            data: {
                password: await generateHash({ plaintext: password }),
                ...updatedData,
                $push: { oldPasswords: req.user.password }
            },
            select: "-password"
        })
        return user
            ? successResponse({ res, data: { user } })
            : next(new Error("In-valid Account", { cause: 404 }))
    }
);

//Profile Image
export const profileImage = asyncHandler(
    async (req, res, next) => {
        const { secure_url, public_id } = await uploadFile({ file: req.file, path: `user/${req.user._id}` })
        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: { _id: req.user._id },
            data: {
                picture: { secure_url, public_id }
            },
            options: {
                new: false
            }
        })
        if (user?.picture.public_id) {
            await destroyFile({ public_id: user.picture.public_id })
        }
        return successResponse({ res, data: { user } })
    }
);

//Profile Cover Image
export const profileCoverImage = asyncHandler(
    async (req, res, next) => {
        const attachments = await uploadFiles({ files: req.files, path: `user/${req.user._id}/cover` })
        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: { _id: req.user._id },
            data: {
                coverImages: attachments
            },
            options: {
                new: false
            }
        })
        if (user?.coverImages?.length) {
            await deleteResources({
                public_ids: user.coverImages.map(ele => ele.public_id)
            })
        }
        return successResponse({ res, data: { user } })
    }
);

//Freeze Account
export const freezeAccount = asyncHandler(
    async (req, res, next) => {
        const { userId } = req.params
        if (userId && req.user.role !== roleEnum.admin) {
            return next(new Error("Not authorized account", { cause: 403 }))
        }
        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: {
                _id: userId || req.user._id,
                deletedAt: { $exists: false }
            },
            data: {
                deletedAt: Date.now(),
                deletedBy: req.user._id,
                changeCredentialsTime: new Date(),
                $unset: {
                    restoredAt: 1,
                    restoredBy: 1
                }
            },
            select: "-password"
        })
        return user
            ? successResponse({ res, data: { user } })
            : next(new Error("In-valid Account", { cause: 404 }))
    }
);

//Restore Account
export const restoreAccount = asyncHandler(
    async (req, res, next) => {
        const { userId } = req.params

        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: {
                _id: userId,
                deletedAt: { $exists: true },
                deletedBy: { $ne: userId }
            },
            data: {
                $unset: {
                    deletedAt: 1,
                    deletedBy: 1
                },
                restoredAt: Date.now(),
                restoredBy: req.user._id
            }
        })
        return user
            ? successResponse({ res, data: { user } })
            : next(new Error("In-valid Account", { cause: 404 }))
    }
);

//Delete Account
export const deleteAccount = asyncHandler(
    async (req, res, next) => {
        const { userId } = req.params
        const user = await DBService.deleteOne({
            model: UserModel,
            filter: {
                _id: userId,
                deletedAt: { $exists: true }
            },

        })
        if (user.deletedCount) {
            await deleteFolderByPrefix({ prefix: `user/${userId}` })
        }
        return user.deletedCount
            ? successResponse({ res, data: { user } })
            : next(new Error("In-valid Account", { cause: 404 }))
    }
);


// Generate new login credentials
export const getNewLoginCredentials = asyncHandler(
    async (req, res, next) => {
        const credentials = await generateLoginCredentials({ user: req.user })
        return successResponse({ res, data: { credentials } })
    }
);


    import jwt from "jsonwebtoken";
    import *as DBService from "../../DB/db.service.js"
    import { UserModel } from "../../DB/models/User.models.js"
    import { roleEnum } from "../../DB/models/User.models.js";
    import { nanoid } from "nanoid";
    import { TokenModel } from "../../DB/models/token.model.js";
    export const signatureLevelEnum = { bearer: "Bearer", system: "System" }
    export const tokenTypeEnum = { access: "access", refresh: "refresh" }
    export const logoutEnum = { signoutFromAll: 'signoutFromAll', signout: 'signout', stayLoggedIn: 'stayLoggedIn' }
    export const generateToken = async ({
        payload = {},
        secret = process.env.ACCESS_USER_TOKEN_SIGNATURE,
        options = {
            expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN)
        }
    } = {}) => {
        return jwt.sign(payload, secret, options);
    };

    export const verifyToken = async ({
        token = "",
        secret = process.env.ACCESS_USER_TOKEN_SIGNATURE
    } = {}) => {
        return jwt.verify(token, secret);
    };

    export const getSignatures = async ({ signatureLevel = signatureLevelEnum.bearer } = {}) => {

        let signatures = { accessSignature: undefined, refreshSignature: undefined }
        switch (signatureLevel) {
            case signatureLevelEnum.system:
                signatures.accessSignature = process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE
                signatures.refreshSignature = process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE
                break;

            default:
                signatures.accessSignature = process.env.ACCESS_USER_TOKEN_SIGNATURE
                signatures.refreshSignature = process.env.REFRESH_USER_TOKEN_SIGNATURE
                break;
        }
        return signatures
    }

    export const decodedToken = async ({ next, authorization = "", tokenType = tokenTypeEnum.access } = {}) => {


        const [bearer, token] = authorization?.split(" ") || []

        if (!bearer || !token) {
            return next(new Error("missing token parts", { cause: 401 }))
        }
        let signatures = await getSignatures({ signatureLevel: bearer })

        const decoded = await verifyToken({
            token,
            secret: tokenType === tokenTypeEnum.access ? signatures.accessSignature : signatures.refreshSignature
        })

        if (decoded.jti && await DBService.findOne({ model: TokenModel, filter: { jti: decoded.jti } })) {
            return next(new Error("In-Valid login credentials", { cause: 401 }))
        }
        const user = await DBService.findById({
            model: UserModel,
            id: decoded._id
        })
        if (!user) {
            return next(new Error("Not Register Account", { cause: 404 }))
        }
        if (user.changeCredentialsTime?.getTime() > decoded.iat * 1000) {
            return next(new Error("In-Valid Login Credentials", { cause: 401 }))
        }
        return { user, decoded }
    }
    export const generateLoginCredentials = async ({ user } = {}) => {
        let signatures = await getSignatures({
            signatureLevel: user.role != roleEnum.user ? signatureLevelEnum.system : signatureLevelEnum.bearer
        });

        const jwtid = nanoid();

        const access_token = await generateToken({
            payload: { _id: user._id, jti: jwtid },
            secret: signatures.accessSignature,
            options: {
                expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN)
            }
        });

        const refresh_token = await generateToken({
            payload: { _id: user._id, jti: jwtid },
            secret: signatures.refreshSignature,
            options: {
                expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN)
            }
        });

        return { access_token, refresh_token };
    };

    export const createRevokeToken = async ({ req } = {}) => {
        await DBService.create({
            model: TokenModel,
            data: [{
                jti: req.decoded.jti,
                expiresIn: req.decoded.iat + Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
                userId: req.decoded._id
            }]
        })
        return true
    }

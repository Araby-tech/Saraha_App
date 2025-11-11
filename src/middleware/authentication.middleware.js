import { asyncHandler } from "../utils/response.js";
import { decodedToken, tokenTypeEnum } from "../utils/security/token.security.js";

// 🔹 الكود الجديد فيه logging تفصيلي
export const authentication = ({ tokenType = tokenTypeEnum.access } = {}) => {
    return asyncHandler(async (req, res, next) => {
        try {
            // console.log("🟦 Incoming headers:", req.headers);

            const { authorization } = req.headers;
            // console.log("🟨 Extracted Authorization header:", authorization);

            // Step 1: Check if the header is valid
            if (!authorization || (!authorization.toLowerCase().startsWith("bearer ") && !authorization.toLowerCase().startsWith("system "))) {
                // console.log("❌ Missing or invalid Authorization header");
                return next(new Error("Authorization token is missing or invalid", { cause: 401 }));
            }

            // Step 2: Decode token using your custom decodedToken function
            // console.log("🟦 Starting token decoding...");
            const result = await decodedToken({ next, authorization, tokenType });

            // console.log("🟩 Decoded result:", result);

            // Step 3: Check if result is valid
            if (!result || !result.user || !result.decoded) {
                // console.log("❌ Token decoding failed or invalid structure");
                return next(new Error("Token decoding failed", { cause: 401 }));
            }

            // Step 4: Attach user info to request
            req.user = result.user;
            req.decoded = result.decoded;

            // console.log("✅ Authentication successful for user:", req.user.email || req.user._id);
            return next();

        } catch (error) {
            // console.log("🔥 Error inside authentication middleware:", error.message);
            return next(new Error("Authentication failed", { cause: 500 }));
        }
    });
};

export const authorization = ({ accessRoles = [] } = {}) => {
    return asyncHandler(async (req, res, next) => {
        // console.log({
        //     accessRoles,
        //     currentRole: req.user.role,
        //     match: accessRoles.includes(req.user.role)
        // });
        if (!accessRoles.includes(req.user.role)) {
            return next(new Error("Not authorized account", { cause: 403 }));
        }
        return next();
    });
};

export const auth = ({ tokenType = tokenTypeEnum.access, accessRoles = [] } = {}) => {
    return asyncHandler(async (req, res, next) => {
        const { user, decoded } =
            (await decodedToken({ next, authorization: req.headers.authorization, tokenType })) || {};
        req.user = user;
        req.decoded = decoded;
        // console.log({
        //     accessRoles,
        //     currentRole: req.user.role,
        //     match: accessRoles.includes(req.user.role)
        // });
        if (!accessRoles.includes(req.user.role)) {
            return next(new Error("Not authorized account", { cause: 403 }));
        }
        return next();
    });
};

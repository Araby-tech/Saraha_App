import {authentication} from'../../middleware/authentication.middleware.js';
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./auth.validation.js"
import * as authService from "./auth.service.js";
import { Router } from "express";

const router = Router();


router.post(
    "/signup",
    validation(validators.signup),
    authService.signup
);

router.patch(
    "/confirm-email",
    validation(validators.confirmEmail),
    authService.confirmEmail
);

router.post("/login",
    validation(validators.login),
    authService.login
);

router.patch("/send-forgot-password",
    validation(validators.sendForgotPassword),
    authService.sendForgotPassword
);

router.patch("/verify-forgot-password",
    validation(validators.verifyForgotPassword),
    authService.verifyForgotPassword
);

router.patch("/reset-forgot-password",
    validation(validators.resetPassword),
    authService.resetPassword
);


router.post(
    "/signup/gmail",
    validation(validators.loginWithGmail),
    authService.signupWithGmail);

    router.post(
    "/login/gmail",
    validation(validators.loginWithGmail),
    authService.loginWithGmail);

export default router;

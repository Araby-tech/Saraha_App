import { roleEnum } from "../../DB/models/User.models.js";
import { restoreAccount } from "./user.service.js";

export const endpoint = {
    profile: [roleEnum.admin, roleEnum.user],
    restoreAccount: [roleEnum.admin],
    deleteAccount: [roleEnum.admin],
}
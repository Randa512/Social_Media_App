"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
exports.loginSchema = {
    body: zod_1.z.strictObject({
        email: validation_1.generalValidationFields.email,
        password: validation_1.generalValidationFields.password
    })
};
exports.signupSchema = {
    body: exports.loginSchema.body.safeExtend({
        username: validation_1.generalValidationFields.username,
        confirmPassword: validation_1.generalValidationFields.confirmPassword,
        phone: validation_1.generalValidationFields.phone.optional()
    }).refine((data) => { return data.password === data.confirmPassword; }, { message: 'Password and confirm Password doesnt match' })
};

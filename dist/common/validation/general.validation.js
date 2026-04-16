"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalValidationFields = void 0;
const zod_1 = require("zod");
exports.generalValidationFields = {
    email: zod_1.z.email({ message: "Invalid Email" }),
    password: zod_1.z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,16}$/, { message: "Password must contain at least one lowercase letter & one uppercase, one number & one character,must be at least 8 characters and at most 16 characters" }),
    phone: zod_1.z.string({ message: "phone is required" }).regex(/^(00201|01|\+201)(0|1|2|5)\d{8}$/),
    username: zod_1.z.string({ message: "username is required" }).min(2, { message: "min length is 2" }).max(25, { message: "max length is 25" }),
    confirmPassword: zod_1.z.string(),
    otp: zod_1.z.string({ message: "otp is required" }).regex(/^\d{6}$/, { message: 'otp must be 6 numbers' }),
};

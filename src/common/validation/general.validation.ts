import { z } from 'zod'

export const generalValidationFields = {

    email: z.email({ message: "Invalid Email" }),
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,16}$/, { message: "Password must contain at least one lowercase letter & one uppercase, one number & one character,must be at least 8 characters and at most 16 characters" }),
    phone: z.string({ message: "phone is required" }).regex(/^(00201|01|\+201)(0|1|2|5)\d{8}$/),
    username: z.string({ message: "username is required" }).min(2, { message: "min length is 2" }).max(25, { message: "max length is 25" }),
    confirmPassword: z.string(),
    otp: z.string({ message: "otp is required" }).regex(/^\d{6}$/,{message:'otp must be 6 numbers'}),
}
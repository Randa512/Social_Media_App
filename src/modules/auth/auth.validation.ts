import { z } from 'zod'
import { generalValidationFields } from '../../common/validation'

export const loginSchema = {
    body: z.strictObject({
        email: generalValidationFields.email,
        password: generalValidationFields.password
    })
}

export const signupSchema = {
    body: loginSchema.body.safeExtend({
        username: generalValidationFields.username,
        confirmPassword: generalValidationFields.confirmPassword,
        phone: generalValidationFields.phone.optional()
    }).refine((data) => { return data.password === data.confirmPassword },
        { message: 'Password and confirm Password doesnt match' })
}
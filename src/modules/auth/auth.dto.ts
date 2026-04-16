import { z } from "zod";
import { loginSchema, resendConfirmEmailSchema, sendConfirmEmailSchema, signupSchema } from "./auth.validation";


export type ILoginDto = z.infer<typeof loginSchema.body>
export type ISignupDto = z.infer<typeof signupSchema.body>
export type IresendConfirmEmailDto = z.infer<typeof resendConfirmEmailSchema.body>
export type IConfirmEmailDto = z.infer<typeof sendConfirmEmailSchema.body>
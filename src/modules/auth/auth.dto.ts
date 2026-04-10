import { z } from "zod";
import { loginSchema, signupSchema } from "./auth.validation";


export type ILoginDto = z.infer<typeof loginSchema.body>
export type ISignupDto = z.infer<typeof signupSchema.body>
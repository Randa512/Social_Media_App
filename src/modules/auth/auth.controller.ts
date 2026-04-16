import { Router } from "express";
import type { NextFunction, Request, Response } from "express"
import authService from "./auth.service";
import { successResponse } from "../../common/response";
import * as validators from './auth.validation'
import { validation } from "../../middleware/index";
import { ILoginResponse } from "./auth.entity";


const router = Router();

router.post('/login', validation(validators.loginSchema), async (req: Request, res: Response, next: NextFunction) => {
    const data = await authService.login(req.body, `${req.protocol}://${req.host}`)
    return successResponse<ILoginResponse>({ res, message: "logged in succesfully", data })
})

router.post('/signup', validation(validators.signupSchema), async (req: Request, res: Response, next: NextFunction) => {

    const user = await authService.signup(req.body)
    return successResponse<any>({ res, status: 201, data: user })
})

router.patch('/confirm_email', validation(validators.sendConfirmEmailSchema), async (req: Request, res: Response, next: NextFunction) => {

    await authService.confirmEmail(req.body)
    return successResponse<any>({ res })
})

router.patch('/resend_confirm_email', validation(validators.resendConfirmEmailSchema), async (req: Request, res: Response, next: NextFunction) => {
    await authService.resendConfirmEmail(req.body)
    return successResponse<any>({ res })
})

router.post('/signup/gmail', async (req: Request, res: Response, next: NextFunction) => {
    console.log("BODY:", req.body);
    const { status, credentials } = await authService.signupWithGmail(req.body.idToken, `${req.protocol}://${req.host}`)
    return successResponse<any>({ res, status, data: { credentials } })
})

export default router;
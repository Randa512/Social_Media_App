import { Router } from "express";
import type { NextFunction, Request, Response } from "express"
import authService from "./auth.service";
import { successResponse } from "../../common/response";
import * as validators from './auth.validation'
import { validation } from "../../middleware/validation.middleware";


const router = Router();

router.post('/login', validation(validators.loginSchema), async (req: Request, res: Response, next: NextFunction) => {
    const user = await authService.login(req.body)
    return successResponse<any>({ res, message: "logged in succesfully", data: user })
})

router.post('/signup', validation(validators.signupSchema), async (req: Request, res: Response, next: NextFunction) => {

    const user = await authService.signup(req.body)
    return successResponse<any>({ res, status: 201, data: user })
})
export default router;
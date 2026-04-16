import { Router } from 'express'
import type { NextFunction, Request, Response } from "express"
import { successResponse } from '../../common/response';
import userService from './user.service';
import { authentication, authorization } from '../../middleware';
import { endpoint } from './user.authorization';
import { TokenTypeEnum } from '../../common/enums';

const router = Router();

router.get('/profile', authentication(), authorization(endpoint.profile), async (req: Request, res: Response, next: NextFunction) => {
    const profile = await userService.getProfile(req.user, req.decodedToken)
    return successResponse({ res, data: profile })
})

router.post('/rotate_token', authentication(TokenTypeEnum.REFRESH), async (req: Request, res: Response, next: NextFunction) => {
    const credentials = await userService.rotateToken(req.user, req.decodedToken as { jti: string, iat: number, sub: string }, `${req.protocol}://${req.host}`)
    return successResponse({ res, data: credentials })
})

router.post('/logout', authentication(), async (req: Request, res: Response, next: NextFunction) => {
    const status = await userService.logout(req.body, req.user, req.decodedToken as { jti: string, iat: number, sub: string })
    return successResponse({ res, status })
})

export default router
import type { NextFunction, Request, Response } from "express"
import { UnauthorizedException } from "../common/exceptions";
import { TokenService } from "../common/services";
import { TokenTypeEnum } from "../common/enums";

// export interface IRequest extends Request {
//     user?:HydratedDocument<IUser>,
//     decodedToken:JwtPayload
// } (((>>only if we didnt use express.types.ts alternation<<)))

export const authentication = (tokenType: TokenTypeEnum = TokenTypeEnum.ACCESS) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const tokenService = new TokenService()
        const [key, credential] = req.headers?.authorization?.split(' ') || [];

        if (!key || !credential) {
            throw new UnauthorizedException('Missing authorization')
        }

        const { decodedToken, user } = await tokenService.decodeToken({ token: credential, tokenType });
        req.user = user;
        req.decodedToken = decodedToken
        next();
    }
}
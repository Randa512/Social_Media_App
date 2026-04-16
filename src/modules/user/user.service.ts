import { HydratedDocument } from "mongoose";
import { IUser } from "../../common/interfaces";
import { JwtPayload } from "jsonwebtoken";
import { LogoutEnum } from "../../common/enums";
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "../../config/config";
import { redisService, TokenService } from "../../common/services";
import { ConflictException } from "../../common/exceptions";


class UserService {
    private readonly tokenService: TokenService;

    constructor() {
        this.tokenService = new TokenService();
    }

    public async getProfile(user: HydratedDocument<IUser>, decodedToken: JwtPayload) {
        return user.toJSON()
    }

    public async logout({ flag }:{flag:LogoutEnum}, user:HydratedDocument<IUser>, { jti, iat, sub }:{jti:string,iat:number,sub:string})
    :Promise<number> {
        let status = 200;
        switch (flag) {
            case LogoutEnum.ALL:
                user.changeCredentialTime = new Date();
                await user.save();
                await redisService.deleteKey(await redisService.keys(redisService.baseRevokeTokenKey(sub)))
                break;

            default:
                await this.tokenService.createRevokeToken({
                    userId: sub,
                    jti,
                    ttl: iat + REFRESH_TOKEN_EXPIRES_IN
                })
                status = 201
                break;
        }

        return status;
    }

    public async rotateToken(user:HydratedDocument<IUser>, { sub, jti, iat }:{jti:string,iat:number,sub:string}, issuer:string)
    :Promise<{ access_token: string, refresh_token: string }> {
        if ((iat + ACCESS_TOKEN_EXPIRES_IN) * 1000 >= Date.now() + 30000) {
            throw new ConflictException('current access token still valid')
        }
        await this.tokenService.createRevokeToken({
            userId: sub,
            jti,
            ttl: iat + REFRESH_TOKEN_EXPIRES_IN
        })
        return await this.tokenService.createLoginCredentials(user, issuer)
    }


}

export default new UserService();
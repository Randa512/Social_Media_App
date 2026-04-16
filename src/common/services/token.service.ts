import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken'
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN, SYSTEM_ACCESS_TOKEN, SYSTEM_REFRESH_TOKEN, USER_ACCESS_TOKEN, USER_REFRESH_TOKEN } from '../../config/config'
import { randomUUID } from 'node:crypto'
import { RoleEnum, TokenTypeEnum } from '../enums'
import { BadRequestException, NotFoundException, UnauthorizedException } from '../exceptions'
import { redisService, RedisService } from './redis.service'
import { UserRepository } from '../../DB/repository'
import { HydratedDocument, Types } from 'mongoose'
import { IUser } from '../interfaces'

type SignaturesType = {
    accessSignature: string,
    refreshSignarture: string
}

export class TokenService {
    private readonly userRepo: UserRepository
    private readonly redis: RedisService

    constructor() {
        this.userRepo = new UserRepository()
        this.redis = redisService
    }

    public sign(
        { payload, secretKey = USER_ACCESS_TOKEN, options }
            : {
                payload: object,
                secretKey?: string,
                options?: SignOptions
            }): string {
        return jwt.sign(payload, secretKey, options)
    }

    public verify(
        { token, secretKey = USER_ACCESS_TOKEN }
            : {
                token: string,
                secretKey?: string
            }): JwtPayload {
        return jwt.verify(token, secretKey) as JwtPayload
    }

    public async detectSignatureLevel(role: RoleEnum): Promise<SignaturesType> {
        let signatures: SignaturesType;

        switch (role) {
            case RoleEnum.ADMIN:
                signatures = {
                    accessSignature: SYSTEM_ACCESS_TOKEN,
                    refreshSignarture: SYSTEM_REFRESH_TOKEN
                }
                break;
            default:
                {
                    signatures = {
                        accessSignature: USER_ACCESS_TOKEN,
                        refreshSignarture: USER_REFRESH_TOKEN
                    }
                }
        }
        return signatures;
    }

    public async getSignature(tokenType = TokenTypeEnum.ACCESS, signatureLevel: RoleEnum): Promise<string> {
        const signatures = await this.detectSignatureLevel(signatureLevel);

        let signature;
        switch (tokenType) {
            case TokenTypeEnum.REFRESH:
                signature = signatures.refreshSignarture;
                break;
            default:
                signature = signatures.accessSignature;
        }

        return signature;
    }

    public async decodeToken({ token, tokenType = TokenTypeEnum.ACCESS }
        : { token: string, tokenType: TokenTypeEnum })
        : Promise<{ user: HydratedDocument<IUser>, decodedToken: JwtPayload }> {
        const decodedToken = jwt.decode(token) as JwtPayload;

        if (!decodedToken?.aud?.length) {
            throw new BadRequestException('Missing Token Audience 🤦‍♂️')
        }

        const [tokenApproach, signatureLevel] = decodedToken.aud;
        if (tokenApproach == undefined || signatureLevel == undefined) {
            throw new BadRequestException('Missing Token Audience 🤦‍♂️')
        }
        if (tokenType !== tokenApproach as unknown as TokenTypeEnum) {
            throw new BadRequestException('Invalid Token Approach')
        }
        if (decodedToken.jti && await this.redis.get(this.redis.revokeTokenKey({ userId: decodedToken.sub as string, jti: decodedToken.jti }))) {
            throw new UnauthorizedException('Invalid Login Session')
        }

        const secret = await this.getSignature(tokenApproach as unknown as TokenTypeEnum, signatureLevel as unknown as RoleEnum);
        const verifiedData = this.verify({ token, secretKey: secret })
        if (!verifiedData?.sub) {
            throw new BadRequestException('Invalid Token Payload 😒📛')
        }

        const user = await this.userRepo.findOne({ filter: { _id: verifiedData.sub } });

        if (!user) {
            throw new NotFoundException('Not a Registered acoount 📛😒')
        }

        if (user.changeCredentialTime && user.changeCredentialTime?.getTime() >= (decodedToken.iat as number || 0) * 1000) {
            throw new UnauthorizedException('Invalid Login Session ☠☠')
        }

        return { user, decodedToken }
    }

    public async createLoginCredentials(user: HydratedDocument<IUser>, issuer: string)
        : Promise<{ access_token: string, refresh_token: string }> {
        const { accessSignature, refreshSignarture } = await this.detectSignatureLevel(user.role);

        const jwtId = randomUUID();
        const access_token = this.sign({
            payload: { sub: user._id },
            secretKey: accessSignature,
            options: {
                issuer,
                audience: [TokenTypeEnum.ACCESS, user.role] as unknown as string[],
                expiresIn: ACCESS_TOKEN_EXPIRES_IN,
                jwtid: jwtId
            }
        })

        const refresh_token = this.sign({
            payload: { sub: user._id },
            secretKey: refreshSignarture,
            options: {
                issuer,
                audience: [TokenTypeEnum.REFRESH, user.role] as unknown as string[],
                expiresIn: REFRESH_TOKEN_EXPIRES_IN,
                jwtid: jwtId
            }
        })

        return { access_token, refresh_token }
    }

    public async createRevokeToken({ userId, jti, ttl }
        : { userId: Types.ObjectId | string, jti: string, ttl: number }) {
        await this.redis.set({
            key: this.redis.revokeTokenKey({ userId, jti }),
            value: jti,
            ttl
        })
        return
    }

}
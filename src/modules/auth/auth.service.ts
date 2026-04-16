import { IConfirmEmailDto, ILoginDto, IresendConfirmEmailDto, ISignupDto } from "./auth.dto"
import { IUser } from "../../common/interfaces"
import { BadRequestException, ConflictException, NotFoundException } from "../../common/exceptions"
import { compareHash, generateEncryption, generateHash } from "../../common/utils/security";
import { emailEvent, emailTemplate, sendEmail } from "../../common/utils/email";
import { redisService, RedisService, TokenService } from "../../common/services";
import { EmailEnum, ProviderEnum } from "../../common/enums";
import { createRandomOtp } from "../../common/utils/otp";
import { UserRepository } from "../../DB/repository";
import { ILoginResponse } from "./auth.entity";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { CLIENT_IDS } from "../../config/config";


class AuthenticationService {
    private userRepository: UserRepository;
    private readonly redis: RedisService;
    private readonly tokenServices: TokenService;

    constructor() {
        this.userRepository = new UserRepository();
        this.redis = redisService
        this.tokenServices = new TokenService();
    }

    private async EmailOtp({ email, subject, title }
        : { email: string, subject: EmailEnum, title: string }) {
        const isBlockedTTL = await this.redis.ttl(this.redis.blockOtpKey({ email, subject }))
        if (isBlockedTTL > 0) {
            throw new BadRequestException(`Sorry You have reached Max Request Trial , Try Again After ${isBlockedTTL} `)
        }

        const remainingOtpTTL = await this.redis.ttl(this.redis.otpKey({ email, subject }))
        if (remainingOtpTTL > 0) {
            throw new BadRequestException(`Sorry we can not send new otp while first one is still active, please try again after ${remainingOtpTTL}`)
        }

        const maxTrial = Number(await this.redis.get(this.redis.maxAttemptOtpKey({ email, subject })))
        if (maxTrial >= 3) {
            await this.redis.set({
                key: this.redis.blockOtpKey({ email, subject }),
                value: 1,
                ttl: 7 * 60
            })
            throw new BadRequestException('reached maximum trials!! ❌❌')
        }

        const code = createRandomOtp();

        await this.redis.set({
            key: this.redis.otpKey({ email, subject }),
            value: await generateHash({ plaintext: code.toString() })
            , ttl: 120
        })

        emailEvent.emit("sendEmail", async () => {
            await sendEmail({
                to: email,
                subject,
                html: emailTemplate({ code, title })
            })
            await this.redis.increment(this.redis.maxAttemptOtpKey({ email, subject }))
        })
    }

    public async confirmEmail({ email, otp }: IConfirmEmailDto) {

        const hashOtp = await this.redis.get(this.redis.otpKey({ email, subject: EmailEnum.CONFIRM_EMAIL }))

        console.log({ hashOtp, type: typeof hashOtp })

        if (!hashOtp) {
            throw new NotFoundException('Expired OTP ❌❌')
        }

        const account = await this.userRepository.findOne({ filter: { email, confirmEmail: { $exists: false }, provider: ProviderEnum.SYSTEM } })
        if (!account) {
            throw new NotFoundException('Matched Account Not Found')
        }



        if (!await compareHash({ plainText: otp, cipherText: hashOtp })) {
            throw new ConflictException('INVALID OTP !')
        }

        account.confirmEmail = new Date();
        await account.save();

        await this.redis.deleteKey(await this.redis.keys(this.redis.otpKey({ email })))
    }

    public async resendConfirmEmail({ email }: IresendConfirmEmailDto) {
        const account = await this.userRepository.findOne({ filter: { email, provider: ProviderEnum.SYSTEM } })
        console.log({ account })
        if (!account) {
            throw new NotFoundException('Matched Account Not Found')
        }
        console.log({ confirmEmail: account.confirmEmail })
        if (account.confirmEmail) {
            throw new ConflictException(`Email ::${account.email}:: already confirmed`);
        }

        await this.EmailOtp({ email, subject: EmailEnum.CONFIRM_EMAIL, title: "Verify Email" })
    }

    public async login(inputs: ILoginDto, issuer: string): Promise<ILoginResponse> {
        let { email, password } = inputs;

        const checkUserEmail = await this.userRepository.findOne({ filter: { email, provider: ProviderEnum.SYSTEM, confirmEmail: { $exists: true } } });
        if (!checkUserEmail) {
            throw new NotFoundException("Invalid Login Credentials")
        }
        console.log(checkUserEmail)
        const checkPass = await compareHash({ plainText: password, cipherText: checkUserEmail.password as string })
        console.log({ checkPass })
        if (!checkPass) {
            throw new NotFoundException('Invalid Login Credentials');
        }
        return await this.tokenServices.createLoginCredentials(checkUserEmail, issuer)
    }

    public async signup(inputs: ISignupDto): Promise<IUser> {
        let { username, email, password, phone } = inputs
        const checkUser = await this.userRepository.findOne({ filter: { email } })

        if (checkUser) {
            throw new ConflictException("Email Exists")
        }

        const newUser = await this.userRepository.createOne({
            data: {
                username, email,
                password: await generateHash({ plaintext: password }),
                phone: phone ? await generateEncryption({ plainText: phone }) : undefined
            }
        })

        if (!newUser) {
            throw new BadRequestException("Fail To Create New User ")
        }

        this.EmailOtp({ email, subject: EmailEnum.CONFIRM_EMAIL, title: "Verify Email" })

        return newUser.toJSON()
    }

    private async verifyGoogleAccount(idToken: string): Promise<TokenPayload> {
        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: CLIENT_IDS,
        });
        const payload = ticket.getPayload();
        console.log(payload);
        if (!payload?.email_verified) {
            throw new BadRequestException("invalid token payload")

        }
        return payload
    }

    public async loginWithGmail(idToken: string, issuer: string) {

        const payload = await this.verifyGoogleAccount(idToken);

        const user = await this.userRepository.findOne({ filter: { email: payload.email as string, provider: ProviderEnum.GOOGLE } })
        if (!user) {
            throw new NotFoundException("not registered account!! ☢❌")

        }

        return await this.tokenServices.createLoginCredentials(user, issuer)
    }

    public async signupWithGmail(idToken: string, issuer: string) {

        const payload = await this.verifyGoogleAccount(idToken)

        const checkUserExist = await this.userRepository.findOne({ filter: { email: payload.email as string } })
        if (checkUserExist) {

            if (checkUserExist.provider != ProviderEnum.GOOGLE) {
                throw new ConflictException("invalid account provider")
            }

            return { status: 200, credentials: await this.loginWithGmail(idToken, issuer) };
        }

        const account = await this.userRepository.createOne({
            data: {
                firstName: payload.given_name as string,
                lastName: payload.family_name as string,
                email: payload.email as string,
                profilePicture: payload.picture as string,
                provider: ProviderEnum.GOOGLE,
                confirmEmail: new Date()
            }
        });

        return { status: 201, credentials: await this.tokenServices.createLoginCredentials(account, issuer) }

    }
}

export default new AuthenticationService()
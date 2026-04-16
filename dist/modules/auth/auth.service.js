"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("../../common/exceptions");
const security_1 = require("../../common/utils/security");
const email_1 = require("../../common/utils/email");
const services_1 = require("../../common/services");
const enums_1 = require("../../common/enums");
const otp_1 = require("../../common/utils/otp");
const repository_1 = require("../../DB/repository");
const google_auth_library_1 = require("google-auth-library");
const config_1 = require("../../config/config");
class AuthenticationService {
    userRepository;
    redis;
    tokenServices;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
        this.redis = services_1.redisService;
        this.tokenServices = new services_1.TokenService();
    }
    async EmailOtp({ email, subject, title }) {
        const isBlockedTTL = await this.redis.ttl(this.redis.blockOtpKey({ email, subject }));
        if (isBlockedTTL > 0) {
            throw new exceptions_1.BadRequestException(`Sorry You have reached Max Request Trial , Try Again After ${isBlockedTTL} `);
        }
        const remainingOtpTTL = await this.redis.ttl(this.redis.otpKey({ email, subject }));
        if (remainingOtpTTL > 0) {
            throw new exceptions_1.BadRequestException(`Sorry we can not send new otp while first one is still active, please try again after ${remainingOtpTTL}`);
        }
        const maxTrial = Number(await this.redis.get(this.redis.maxAttemptOtpKey({ email, subject })));
        if (maxTrial >= 3) {
            await this.redis.set({
                key: this.redis.blockOtpKey({ email, subject }),
                value: 1,
                ttl: 7 * 60
            });
            throw new exceptions_1.BadRequestException('reached maximum trials!! ❌❌');
        }
        const code = (0, otp_1.createRandomOtp)();
        await this.redis.set({
            key: this.redis.otpKey({ email, subject }),
            value: await (0, security_1.generateHash)({ plaintext: code.toString() }),
            ttl: 120
        });
        email_1.emailEvent.emit("sendEmail", async () => {
            await (0, email_1.sendEmail)({
                to: email,
                subject,
                html: (0, email_1.emailTemplate)({ code, title })
            });
            await this.redis.increment(this.redis.maxAttemptOtpKey({ email, subject }));
        });
    }
    async confirmEmail({ email, otp }) {
        const hashOtp = await this.redis.get(this.redis.otpKey({ email, subject: enums_1.EmailEnum.CONFIRM_EMAIL }));
        console.log({ hashOtp, type: typeof hashOtp });
        if (!hashOtp) {
            throw new exceptions_1.NotFoundException('Expired OTP ❌❌');
        }
        const account = await this.userRepository.findOne({ filter: { email, confirmEmail: { $exists: false }, provider: enums_1.ProviderEnum.SYSTEM } });
        if (!account) {
            throw new exceptions_1.NotFoundException('Matched Account Not Found');
        }
        if (!await (0, security_1.compareHash)({ plainText: otp, cipherText: hashOtp })) {
            throw new exceptions_1.ConflictException('INVALID OTP !');
        }
        account.confirmEmail = new Date();
        await account.save();
        await this.redis.deleteKey(await this.redis.keys(this.redis.otpKey({ email })));
    }
    async resendConfirmEmail({ email }) {
        const account = await this.userRepository.findOne({ filter: { email, provider: enums_1.ProviderEnum.SYSTEM } });
        console.log({ account });
        if (!account) {
            throw new exceptions_1.NotFoundException('Matched Account Not Found');
        }
        console.log({ confirmEmail: account.confirmEmail });
        if (account.confirmEmail) {
            throw new exceptions_1.ConflictException(`Email ::${account.email}:: already confirmed`);
        }
        await this.EmailOtp({ email, subject: enums_1.EmailEnum.CONFIRM_EMAIL, title: "Verify Email" });
    }
    async login(inputs, issuer) {
        let { email, password } = inputs;
        const checkUserEmail = await this.userRepository.findOne({ filter: { email, provider: enums_1.ProviderEnum.SYSTEM, confirmEmail: { $exists: true } } });
        if (!checkUserEmail) {
            throw new exceptions_1.NotFoundException("Invalid Login Credentials");
        }
        console.log(checkUserEmail);
        const checkPass = await (0, security_1.compareHash)({ plainText: password, cipherText: checkUserEmail.password });
        console.log({ checkPass });
        if (!checkPass) {
            throw new exceptions_1.NotFoundException('Invalid Login Credentials');
        }
        return await this.tokenServices.createLoginCredentials(checkUserEmail, issuer);
    }
    async signup(inputs) {
        let { username, email, password, phone } = inputs;
        const checkUser = await this.userRepository.findOne({ filter: { email } });
        if (checkUser) {
            throw new exceptions_1.ConflictException("Email Exists");
        }
        const newUser = await this.userRepository.createOne({
            data: {
                username, email,
                password: await (0, security_1.generateHash)({ plaintext: password }),
                phone: phone ? await (0, security_1.generateEncryption)({ plainText: phone }) : undefined
            }
        });
        if (!newUser) {
            throw new exceptions_1.BadRequestException("Fail To Create New User ");
        }
        this.EmailOtp({ email, subject: enums_1.EmailEnum.CONFIRM_EMAIL, title: "Verify Email" });
        return newUser.toJSON();
    }
    async verifyGoogleAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: config_1.CLIENT_IDS,
        });
        const payload = ticket.getPayload();
        console.log(payload);
        if (!payload?.email_verified) {
            throw new exceptions_1.BadRequestException("invalid token payload");
        }
        return payload;
    }
    async loginWithGmail(idToken, issuer) {
        const payload = await this.verifyGoogleAccount(idToken);
        const user = await this.userRepository.findOne({ filter: { email: payload.email, provider: enums_1.ProviderEnum.GOOGLE } });
        if (!user) {
            throw new exceptions_1.NotFoundException("not registered account!! ☢❌");
        }
        return await this.tokenServices.createLoginCredentials(user, issuer);
    }
    async signupWithGmail(idToken, issuer) {
        const payload = await this.verifyGoogleAccount(idToken);
        const checkUserExist = await this.userRepository.findOne({ filter: { email: payload.email } });
        if (checkUserExist) {
            if (checkUserExist.provider != enums_1.ProviderEnum.GOOGLE) {
                throw new exceptions_1.ConflictException("invalid account provider");
            }
            return { status: 200, credentials: await this.loginWithGmail(idToken, issuer) };
        }
        const account = await this.userRepository.createOne({
            data: {
                firstName: payload.given_name,
                lastName: payload.family_name,
                email: payload.email,
                profilePicture: payload.picture,
                provider: enums_1.ProviderEnum.GOOGLE,
                confirmEmail: new Date()
            }
        });
        return { status: 201, credentials: await this.tokenServices.createLoginCredentials(account, issuer) };
    }
}
exports.default = new AuthenticationService();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("../../common/exceptions");
const repository_1 = require("../../DB/repository");
const security_1 = require("../../common/utils/security");
const email_1 = require("../../common/utils/email");
class AuthenticationService {
    userRepository;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
    }
    async login(inputs) {
        let { email, password } = inputs;
        const checkUserEmail = await this.userRepository.findOne({ filter: { email } });
        if (!checkUserEmail) {
            throw new exceptions_1.NotFoundException("Invalid Login Credentials");
        }
        console.log(checkUserEmail);
        const checkPass = await (0, security_1.compareHash)({ plainText: password, cipherText: checkUserEmail.password });
        console.log({ checkPass });
        if (!checkPass) {
            throw new exceptions_1.NotFoundException('Invalid Login Credentials');
        }
        return checkUserEmail.email;
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
        await (0, email_1.sendEmail)({ to: email, subject: "Confirm Email", html: (0, email_1.emailTemplate)({ code: 123456, title: "Verify Account" }) });
        return newUser.toJSON();
    }
}
exports.default = new AuthenticationService();

import { ILoginDto, ISignupDto } from "./auth.dto"
import { IUser } from "../../common/interfaces"
import { BadRequestException, ConflictException, NotFoundException } from "../../common/exceptions"
import { UserRepository } from "../../DB/repository"
import { compareHash, generateEncryption, generateHash } from "../../common/utils/security";
import { emailTemplate, sendEmail } from "../../common/utils/email";


class AuthenticationService {
    private userRepository: UserRepository;
    constructor() {
        this.userRepository = new UserRepository()
    }

    public async login(inputs: ILoginDto): Promise<string> {
        let { email, password } = inputs;

        const checkUserEmail = await this.userRepository.findOne({ filter: { email } });
        if (!checkUserEmail) {
            throw new NotFoundException("Invalid Login Credentials")
        }
        console.log(checkUserEmail)
        const checkPass = await compareHash({ plainText: password, cipherText: checkUserEmail.password as string })
        console.log({ checkPass })
        if (!checkPass) {
            throw new NotFoundException('Invalid Login Credentials');
        }
        return checkUserEmail.email;
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

        await sendEmail({ to: email, subject: "Confirm Email", html: emailTemplate({ code: 123456, title: "Verify Account" }) })

        return newUser.toJSON()
    }
}

export default new AuthenticationService()
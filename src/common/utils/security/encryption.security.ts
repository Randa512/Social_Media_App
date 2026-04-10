import crypto from "node:crypto"
import { ENC_IV_LENGTH, ENC_KEY } from "../../../config/config";
import { BadRequestException } from "../../exceptions";

export const generateEncryption = async ({ plainText }: { plainText: string }): Promise<string> => {
    const iv = crypto.randomBytes(ENC_IV_LENGTH);
    // console.log({ ENC_IV_LENGTH })
    const cipherIvVector = crypto.createCipheriv('aes-256-cbc', ENC_KEY, iv);

    let cipherText = cipherIvVector.update(plainText, 'utf-8', 'hex')
    cipherText += cipherIvVector.final('hex');

    return `${iv.toString('hex')}:${cipherText}`
}

export const generateDecryption = async ({ cipherText }: { cipherText: string }): Promise<string> => {
    const [iv, encryption] = cipherText.split(":") || [] as string[];
    if (!iv || !encryption) {
        throw new BadRequestException('invalid encryption parts')
    }
    const ivLikeBinary = Buffer.from(iv, "hex")

    const deCipherIvVector = crypto.createDecipheriv("aes-256-cbc", ENC_KEY, ivLikeBinary)

    let plainText = deCipherIvVector.update(encryption, 'hex', 'utf-8')
    plainText += deCipherIvVector.final('utf-8')
    return plainText
}
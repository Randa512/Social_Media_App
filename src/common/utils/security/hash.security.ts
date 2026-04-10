import { compare, hash } from "bcrypt"
import { SALT_ROUND } from "../../../config/config"

export const generateHash = async ({ plaintext, salt = SALT_ROUND }: {
    plaintext: string,
    salt?: number
}): Promise<string> => {

    return await hash(plaintext, salt)
}

export const compareHash = async ({ plainText, cipherText }: {
    plainText: string,
    cipherText: string
}): Promise<boolean> => {
    return await compare(plainText, cipherText)
}
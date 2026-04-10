import { GenderEnum, ProviderEnum, RoleEnum } from "../enums";


export interface IUser {
    firstName: string,
    lastName: string,
    username?: string,
    email: string,
    phone?: string | undefined,
    password?: string,
    profilePicture?: string,
    CoverPhotos?: string[],
    gender: GenderEnum,
    role: RoleEnum,
    provider: ProviderEnum,
    changeCredentialTime?: Date,
    DOB?: Date,
    confirmEmail?: Date,
    createdAt?: Date,
    updatedAt?: Date
}
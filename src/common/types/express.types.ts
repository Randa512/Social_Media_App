import { JwtPayload } from "jsonwebtoken"
import { IUser } from "../interfaces"
import { HydratedDocument } from "mongoose"


declare module 'express-serve-static-core' {
    interface Request {
        user: HydratedDocument<IUser>
        decodedToken: JwtPayload
    }
}

//this or in user.service
// public async getProfile(user: HydratedDocument<IUser>, decodedToken: JwtPayload) {
//         return user?.toJSON()
//     }

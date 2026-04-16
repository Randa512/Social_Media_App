import express from "express"
import { authRouter, userRouter } from "./modules";
import { globalErrorHandler } from "./middleware";
import { PORT } from "./config/config";
import connectDB from "./DB/connection.db";
import { redisService } from "./common/services";
import cors from 'cors'

export const bootstrap = async (): Promise<void> => {
    const app: express.Express = express();

    // DB connection
    await connectDB();

    //REDIS CONNECTION
    await redisService.connect();


    app.use(cors(), express.json());

    app.get("/", (req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.json("Landing Page 😎")
    })

    // application routing
    app.use('/auth', authRouter)
    app.use('/user', userRouter)

    // invalid routing
    app.get('/*dummy', (req: express.Request, res: express.Response, next: express.NextFunction) => {
        return res.status(404).json({ message: "Invalid Application Routing" })
    })

    // global error handling
    app.use(globalErrorHandler);

    // server connection
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT} 🚀🚀`)
    })
}


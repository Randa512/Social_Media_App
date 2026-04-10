import { connect } from "mongoose"
import { DB_URI } from "../config/config"


const connectDB = async () => {
    try {
        await connect(DB_URI, { serverSelectionTimeoutMS: 30000 })
        console.log('DB Connected Successfully ✅')
    } catch (error) {
        console.log('Failed to connect to DB ❌')
    }
}

export default connectDB
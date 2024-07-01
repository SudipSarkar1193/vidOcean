import mongoose from "mongoose";
import { db_name } from "../constants.js";

export const connectDB = async()=>{
    try {

        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${db_name}`);
        console.log(`\nDatabase connected !\nHost is : ${connectionInstance.connection.host}`);

    } catch (error) {
        console.error("DATABASE CONNECTION ERROR : ",error);
        process.exit(1);
    }
}
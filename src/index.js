
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./db/index.js";

dotenv.config({path:"./env"})

connectDB()











/*

//IIFE : Immediately Invoked Function Expressions  => 

(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${db_name}`)
    } catch (error) {
        console.error("ERROR : ",error);
    }
})()

*/
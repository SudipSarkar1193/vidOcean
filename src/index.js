import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });

connectDB()
	.then(() => {
		app.on("error", (err) => {
			console.log("ERROR:", err);
			throw err;
		});
		app.listen(process.env.PORT, () => {
			console.log(`Server is running at port : ${process.env.PORT}`);
		});
	})
	.catch((err) => {
		console.log("Mongodb connection failed !!! \n", err);
	});

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

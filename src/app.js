import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
	cors({
		origin: process.env.CORS_ORIGIN,
		Credential: true, //Very Important
		optionsSuccessStatus: 200, //ok
	})
);

app.use(
	express.json({
		limit: "16kb",
	})
);

app.use(
	express.urlencoded({
		extended: true,
		limit: "16kb",
	})
);

app.use(express.static("public"));

app.use(cookieParser());


//Routes :

import userRoute from "./routes/user.routes.js";

app.use("/api/v1/users",userRoute) // whenever the url : /api/v1/users is hit , the controll will go the userRoute 



export { app };

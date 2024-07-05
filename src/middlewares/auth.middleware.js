import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
	

	try {
		const { accesToken } = req.cookies;
		accesToken = !accesToken
			? req.header("Authorization")?.replace("Bearer ", "")
			: accesToken;

		if (!accesToken) {
			throw new APIError(401, "Unauthorized request");
		}

		const decodedToken = jwt.verify(
			accesToken,
			process.env.ACCESS_TOKEN_SECRET
		);  //The jwt.verify function returns the decoded payload of the token if the token is valid and the verification is successful. This payload is a JSON object containing the claims (data) that were encoded in the token.

		const user = await User.findById(decodedToken?._id).select(
			"-password -refreshToken"
		);

        if (!user) {
            throw new APIError(401, "Invalid Access Token")
        }
        req.user = user;
        next();

	} catch (error) {
		throw new APIError(401, error?.message || "Invalid access token");
	}
});

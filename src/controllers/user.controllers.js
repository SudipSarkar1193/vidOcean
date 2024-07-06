import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/APIResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
	try {
		const user = await User.findById(userId);

		const accessToken = user.generateAccessToken();
		const refreshToken = user.generateRefreshToken();

		user.refreshToken = refreshToken;
		await user.save({ validateBeforeSave: false });
		console.log(user)

		console.log("accessToken",accessToken,"\nRefreshToken",refreshToken)

		return { accessToken, refreshToken };
	} catch (error) {
		throw new APIError(
			500,
			"Something went wrong while generating referesh and access token => ERROR:",
			error
		);
	}
};

const registerUser = asyncHandler(async (req, res, next) => {
	//STEP:1 get user details from frontend
	const { fullName, email, username, password } = req.body;

	//STEP:2 validation - not empty

	if (
		[fullName, email, username, password].some(
			(field) => field == null || field.trim() === ""
		) // the code will work if a field is either of undefined and null...
		// because the comparison field == null checks for both null and undefined due to the behavior of the loose equality operator (==). This is one of the few cases where using == instead of === is appropriate
	) {
		throw new APIError(400, "All fields are required");
	}

	//STEP:3 check if user already exists: username, email

	const existedUser = await User.findOne({
		$or: [{ username }, { email }],
	});
	if (existedUser) {
		throw new APIError(409, "User with email or username already exists");
	}

	//STEP:4 check for images, check for avatar if exists

	const avatarLocalPath = req.files?.avatar[0]?.path; //using multer we uploaded the file locally on our server ...and by this : "req.files?.avatar[0]?.path" , we got the local path

	let coverImageLocalPath;
	if (
		req.files &&
		Array.isArray(req.files.coverImage) &&
		req.files.coverImage.length > 0
	) {
		coverImageLocalPath = req.files.coverImage[0].path;
	}

	if (!avatarLocalPath) {
		throw new APIError(400, "Avatar file is required");
	}

	//STEP:5 upload them to cloudinary, avatar

	// const avatar = await uploadOnCloudinary(avatarLocalPath,200,200); aslo can set width : height,width
	const avatar = await uploadOnCloudinary(avatarLocalPath, 200, 200);
	const coverImage = await uploadOnCloudinary(coverImageLocalPath);

	if (!avatar) {
		throw new APIError(400, "Avatar file is required");
	}

	//STEP:6 create user object - create entry in db

	const user = await User.create({
		fullName,
		avatar: avatar.url,
		coverImage: coverImage?.url || "",
		email,
		password,
		username: username.toLowerCase(),
	});

	//STEP:7 remove password and refresh token field from response:

	const createdUser = await User.findById(user._id).select(
		"-password -refreshToken"
	); //The select method in Mongoose is used to include or exclude specific fields from the returned document.
	// Prefixing a field with - means "exclude this field". So "-password -refreshToken" means "exclude the password and refreshToken fields from the result".
	// If you wanted to include only specific fields, you would list them without the - prefix (e.g., .select("fullName email username")).

	//STEP:8 check for user creation
	if (!createdUser) {
		throw new APIError(500, "Something went wrong while registering the user");
	}

	//STEP:9 return response
	return res
		.status(201)
		.json(new APIResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res, next) => {
	// req body -> data
	// username or email
	// find the user
	// password check

	const { email, username, password } = req.body;
	console.log("username:",username);
	console.log("email:",email);
	console.log("password:",password);

	if (!username && !email) {
		throw new APIError(400, "username or email is required");
	}

	const user = await User.findOne({
		$or: [{ username }, { email }],
	});

	if (!user) {
		throw new APIError(404, "User does not exist");
	}

	const isPasswordCorrect = await user.isPasswordCorrect(password);

	if (!isPasswordCorrect) {
		throw new APIError(401, "Incorrect password");
	}

	//access and referesh token
	const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

	//Get updated version of user :
	const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
	//send cookie
	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.cookie("accessToken", accessToken, options)
		.cookie("refreshToken", refreshToken, options)
		.json(
			new APIResponse(
				200,
				{
					user: loggedInUser,
					accessToken,
					refreshToken,
				},
				"User logged In Successfully"
			)
		);
});

const logoutUser = asyncHandler(async (req, res) => {
	const user = req.user;

	await User.findByIdAndUpdate(
		user._id,
		{
			$set: {
				refreshToken: undefined,
			},
		},
		{
			new: true,
		}
	);

	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.clearCookie("accessToken", options)
		.clearCookie("refreshToken", options)
		.json(new APIResponse(200, {}, "User logged Out"));
});

//refreshAccessToken ====>>
const refreshAccessToken = asyncHandler(async (req, res) => {
	try {
		const incomingRefreshToken =
			req.cookies.refreshToken || req.body.refreshToken;
	
		if (!incomingRefreshToken) {
			throw new APIError(401, "unauthorized request");
		}
	
		const decodedAccessToken = jwt.verify(
			incomingRefreshToken,
			process.env.REFRESH_TOKEN_SECRET
		);
	
		const user = await User.findById(decodedAccessToken._id);
	
		if (!user) {
			throw new APIError(401, "Invalid refresh token");
		}
	
		if (incomingRefreshToken !== user?.refreshToken) {
			throw new APIError(401, "Refresh token is expired or used");
		}
	
		const { accessToken, refreshToken } = generateAccessAndRefreshToken(user._id);
	
		const options = {
			httpOnly: true,
			secure: true,
		};
	
		return res
			.status(200)
			.cookie("accessToken", accessToken, options)
			.cookie("refreshToken", refreshToken, options)
			.json(
				new APIResponse(
					200,
					{ accessToken, refreshToken },
					"Access token refreshed"
				)
			);
	} catch (error) {
		throw new APIError(401, error?.message || "Invalid refresh token")
	}
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };

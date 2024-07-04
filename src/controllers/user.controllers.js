import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/APIResponse.js";


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
	
	const avatarLocalPath = req.files?.avatar[0]?.path;  //using multer we uploaded the file locally on our server ...and by this : "req.files?.avatar[0]?.path" , we got the local path
	
	let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


	if (!avatarLocalPath) {
		throw new APIError(400, "Avatar file is required");
	}

	//STEP:5 upload them to cloudinary, avatar

	// const avatar = await uploadOnCloudinary(avatarLocalPath,200,200); aslo can set width : height,width
	const avatar = await uploadOnCloudinary(avatarLocalPath,200,200);
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
	//Logic :
	res.status(200).json({
		message: "ok from login handler",
	});
});

export { registerUser, loginUser };

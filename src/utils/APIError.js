class APIError extends Error {
	constructor(
		statusCode,
		message = "Something went wrong",
		errors = [],
		stack = ""
	) {
		super(message);
		this.statusCode = statusCode;
		this.data = null; // Indicates no data should be expected in the response when an error occurs.
		this.message = message;
		this.success = false;
		this.errors = errors;

		//Why this : ?? Important ! Learn!! =>
		if (stack) {
			this.stack = stack;
		} else {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}


export {APIError}
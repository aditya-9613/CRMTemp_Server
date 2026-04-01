import { createUser, getUser, loginUser } from '../services/user.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Register Controller
const registerController = asyncHandler(async (req, res) => {
    const user = await createUser(req.body);

    return res.status(201).json(
        new ApiResponse(201, user, 'User created successfully')
    );
});

// Login Controller
const loginController = asyncHandler(async (req, res) => {
    const result = await loginUser(req.body);

    return res.status(200).json(
        new ApiResponse(200, result, 'User logged in successfully')
    );
});

//Get User Details
const userDetailsControllers = asyncHandler(async (req, res) => {
    const data = await getUser(req.user.id)

    return res
        .status(200)
        .json(
            new ApiResponse(200, { data }, 'User Details')
        )
})

export {
    registerController,
    loginController,
    userDetailsControllers
}
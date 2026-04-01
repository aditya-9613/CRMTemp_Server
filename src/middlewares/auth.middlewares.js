import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { createSupabaseClient } from "../config/supabaseClient.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        // ✅ create client with token
        const supabase = createSupabaseClient();

        const { data: user, error } = await supabase
            .from("users")
            .select("id")
            .eq("id", decodedToken?.id)
            .single();

        if (error || !user) {
            throw new ApiError(401, "Unauthorized request");
        }

        req.user = user;

        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access Token");
    }
});
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandlar } from "../utils/asycnHandlar.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandlar(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if (!token) {
            throw new apiError(404, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            
            throw new apiError(401, "Invalid Access Token")
        }
    
        req.user = user
        next()
        
    } catch (error) {
        throw new apiError(401, error?.message || "Invaild access Token")
    }

})
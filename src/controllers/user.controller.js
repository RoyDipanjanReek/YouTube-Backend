import { asyncHandlar } from "../utils/asycnHandlar.js"
import {apiError} from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import {uplodeOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import { apiResponce } from "../utils/apiResponce.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessAndRefereshToken = async(userId) => {   // Function that generate Access and Refresh Token start here
    try {
       const user = await User.findById(userId)
       const accessToken = user.generateAccessToken()
       const refreshToken = user.generateRefreshToken()

       user.refreshToken = refreshToken
       await user.save({ validateBeforeSave: false})

       return {accessToken, refreshToken}

    } catch (error) {
        throw new apiError(500, "Something went worng while using access and refresh token")
    }
}   
// Function that generate Access and Refresh Token end here



const registerUser = asyncHandlar (async(req,res) => {      // Function to handle registration details start here
    // get user details from frontend

    const {fullName, userName,email, password} = req.body

    // console.log("email", email);
    // validation - not empty
    // if (fullName === "") {
    //     throw new apiError(400, "full name is required")
    // }

    if (
        [fullName, email, userName, password].some((field) => 
            field?.trim() === "")
    ) {
        throw new apiError(400, "All field are required")
    }

    // check if user already exists: username and email
    const exsistedUser = await User.findOne({
        $or: [{userName},{email}]
    })

    if(exsistedUser){
        throw new apiError(409, "User with email or User name already exit")
    }

    // check for image and for avater

    const avaterLocalPath = req.files?.avater[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath =req.files.coverImage[0].path
    }

    if (!avaterLocalPath) {
        throw new apiError(400, "Avater file is required")
        
    }
    // upload them to cloudinary, avater
    const avater = await uplodeOnCloudinary(avaterLocalPath)
    const coverImage = await uplodeOnCloudinary(coverImageLocalPath)

    if(!avater){
        throw new apiError(400, "Avater file is required")
    }

    // create user object- create entry in db

    try {
        const user = await User.create({
            fullName,
            avater: avater.url,
            coverImage:coverImage?.url || "",
            email,
            password,
            userName: userName.toLowerCase()
        })
    
        // remove password and refresh Token field from responce
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
    
        // check for user creation
        if(!createdUser){
            throw new apiError(500, "Something went wrong while registering the user")
        }
    
         // return res
        return res
        .status(201)
        .json(
            new apiResponce(200, createdUser, "User registered")
        )
    } catch (error) {
        console.log("User creation fsiled");
        

        if (avater) {
            await deleteFromCloudinary(avater.public_id)
        }

        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id)
        }

        throw new apiError(500, "Something went wrong while registering the user and Images were deleted")

    }
})  
// Function to handle registration details end here



const loginUser = asyncHandlar(async (req, res) => {        // Function to handle user login details starts here

    const {email, userName, password} = req.body
    // console.log(email);
    if (!userName && !email) {
        throw new apiError(400, "username or email is required")
    }
    const user = await User.findOne({
        $or: [{userName}, {email}]
    })
    if (!user) {
        throw new apiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)
   if (!isPasswordValid) {
    throw new apiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiError(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

//     const {email, userName, password} = req.body

//     // username or emali
//     if(!userName && !email){
//         throw new apiError(400, "user name or email is required")
//     }

//     // find the user 
//     const user = await User.findOne({
//         $or: [{userName}, {email}]
//     })

//     if(!user){
//         throw new apiError(404, "User does not exist")
//     }

//     // password check
//     const isPasswordValid = await user.isPasswordCorrect(password)

//     if(!isPasswordValid){
//         throw new apiError(404, "Password incorrect")
//     }

    
//      // access and refresh token
//     const {accessToken, refreshToken} = await generateAccessAndRefereshToken(user._id)

//     const loggedInUser = User.findById(user._id).select("-password -refreshToken")

//     const options = {
//         httpOnly : true,
//         secure: true
//     }

//     return res
//     .status(200)
//     .cookie("accessToken", accessToken, options)
//     .cookie("refreshToken", refreshToken, options)
//     .json(
//         new apiResponce(
//             200,
//             {
//                 user: loggedInUser, 
//                 accessToken, 
//                 refreshToken

//             },
//             "User logged in successfully"
//         )
//     )
})  
// Function to handle user login details ends here




    const logOutUser = asyncHandlar(async (req, res) => {   // Function to handle user logout details starts here
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1
                }
            },
            {
                new: true
            }
        )

        const options = {
            httpOnly : true,
            secure: true
        }

        return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponce(200, {} , "user logged out"))
    })
    // Function to handle user logout details starts here



    
    const refreshAccessToken = asyncHandlar(async (req, res) => {   //Refresh and access token program starts here

        const incommingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

        if(!incommingRefreshToken) {
            throw new apiError(401, "unauthorized request")
        }

        try {
            const decodedToken = jwt.verify(
                incommingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
            )
    
            const user = await User.findById(decodedToken?._id)
    
            if(!user) {
                throw new apiError(401, "Invalid Refresh Token")
            }
    
            if (incommingRefreshToken !== user?.refreshToken) {
                throw new apiError(401, "Refresh Token expire or used")
            }
    
            const options = {
                httpOnly: true,
                secure: true
            }
    
            const {accessToken, newrefreshToken} = await generateAccessAndRefereshToken(user._id)
    
            return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new apiResponce(
                    200,
                    {accessToken, refreshToken: newrefreshToken},
                    "Access token refreshed successfully"
                )
            )
        } catch (error) {
            throw new apiError(401, error?.message || "Invalid redresh Token")
        }
    });

    //Refresh and access token program ends here




    const changeCurrentPassword = asyncHandlar(async (req, res) => {    // Change current password program start here
        const {oldPassword, newPassword} = res.body

        const user = await User.findById(res.user?._id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if (!isPasswordCorrect) {
            throw new apiError(400, "Invalid password")
        }

        user.password = newPassword
        await user.save({validateBeforeSave: false})

        return res.status(200)
        .json(new apiResponce(200, {}, "Password changed successfully" ))
    }) ;
     // Change current password program ends her



    const getCurrentUser = asyncHandlar(async(req, res) => {    // current user details here comes forms here
        return res
        .status(200)
        .json(200, req.user, "current user fatched successfully")
    })  // current user details here comes forms here. end--------- 




    const updateAccountDetails = asyncHandlar(async(req,res) => { // from here i'm able to update my account details 
        const{ fullName,email} = req.body

        if (!fullName || !email) {
            throw new apiError(400, "All fields are required")
        }
        
        
        const user =  User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullName,
                    email,
                }
            },
            {new: true}
        ).select("-password")

        return res.status(200)
        .json(new apiResponce(200, user,"Account details updated successfully"))
    })      // from here i'm able to update my account details ends here




    const updateUserAvater = asyncHandlar(async( req, res) => {     // profile picture changes from here, program starts here 
        const avaterLocalPath = req.file?.path

        if (!avaterLocalPath) {
            throw new apiError(400, "Avater file is missing")
        }

        const avater =await uplodeOnCloudinary(avaterLocalPath)

        if(!avater.url){
            throw new apiError(400, "Error while uploading on avater")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    avater: avater.url
                }
            },
            {new: true}
        ).select("-password")

        return res
        .status(200)
        .json(
            new apiResponce(200, user, "avater updated successfully ")
        )
    })  // profile picture changes from here, program ends here 



    
    const updateUserCoverImage = asyncHandlar(async( req, res) => { // cover Img changes from here, program starts here 
        const coverImgLocalPath = req.file?.path

        if (!coverImgLocalPath) {
            throw new apiError(400, " cover Img is missing")
        }

        const coverImage = await uplodeOnCloudinary(coverImgLocalPath)

        if(!coverImage.url){
            throw new apiError(400, "Error while uploading on avater")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    coverImage: coverImage.url
                }
            },
            {new: true}
        ).select("-password")
        return res
        .status(200)
        .json(
            new apiResponce(200, user, "Cover Img updated successfully ")
        )
    })// cover Img changes from here, program ends here 



    const getUserChannelprofile = asyncHandlar(async(req,res) => {  // I can access user channel detais from here. 
        const {userName} = req.params

        if(!userName?.trim()){
            throw new apiError(400, "user name is missing")
        }

        const channel = await User.aggregate([
            {
                $match: {
                    userName : userName?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscriberdTo"
                }
            },
            {
                $addFields: {
                    subscribersCount : {
                        $size : "$subscribers"
                    },
                    channelsSubscribedToCount: {
                        $size : "$subscriberdTo"
                    },
                    isSubcribed: {
                        $cond : {
                            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                            then : true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    fullName: 1,
                    userName: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubcribed: 1,
                    avater: 1,
                    coverImage: 1,
                    email: 1,
                }
            }
        ])

        if (!channel?.length) {
            throw new apiError(404, "channel does not exists")
        }

        return res.status(200)
        .json(
            new apiResponce(200, channel[0], "User channel fetched successfully")
        )
    })      // I can access user channel detais from here. ends here



    const getWatchHistory = asyncHandlar(async(req,res) => { // watch history can assess from here
        const user =  await User.aggregate([
            {
              $match :{
                _id: new mongoose.Types.ObjectId(req.user._id)
              }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from : "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            userName: 1,
                                            avater: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }

            }
        ])

        return res.status(200)
        .json(
            new apiResponce(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        )
    })      // watch history can assess from here, ends here


export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvater,
    updateUserCoverImage,
    getUserChannelprofile,
    getWatchHistory
}
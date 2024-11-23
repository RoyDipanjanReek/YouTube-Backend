import mongoose, {isValidObjectId}  from "mongoose";
import {Tweet} from "../models/tweet.model.js"
import User from "../models/user.model.js"
import { apiResponce } from "../utils/apiResponce.js";
import {apiError} from "../utils/ApiError.js"
import { asyncHandlar } from "../utils/asycnHandlar.js";


const createTweet = asyncHandlar(async (req, res) => {
    // const owner = req.User._id
    const content = req.body

    if(content === ""){
        throw new apiError(400, "content is required")
    }

    const tweet = await Tweet.create({
        content, 
        owner: req.User?._id
    })

    if(!tweet){
        throw new apiError(500, "Something went wrong")
    }

    return res
    .status(200)
    .json(
        new apiResponce(200, tweet, "tweet successfully created")
    )


})
const getUserTweet = asyncHandlar(async (req, res) => {

    const {userId} = req.params
    isValidObjectId(userId, "User")

    const result = await Tweet.find({owner: userId})

    return res
    .status(200)
    .json(
        new apiResponce(200, result, "successflly fetched user Tweet")
    )

})


const updateTweet = asyncHandlar(async (req, res) => {    

})
const deleteTweet = asyncHandlar(async (req, res) => {

})

export{
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
}
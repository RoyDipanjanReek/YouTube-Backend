import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {apiError} from "../utils/ApiError.js"
import {apiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if (!videoId || !isValidObjectId(videoId)) {
        throw new apiError(400, "No valid video id found")
    }

    const videoLikedAlreadyExist = await Like.findOne({
        video: videoId,
        user:   req.user?._id
    })

    if (videoLikedAlreadyExist) {
        await Like.findOneAndDelete(videoLikedAlreadyExist._id)
    }else{
        await Like.create({
            video: videoId,
            likedBy : req.user?._id
        })
        return res.status(200).json(
            new apiResponse(200, 
                {},
                `Video like has been ${videoLikedAlreadyExist? "removed": "added"} successfully` )
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if (!commentId || !isValidObjectId(commentId)) {
        throw new apiError(400, "No valid comment id found")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new apiError(404, "Comment dosen't exist")
    }

    // if user has already like liked
    const isLikedAlready = await Like.findOne({
        commentId,
        likedBy: req.user?._id
    })

    if (isLikedAlready) {
        await Like.findOneAndDelete({
            commentId,
            likedBy: user?._id
        })
        return res.status(200).json(
            new apiResponse(200, 
                {
                    isliked: false,
                },
                "Unliked Successfully"
             )
        )
    }else{
        // if not liked,
        await Like.create({
            commentId,
            likedBy: user?._id
        })
        return res.status(200).json(
            new apiResponse(
                200,
                {
                    isliked: true,
                },
                "Like added successfully"
            )
        )
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new apiError(400, "No tweet id is found")
    }

    const TweetLikeAlreadyExist = await Like.findOne(
        {
            tweet: tweetId,
            user: user?._id
        }
    )

    if (TweetLikeAlreadyExist) {
        await Like.findOneAndDelete(TweetLikeAlreadyExist._id)
    }else{
        await Like.create({
            tweet: tweetId,
            likedBy: user?._id
        })
    }

    return res.status(200).json(
        new apiResponse(200, {}, `Tweet has been ${TweetLikeAlreadyExist? " removed": "added"}`)
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos


})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
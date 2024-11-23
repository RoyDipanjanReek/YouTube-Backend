import { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {apiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body

    if (!videoId || !isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid Video Id")
    }
    if (!content) {
        throw new apiError(400, "Content required")
    }
    const comment = await Comment.create({
        content,
        video : videoId,
        owner : req.User._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const {commentId} = req.params()
    const {content} = req.body
    const {_id: userId} = req.User

    const comment = Comment.findById(commentId)

    if (!comment) {
        throw new apiError(400, "content doesn't found")
    }

    if (!content?.trim()) {
        throw new apiError(400, "Comment cannot be empty")
    }

    if(comment.owner?.toString() !== userId?.toString()){
        throw new apiError(400, "You are not the owner of this comment")
    }

    const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {content}
        },
        {
            new: true
        }
    )
    
    if (!updateComment) {
        throw new apiError(400, "Error while updating comment")
    }

    return res
    .status(200)
    .json(200, updateComment, "Comment Updated Successfully")
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId} = req.params()
    const {_id: userId} = req.User

    if (!commentId || isValidObjectId(commentId)) {
        throw new apiError(500, "Invalid comment ID")
    }

    const comment = Comment.findById(commentId)

    if (!comment) {
        throw new apiError(500,"Comment not found")
    }

    if(comment.owner?.toString() !== userId?.toString()){
        throw new apiError(400, "You are not the owner of this comment to delete")
    }
    
    const deleteComment = await Comment.findByIdAndDelete(commentId)

    if (!deleteComment) {
        throw new apiError(500, "Error while deleting comment")
    }

    res
    .status(200)
    .json(200, {}, "Comment deleted successfully")
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}
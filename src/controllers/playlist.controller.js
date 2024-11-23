import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {apiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { json } from "express"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist

    if ([name, description].some((field) => field?.trim() === "")) {
        throw new apiError(404, "Both field are required")
    }

    const playlist = await playlist.create({
        name,
        description,
        owner : req.user?.id
    })

    const createdPlayList = await playlist.findById(playlist._id)

    if (!createdPlayList) {
        throw new apiError(500, "Failed to create playlist")
    }

    return res
    .status(200)
    .json(200, createdPlayList, "Playlist created successfully")
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!(isValidObjectId(playlistId) && isValidObjectId(videoId))) {
        throw new apiError(400, "Invalid videoId or playlist")
    }

    const playlist = await Playlist.findById(playlistId)
    const video = await videoId.findById(videoId)

    if (!playlist) {
        throw new apiError(400, "playlist is mot found")
    }

    if (!video) {
        throw new apiError(400, "videolist is not found")
    }

    if (!video.isPublished()) {
        throw new apiError(404, "unpublished video cannot be added to  a play list")
    }

    if (playlist.owner?.toString() && video.owner?.toString() !== req.User?._id.toString()) {
        throw new apiError(400, "you are not authorized to update this playlist. Only pwner can do it")
    }

    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet : {
                videos : videoId
            }
        },
        {new: true}
    )

    if (!updatePlaylist) {
        throw new apiError(400, "Video not found & thus failed to add video to playlist")
    }

    return res
    .status(200)
    .json(200, updatePlaylist, "video add to playlist successfully")
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (!(isValidObjectId(playlistId) && (isValidObjectId(videoId)))) {
        throw new apiError(400, "playlist or videolist is not found")
    }

    const playlist = await Playlist.findById(playlistId)
    const video = await Video.findById(playlistId)

    

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
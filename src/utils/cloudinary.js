import { v2 as cloudinary } from "cloudinary";
import fs from "fs"  //file system
import { log } from "console";

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });
    
   const uplodeOnCloudinary = async(localFilePath) => {
    try {
        if (!localFilePath) return null
            const responce = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto"
            })
        //
        // console.log("file is uploded is in cloudinary ", responce.url);
        fs.unlinkSync(localFilePath)
        return responce
        
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally save temporary file as the upload operation got failed
        return null
    }
   }

   const deleteFromCloudinary = async(publicId) => {
    try {
        const result = cloudinary.uploader.destroy(publicId)
        console.log("Deleted from cloudiary", publicId);
        
    } catch (error) {
        console.log("Error deleting from cloudinary", error);
        return null
    }
   }

   export {uplodeOnCloudinary, deleteFromCloudinary}
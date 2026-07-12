import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadFileOnCloudinary = async (filePath) => {

    try{
        if(!filePath) {
            console.error('File path is required for uploading to Cloudinary.');
            return null;
        }

        const res = await cloudinary.uploader.upload( filePath, 
            { 
                resource_type: 'auto' // This detect the file type
            }
        )
        
        console.log("file uploaded", res.url);
        fs.unlinkSync(filePath); // Delete the file from local storage after uploading
        return res;
    }
    catch(err) {
        console.error('Error uploading file to Cloudinary:', err);
        console.log("Cloudinary Config:", cloudinary.config());
        fs.unlinkSync(filePath); // Ensure the file is deleted from local storage even if upload fails
        return null;
    }

    
}

export { uploadFileOnCloudinary } ;
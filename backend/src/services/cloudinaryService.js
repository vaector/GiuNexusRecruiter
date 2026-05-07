const cloudinary = require('cloudinary').v2

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadImage = async (buffer) => {
    const base64 = buffer.toString("base64")
    const dataUri = `data:image/jpeg;base64,${base64}`
    
    const result = await cloudinary.uploader.upload(dataUri, {
        folder: "profile_pictures"
    })
    
    return result
}

module.exports = { uploadImage }
const cloudinary = require('cloudinary').v2

cloudinary.config(process.env.CLOUDINARY_URL)

const uploadImage = (buffer) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder: "profile_pictures" },
            (error, result) => {
                if (error) reject(error)
                else resolve(result)
            }
        ).end(buffer)
    })
}

module.exports = { uploadImage }
const multer = require('multer')

const storage = multer.memoryStorage()

const upload = multer({
    storage,
    limits: {fileSize: 5 * 1024 * 1024},
    fileFilter: (req, file, cb) => {
        if(file.mimetype.startsWith("image/"))
            cb(null, true)
        else
            cb(new Error("Only image files are allowed"), false)
    }
})

const DOCUMENT_MIMES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const documentUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || DOCUMENT_MIMES.includes(file.mimetype))
            cb(null, true)
        else
            cb(new Error('Only PDF, Word documents, and images are allowed'), false)
    }
})

module.exports = upload
module.exports.documentUpload = documentUpload
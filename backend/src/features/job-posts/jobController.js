const hf = require("../../services/hfService");
// TODO: job post controller functions

const JobPost = require("./JobPost")

// POST /api/v1/jobs
const createJob = async(req, res, next) => {
    try {
        if(req.user.status !== "approved") {
            return res.status(403).json({
                success: false,
                message: "Your account is pending approval. Wait for admin approval before posting jobs."
            })
        }

        const {title, company, description, requirements, location, type, salary, totalSlots} = req.body

        if(!title || !company || !description || !requirements || requirements.length === 0 || !location || !type) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            })
        }

        let category = "Other"

        try {
            const result = await hf.zeroShotClassification({
                model: "facebook/bart-large-mnli",
                inputs: [description],
                parameters: {
                    candidate_labels: ["Frontend", "Backend", "AI/ML", "DevOps", "Data Engineering", "Other"]
                }
            })
            category = result[0].labels[0]
        }
        catch(error) {
            console.error("AI classification failed: ", error.message)
        }

        const job = await JobPost.create({
            title, company, description, requirements, location, type, salary, totalSlots, category, createdBy: req.user._id
        })

        return res.status(201).json({
            success: true,
            job
        })
    }
    catch(error) {
        next(error)
    }
}

// PATCH /api/v1/jobs/:id
const updateJob = async(req, res, next) => {
    try {
        const job = await JobPost.findById(req.params.id)

        if(!job) {
            return res.status(404).json( {
                success: false,
                message: "Job not found"
            })
        }

        if(job.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: " Not authorised to edit this job"
            })
        }

        const fields = ["title", "company", "description", "requirements", "location", "type", "salary", "totalSlots", "status"]

        for(const field of fields) {
            if(req.body[field] !== undefined) {
                job[field] = req.body[field]
            }
        }

        if(req.body.description) {
            try {
                const result = await hf.zeroShotClassification({
                    model: "facebook/bart-large-mnli",
                    inputs: [req.body.description],
                    parameters: {
                        candidate_labels: ["Frontend", "Backend", "AI/ML", "DevOps", "Data Engineering", "Other"]
                    }
                })
                job.category = result[0].labels[0];
            }
            catch(error) {
                console.error("AI classification failed: ", error.message)
            }
        }

        await job.save()
        return res.status(200).json({
            success: true,
            job
        })
    }
    catch(error) {
        next(error)
    }
}

// DELETE /api/v1/jobs/:id
const deleteJob = async(req, res, next) => {
    try {
        const job = await JobPost.findById(req.params.id)

        if(!job) {
            return res.status(404).json( {
                success: false,
                message: "Job not found"
            })
        }

        if(job.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Not authorised to delete this job"
            })
        }
        
        await job.deleteOne()
        return res.status(200).json({
            success: true,
            message: "Job deleted"
        })
    }
    catch(error) {
        next(error)
    }
}

module.exports = {createJob, updateJob, deleteJob}
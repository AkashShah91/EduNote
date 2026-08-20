const Section = require('../models/Section');
const SubSection = require('../models/SubSection');
const { uploadImageToCloudinary } = require('../utils/imageUploader');

require('dotenv').config();
exports.createSubSection = async (req, res) => {
    try {
        //fetch data
        const { title, description, sectionId } = req.body;
        //extract file for video
        const video = req.files.videoFile;
        //validation
        console.log(req.files);
        console.log(title);
        console.log(description);
        console.log(video);
        console.log(sectionId);
        if (!title || !description || !video || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        //upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
        //create subsection
        const newSubSection = await SubSection.create({
            title: title,
            timeDuration: `${uploadDetails.duration}`,
            description: description,
            videoUrl: uploadDetails.secure_url
        });
        //update this subsection with this object id
        const updatedSubSectionDetails = await Section.findByIdAndUpdate({ _id: sectionId }, {
            $push: {
                subSection: newSubSection._id
            }
        }, { new: true }).populate("subSection");;
        return res.status(200).json({
            success: true,
            message: "Subsection created successfully",
            updatedSubSectionDetails
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error while creating subsection"
        })
    }
}

exports.updateSubSection = async (req, res) => {
    try {
        //fetch data
        const { title, sectionId, description, subSectionId } = req.body;
        //update
        const subSection = await SubSection.findById(subSectionId);
        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            })
        }
        if (title !== undefined) {
            subSection.title = title;
        }
        if (description !== undefined) {
            subSection.description = description;
        }
        if (req.files && req.files.video !== undefined) {
            const video = req.files.video;
            const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
            subSection.videoUrl = uploadDetails.secure_url;
            subSection.timeDuration = `${uploadDetails.duration}`;
        }
        await subSection.save();
        const updatedSection = await Section.findById(sectionId).populate("subSection");
        console.log("Updated section", updatedSection);
        //return res
        return res.status(200).json({
            success: true,
            message: "SubSection updated successfully",
            updatedSection
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error while updating subSection"
        });
    }
}
exports.deleteSubSection = async (req, res) => {
    try {
        //fetch data
        const { subSectionId, sectionId } = req.body;
        //remove from section and then delete subsection
        await Section.findByIdAndUpdate({ _id: sectionId }, {
            $pull: {
                subSection: subSectionId
            }
        })
        //delete by id
        const deletedSubSection = await SubSection.findByIdAndDelete(subSectionId);

        if (!deletedSubSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found"
            });
        }
        //find updatedsection and return it
        const updatedSection = await Section.findById(sectionId).populate("subSection")
        //return res
        return res.status(200).json({
            success: true,
            message: "SubSection deleted successfully",
            data: updatedSection
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error while deleting subsection"
        });
    }
}
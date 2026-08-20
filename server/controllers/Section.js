const Course = require('../models/Course');
const Section = require('../models/Section');
const SubSection = require('../models/SubSection');
exports.createSection = async (req, res) => {
    try {
        //data fetch
        const { sectionName, courseId } = req.body;
        //validation
        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        //create section
        const newSection = await Section.create({ sectionName });
        //update course with section objectid
        const updatedCourseDetails = await Course.findByIdAndUpdate(courseId, {
            $push: {
                courseContent: newSection._id
            }
        }, {
            new: true
        }).populate({
            path: "courseContent",
            populate: {
                path: "SubSection",
            },
        })
            .exec();;
        return res.status(200).json({
            success: true,
            message: "Section created successfully",
            updatedCourseDetails
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error while creating section"
        })
    }
}

exports.updateSection = async (req, res) => {
    try {
        //data fetch
        const { sectionName, sectionId, courseId } = req.body;
        //validation
        if (!sectionName || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        //update
        const section = await Section.findByIdAndUpdate(sectionId, { sectionName }, { new: true });
        const course = await Course.findById(courseId)
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })
            .exec();
        //return res
        return res.status(200).json({
            success: true,
            message: "Section updated successfully",
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error while updating section"
        });
    }
}

exports.deleteSection = async (req, res) => {
    try {
        //fetch data
        const { sectionId,courseId } = req.body;
        await Course.findByIdAndUpdate(courseId,{
            $pull:{
                courseContent:sectionId
            }
        });
        const section=await Section.findById(sectionId);
        console.log(sectionId,courseId);
        if(!section) {
			return res.status(404).json({
				success:false,
				message:"Section not Found",
			})
		}
        //delete subsection
        await SubSection.deleteMany({
            _id:{
                $in: section.subSection
            }
        });
        //delete by id
        await Section.findByIdAndDelete(sectionId);
        //find the updated course and return
        const course=await Course.findById(courseId).populate({
            path:"courseContent",
            populate:{
                path:"subSection"
            }
        })
        //return res
        return res.status(200).json({
            success: true,
            message: "Section deleted successfully",
            data:course
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error while deleting section"
        });
    }
}
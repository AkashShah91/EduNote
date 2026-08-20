const User = require('../models/User');
const Category = require('../models/Category');
const Course = require('../models/Course');
const Section = require('../models/Section');
const SubSection = require('../models/SubSection');
const { uploadImageToCloudinary } = require('../utils/imageUploader');
const CourseProgress = require('../models/CourseProgress');
const { convertSecondsToDuration } = require("../utils/secToDuration")
require('dotenv').config();

exports.createCourse = async (req, res) => {
    try {
        //fetch data
        let { courseName, courseDescription, whatYouWillLearn, price, tag: _tag, category, status, instructions: _instructions } = req.body;
        //get thumbnail
        const thumbnail = req.files.thumbnailImage;
        // Convert the tag and instructions from stringified Array to Array
        const tag = JSON.parse(_tag);
        const instructions = JSON.parse(_instructions);
        //validation
        if (!courseName || !courseDescription || !whatYouWillLearn || !price || !tag.length || !thumbnail || !category || !instructions.length) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        if (!status || status === undefined) {
            status = "Draft";
        }
        //check for instructor details
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId, {
            accountType: "Instructor"
        });
        console.log("Instructor details", instructorDetails);
        if (!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: "Instructor details not found"
            });
        }
        //check given tag is valid or not
        const categoryDetails = await Category.findById(category);
        console.log("Category details", categoryDetails);
        if (!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: "Tag details not found"
            });
        }

        //upload image to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        //create db entry for new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag,
            thumbnail: thumbnailImage.secure_url,
            category: categoryDetails._id,
            status: status,
            instructions
        });
        //add the new course to the user schema of instructor
        await User.findByIdAndUpdate(
            {
                _id: instructorDetails._id
            },
            {
                $push: {
                    courses: newCourse._id
                }
            },
            {
                new: true
            }
        );
        //add the new course to category schema
        const categoryDetails2 = await Category.findByIdAndUpdate(
            {
                _id: category
            },
            {
                $push: {
                    courses: newCourse._id
                }
            },
            {
                new: true
            }
        );
        return res.status(200).json({
            success: true,
            message: "Course created Successfully",
            data: newCourse
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Course creation failed"
        })
    }
}

exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.find(
            { status: "Published" },
            {
                courseName: true,
                price: true,
                thumbnail: true,
                instructor: true,
                studentsEnrolled: true,
                ratingAndReviews: true
            }).populate("instructor").exec();
        return res.status(200).json({
            success: true,
            message: "All Courses returned Successfully",
            data: allCourses
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while returning all courses"
        });
    }
}

//get course details
exports.getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body;
        const courseDetails = await Course.findOne({ _id: courseId }).populate({
            path: "instructor",
            populate: {
                path: "additionalDetails"
            }
        }).populate("category").populate("ratingAndReviews").populate({
            path: "courseContent",
            populate: {
                path: "subSection",
                select: "-videoUrl"
            }
        }).exec();
        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with id: ${courseId}`,
            })
        }
        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
            },
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

//edit course details
exports.editCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const updates = req.body;
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "COurse not found"
            });
        }
        //update the thumbnail image if requested
        if (req.files) {
            console.log("Thumbnail update:");
            const thumbnail = req.files.thubmnailImage;
            const thubmnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);
            course.thumbnail = thubmnailImage.secure_url;

        }

        //updating only the fields that are requested in the bodody request
        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
                if (key === "tag" || key === "instructions") {
                    course[key] = JSON.parse(updates[key]);
                }
                else {
                    course[key] = updates[key];
                }
            }
        }
        await course.save();
        const updatedCourse = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })
            .exec();

        res.json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        })
    }
}


//get full course details;
exports.getFullCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id;
        const courseDetails = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })
            .exec();
        let courseProgressCount = await Course.findOne({
            courseID: courseId,
            userId: userId
        });
        console.log("courseProgressCount : ", courseProgressCount)

        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with id: ${courseId}`,
            })
        }


        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
                completedVideos: courseProgressCount?.completedVideos
                    ? courseProgressCount?.completedVideos
                    : [],
            },
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

//get the list of courses for given instructor
exports.getInstructorCourses = async (req, res) => {
    try {
        //get the instructor id for authenticated user or from the request body
        const instructorId = req.user.id;
        //get all the courses belonging to the same instructor
        const instructorCourses = await (await Course.find({ instructor: instructorId })).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: instructorCourses,
        })
    }
    catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Failed to retrieve instructor courses",
            error: error.message,
        })
    }
}

//delete course
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        //find the course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" })
        }
        //unenroll students from course
        const studentsEnrolled = course.studentsEnrolled;
        for (const studentId of studentsEnrolled) {
            await User.findByIdAndUpdate(studentId, {
                $pull: {
                    courses: courseId
                }
            });
        }

        //delete section and sub sections
        const courseSections = course.courseContent;
        for (const sectionId of courseSections) {
            //delete teh subsection of section
            const section = await Section.findById(sectionId);
            if (section) {
                const subSections = section.subSection;
                for (const subSectionId of subSections) {
                    await SubSection.findByIdAndDelete(subSectionId);

                }
            }
            //delete the section
            await Section.findByIdAndDelete(sectionId);
        }
        //delete the  course
        await Course.findByIdAndDelete(courseId);
        return res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        })
    }
    catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        })
    }
}
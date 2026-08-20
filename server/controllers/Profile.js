const Course = require('../models/Course');
const Profile = require('../models/Profile');
const User = require('../models/User');
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const CourseProgress = require("../models/CourseProgress")
const mongoose = require("mongoose");


const { convertSecondsToDuration } = require("../utils/secToDuration");
exports.createProfile = async (req, res) => {
    try {
        //fetch data
        const { firstName = "", lastName = "", dateOfBirth = "", about = "", contactNumber = "", gender = "" } = req.body;
        //get user id
        const userId = req.user.id;
        //validation
        if (!contactNumber || !gender || !userId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        //find profile
        const userDetails = await User.findById(userId);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);
        //update profile
        const user = await User.findByIdAndUpdate(userId, {
            firstName,
            lastName,
        })
        await user.save()
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.contactNumber = contactNumber;
        profileDetails.gender = gender;
        profileDetails.about = about;
        //save the changes
        profileDetails.save();
        //find the updated user details
        const updatedUserDetails = await User.findById(userId).populate("additionalDetails").exec();
        return res.status(200).json({
            success: true,
            message: "Profile created successfully",
            updatedUserDetails
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error while creating Profile"
        });
    }
}

//delete account

exports.deleteAccount = async(req, res) => {
    try {
        //get id
        const userId = req.user.id;
        //validation
        const userDetails = await User.findById(userId);
        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        //delete profile i..e additionaldetails in userschema
        await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });
        for (const courseId of userDetails.courses) {
            await Course.findByIdAndUpdate(courseId, {
                $pull: {
                    studentsEnrolled: userId
                },
            }, {
                new: true
            });
        }
        //delete user
        await User.findByIdAndDelete({ _id: userId });
        await CourseProgress.deleteMany({ _id: userId })
        return res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error while deleting Account"
        });
    }
}

exports.getAllUserDetails = async (req, res) => {
    try {
        //get id
        const userId = req.user.id;
        //validation
        const userDetails = await User.findById(userId).populate("additionalDetails").exec();
        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "All users fetched successfully",
            userDetails
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error while getting all user details"
        });
    }
}

//update profile picture
exports.updateProfilePicture = async (req, res) => {
    try {
        const displayPicture = req.files.displayPicture;
        const userId = req.user.id;
        const image = await uploadImageToCloudinary(displayPicture, process.env.FOLDER_NAME, 1000, 1000);
        console.log(image);
        const updatedProfile = await User.findByIdAndUpdate({ _id: userId }, { image: image.secure_url }, { new: true });
        res.send({
            success: true,
            message: `Image Updated successfully`,
            data: updatedProfile,
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

//get enrolled courses
exports.getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        let userDetails = await User.findOne({ _id: userId }).populate({
            path: "courses",
            populate: {
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            },
        })
            .exec();
        userDetails = userDetails.toObject();
        var SubsectionLength = 0
        for (var i = 0; i < userDetails.courses.length; i++) {
            let totalDurationInSeconds = 0
            SubsectionLength = 0
            for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
                totalDurationInSeconds += userDetails.courses[i].courseContent[
                    j
                ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
                userDetails.courses[i].totalDuration = convertSecondsToDuration(
                    totalDurationInSeconds
                )
                SubsectionLength +=
                    userDetails.courses[i].courseContent[j].subSection.length
            }
        }
        let courseProgressCount = await CourseProgress.findOne({
            userId: userId,
            courseID: userDetails.courses[i]._id
        });
        courseProgressCount = courseProgressCount?.completedVideos.length;
        if (SubsectionLength === 0) {
            userDetails.courses[i].progressPercentage = 100;
        }
        else {
            //2 decimal point
            const multiplier = Math.pow(10, 2);
            userDetails.courses[i].progressPercentage = Math.round((courseProgressCount / SubsectionLength) * 100 * multiplier) / multiplier;
        }

        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find user with id: ${userDetails}`,
            })
        }
        return res.status(200).json({
            success: true,
            data: userDetails.courses,
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.instructorDashboard = async (req, res) => {
    try {
        const courseDetails = await Course.find({ instructor: req.user.id });
        const courseData = courseDetails.map((course) => {
            const totalStudentsEnrolled = course.studentsEnrolled.length;
            const totalAmountGenerated = totalStudentsEnrolled * course.price;
            //create a new object with additional details
            const courseDataWithStats = {
                _id: course._id,
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                totalStudentsEnrolled,
                totalAmountGenerated
            }
            return courseDataWithStats;
        });
        res.status(200).json({ courses: courseData });
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server Error" })
    }
}
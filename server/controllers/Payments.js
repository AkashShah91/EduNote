const { instance } = require('../config/razorpay');
const Course = require('../models/Course');
const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const { courseEnrollmentEmail } = require('../mail/templates/courseEnrollmentEmail');
const { default: mongoose } = require('mongoose');
const crypto = require('crypto');
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessfulEmail")
const CourseProgress = require("../models/CourseProgress")

//capture the paymentt and create the initiate the razorpay order

exports.capturePayment = async (req, res) => {
    try {
        //get courseId and userid
        const { course_id } = req.body;
        const userId = req.user.id;
        //validation
        if (!course_id) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid course details"
            });
        }
        let total_amount = 0;
        //valid course details
        let course;
        try {
            course = await Course.findById(course_id);
            if (!course) {
                return res.status(400).json({
                    success: false,
                    message: "could not find the course"
                });
            }
            //user already pay for the same course
            const uid = new mongoose.Types.ObjectId(userId);
            if (course.studentsEnrolled.includes(uid)) {
                return res.status(400).json({
                    success: false,
                    message: "Student is already enrolled"
                });
            }
            total_amount += course.price;
        }
        catch (error) {
            console.log(error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        //order create
        const amount = course.price;
        const currency = "INR";
        const options = {
            amount: amount * 100,
            currency,
            receipt: Math.random(Date.now()).toString(),
            notes: {
                courseId: course_id,
                userId
            }
        };
        try {
            //initiate the payment using razorpay
            const paymentResponse = await instance.orders.create(options);
            console.log(paymentResponse);

            return res.status(200).json({
                success: true,
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                thumbnail: course.thumbnail,
                orderId: paymentResponse.id,
                currency: paymentResponse.currency,
                amount: paymentResponse.amount,
                data: paymentResponse
            })
        }
        catch (err) {
            console.log(err);
            return res.status(400).json({
                success: false,
                message: "Could not initiate the payment"
            });
        }

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error while getting all user details"
        });
    }
}

//frontend verification for successful payment
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment Failed",
            });
        }
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET).update(body).digest("hex");
        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid Signature",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Payment Verified",
        });
    }
    catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Verification Failed",
        });
    }
}

exports.verifySignature = async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (signature === digest) {
        console.log("Payment is authorised");
        const { courseId, userId } = req.body.payload.payment.entity.notes;

        try {
            //find the course and enroll the student in it
            const enrolledCourse = await Course.findOneAndUpdate({ _id: courseId }, {
                $addToSet: {
                    studentsEnrolled: userId
                }
            }, { new: true });
            if (!enrolledCourse) {
                return res.status(400).json({
                    success: false,
                    message: "Course not found"
                })
            }
            const existingProgress = await CourseProgress.findOne({
                courseID: courseId,
                userId,
            });
            if (!existingProgress) {
                // create new progress
                const courseProgress = await CourseProgress.create({
                    courseID: courseId,
                    userId,
                    completedVideos: [],
                });
            }
            //find the student and add the course to their list enrolled courses
            const enrolledStudent = await User.findOneAndUpdate({ _id: userId }, {
                $addToSet: {
                    courses: courseId,
                    courseProgress: courseProgress._id,
                }
            }, { new: true });
            if (!enrolledStudent) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found"
                });
            }
            console.log(enrolledStudent);
            await mailSender(
                enrolledStudent.email,
                `Successfully Enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(
                    enrolledCourse.courseName,
                    `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
                )
            );
            return res.status(200).json({
                success: true,
                message: "Signature verified and course enrolled"
            })
        }

        catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "could not verify the signature"
            })
        }
    }
    else {
        return res.status(400).json({
            success: false,
            message: "Invalid Request"
        })
    }
}

//send confirmation mail
exports.sendSuccessfulPaymentEmail = async (req, res) => {
    const { orderId, paymentId, amount } = req.body;
    const userId = req.user.id;
    if (!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({
            success: false,
            message: "Please provide all the details"
        });
    }
    try {
        const enrolledStudent = await User.findById(userId);
        await mailSender(enrolledStudent.email, "Payment Received", paymentSuccessEmail(
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
            amount / 100,
            orderId,
            paymentId
        ));
        return res.status(200).json({
            success: true,
            message: "Payment success email sent",
        });
    }
    catch (error) {
        console.log("error in sending mail", error)
        return res.status(400).json({
            success: false,
            message: "Could not send email"
        })
    }
}

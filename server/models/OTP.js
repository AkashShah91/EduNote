const mongoose=require('mongoose');
const mailSender = require('../utils/mailSender');
const emailTemplate = require("../mail/templates/emailVerificationTemplate");
const OTPSchema= new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:5*60
    }
})

//function to send mail

// async function sendEmailVerification(email,otp){
//     try{
//         const mailResponse=await mailSender(email,"Verification mail from EduNote",otp);
//         console.log("Email sent successfully",mailResponse);
//     }
//     catch(error){
//         console.log("error occured while sending mail",error);
//         throw error;
//     }
// }
// OTPSchema.pre("save",async function(next){
//     await sendEmailVerification(this.email,this.otp);
//     next();
// })
// Define a function to send emails
async function sendVerificationEmail(email, otp) {
	// Create a transporter to send emails

	// Define the email options

	// Send the email
	try {
		const mailResponse = await mailSender(
			email,
			"Verification Email",
			emailTemplate(otp)
		);
		console.log("Email sent successfully: ", mailResponse.response);
	} catch (error) {
		console.log("Error occurred while sending email: ", error);
		throw error;
	}
}

// Define a post-save hook to send email after the document has been saved
// OTPSchema.pre("save", async function (next) {
// 	console.log("New document saved to database");

// 	// Only send an email when a new document is created
// 	if (this.isNew) {
// 		await sendVerificationEmail(this.email, this.otp);
// 	}
// 	next();
// });
OTPSchema.pre("save", async function () {
    console.log("Pre-save hook executed");
    console.log("New document saved to database");

    if (this.isNew) {
        console.log("Sending OTP to:", this.email);
        await sendVerificationEmail(this.email, this.otp);
    }
});

module.exports=mongoose.model("OTP",OTPSchema);
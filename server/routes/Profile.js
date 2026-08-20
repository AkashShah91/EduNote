const express=require('express');
const router=express.Router();

const {auth,isInstructor}=require('../middlewares/auth');
const{
    createProfile,
    deleteAccount,
    getAllUserDetails,
    updateProfilePicture,
    getEnrolledCourses,
    instructorDashboard
}=require('../controllers/Profile');

router.delete('/deleteProfile',auth,deleteAccount);
router.put('/updateProfile',auth,createProfile);
router.put('/updateProfilePicture',auth,updateProfilePicture);
router.get('/getUserDetails',auth,getAllUserDetails);
router.get('/getEnrolledCourse',auth,getEnrolledCourses);
router.get('/instructorDashboard',auth,isInstructor,instructorDashboard);
module.exports=router;

const express = require('express');
const router = express.Router();


//import the controllers

const {
    createCourse,
    getAllCourses,
    getCourseDetails,
    editCourse,
    getFullCourseDetails,
    getInstructorCourses,
    deleteCourse
} = require('../controllers/Course');

//categories controllers
const {
    showAllCategories,
    createCategory,
    categoryPageDetails
} = require('../controllers/Category');

//section controllers
const {
    createSection,
    updateSection,
    deleteSection
} = require('../controllers/Section');

//subsection controllers
const {
    createSubSection,
    updateSubSection,
    deleteSubSection
} = require('../controllers/Subsection');

//rating controllers
const {
    getAllRating,
    getAverageRating,
    createRating
} = require('../controllers/RatingAndReview');

const { updateCourseProgress } = require('../controllers/CourseProgress');

//importing middleware
const { auth, isInstructor, isAdmin, isStudent } = require('../middlewares/auth');




//courses can be created by instructors only
router.post('/createCourse',auth,isInstructor,createCourse);
// Edit Course routes
router.post('/editCourse',auth,isInstructor,editCourse);
// Get all Courses Under a Specific Instructor
router.get('/getInstructorCourses',auth,isInstructor,getInstructorCourses);
//Delete a Course
router.delete('/deleteCourse',deleteCourse);
//add section
router.post('/addSection',auth,isInstructor,createSection);
//update section
router.post('/updateSection',auth,isInstructor,updateSection);
//delte section
router.post('/deleteSection',auth,isInstructor,deleteSection);
//add subsection
router.post('/addSubSection',auth,isInstructor,createSubSection);
//update subsection
router.post('/updateSubSection',auth,isInstructor,updateSubSection);
//delete subsection
router.post('/deleteSubSection',auth,isInstructor,deleteSubSection);
//get course details
router.post('/getCourseDetails',getCourseDetails);
//get all courses
router.get('/getAllCourses',getAllCourses);
//get details for a specific course
router.post('/getFullCourseDetails',getFullCourseDetails);

router.post('/updateCourseProgress',auth,isStudent,updateCourseProgress);

//category can be created by adming only
router.post('/createCategory',auth,isAdmin,createCategory);
router.get('/showAllCategories',showAllCategories);
router.post('/getCategoryPageDetails',categoryPageDetails);


///rating and review
router.post('/createRating',auth,isStudent,createRating);
router.get('/getAverageRating',getAverageRating);
router.get('/getAllRating',getAllRating);

module.exports = router;

const express=require('express');
const router=express.Router();

//import controllers
const {capturePayment,verifyPayment,verifySignature,sendSuccessfulPaymentEmail}=require('../controllers/Payments');
const {auth,isAdmin,isInstructor,isStudent}=require('../middlewares/auth');

router.post('/capturePayment',auth,isStudent,capturePayment);
router.post('/verifyPayment',auth,isStudent,verifyPayment);
router.post('/verifySignature',auth,isStudent,verifySignature);
router.post('/sendSuccessfulPaymentEmail',auth,isStudent,sendSuccessfulPaymentEmail);
module.exports=router;

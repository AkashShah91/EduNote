const express=require('express');
const router=express.Router();

const{
    login,
    signUp,
    changePassword,
    sendOtp
}=require('../controllers/Auth');

const{
    resetPassword,
    resetPasswordToken
}=require('../controllers/ResetPassword');

const {
    auth
}=require('../middlewares/auth');

router.post('/login',login);
router.post('/signup',signUp);
router.post('/sendOtp',sendOtp);
router.post('/changePassword',auth,changePassword);

router.post('/reset-password-token',resetPasswordToken);
router.post('/reset-password',resetPassword);
module.exports=router;

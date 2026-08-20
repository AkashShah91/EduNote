const User=require('../models/User');
require('dotenv').config();
const jwt=require('jsonwebtoken');

//auth
exports.auth=async(req,res,next)=>{
    try{
        //extract token
        const token=req.body?.token || req.cookies?.token || req.header("Authorization").replace("Bearer ","");
        //if token is missing
        if(!token){
            return res.status(401).json({
                success:false,
                message:"Token missing"
            });
        }
        //verify the token
        //check whteher await will come or not
        try{
            const decode= jwt.verify(token,process.env.JWT_SECRET);
            console.log(decode);
            req.user=decode;
        }
        catch(err){
            console.log(err);
            return res.status(401).json({
                success:false,
                message:"Token cannot be verified"
            })
        }
        next();
    }
    catch(error){
        console.log(error);
            return res.status(401).json({
                success:false,
                message:"something went wrong while validating the token"
            })
    }
}

//isStudent

exports.isStudent=async(req,res,next)=>{
    try{
        if(req.user.accountType!=="Student"){
            return res.status(401).json({
                success:false,
                message:"This is protected route for students only"
            })
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified,please try again"
        })
    }
}

//isInstructor

exports.isInstructor=async(req,res,next)=>{
    try{
        if(req.user.accountType!=="Instructor"){
            return res.status(401).json({
                success:false,
                message:"This is protected route for Instructor only"
            })
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified,please try again"
        })
    }
}

//isAdmin

exports.isAdmin=async(req,res,next)=>{
    try{
        if(req.user.accountType!=="Admin"){
            return res.status(401).json({
                success:false,
                message:"This is protected route for Admin only"
            })
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified,please try again"
        })
    }
}
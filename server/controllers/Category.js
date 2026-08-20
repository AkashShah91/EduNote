const Category = require('../models/Category');
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}
const { Mongoose } = require("mongoose");

exports.createCategory = async (req, res) => {
    try {
        //fetch data
        const { name, description } = req.body;
        //validation
        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        //create entry in db
        const categoryDetails = await Category.create({
            name: name,
            description: description
        });
        return res.status(200).json({
            success: true,
            message: "Category created Successfully"
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating tag "
        });
    }
}

exports.showAllCategories = async (req, res) => {
    try {
        const allCategories = await Category.find({}, { name: true, description: true });
        return res.status(200).json({
            success: true,
            message: "All Categories returned Successfully",
            data: allCategories
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while returning all Categories"
        });
    }
}

//category page details
exports.categoryPageDetails = async (req, res) => {
    try {
        //get category id
        const { categoryId } = req.body;
        //get courses for selected category
        const selectedCategory = await Category.findById(categoryId)
            .populate({
                path: "courses",
                match: { status: "published" },
                populate: "ratingAndReviews"
            }).exec();
        // Handle the case when the category is not found
        if (!selectedCategory) {
            console.log("Category not found.")
            return res.status(404).json({
                success: false,
                message: "Category not found",
            })
        }
        //validation where there are no courses 
        if (selectedCategory.courses.length === 0) {
            console.log("No courses found for the given length");
            return res.status(404).json({
                success: false,
                message: "No courses found for the selected category.",
            })
        }
        //course for different categories
        const categoriesExceptSelected = await Category.find({
            _id: { $ne: categoryId }
        });
        let differentCategory = await Category.findOne(
            categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]._id
        ).populate({
            path: "courses",
            match: { status: "published" },
        }).exec();
        //get top selling courses from all categories
        const allCategories = await Category.find().populate({
            path: "courses",
            match: { status: "published" },
            populate: "instructor"
        }).exec();
        const allCourses = allCategories.flatMap((category) => category.courses);
        const mostSellingCourses = allCourses.sort((a, b) => b.sold - a.sold).slice(0, 10);
        res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategory,
                mostSellingCourses,
            },
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        })
    }
}
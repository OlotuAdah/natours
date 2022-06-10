const catchAsyncError = require("../utils/catchAsyncError");
const UserModel = require("../models/userModel");
const AppError = require("../utils/AppError");

exports.getUsers = catchAsyncError(async (req, res, next) => {
  const users = await UserModel.find();
  res.status(200).json({ status: "Sucess", users });
});

exports.getUser = (req, res, next) => {
  return res.status(200).json("Sending user with id: " + req.params.userId);
};

exports.updateMe = catchAsyncError(async (req, res, next) => {
  //1: create error if user posts password data
  const userData = { ...req.body };
  if (userData.password || userData.confirmPassword) {
    return next(
      new AppError(
        "This link is not for password update. Please use 'update password' button for that!",
        403
      )
    );
  }
  //2: filter out unwated fields sent by user and not allowed to be updated
  const fields = ["name"]; //add more fields in future; these are the only fields that user can update
  for (let el in userData) {
    if (!fields.includes(el)) delete userData[el];
  }
  //3: Update user data
  const updatedUser = await UserModel.findByIdAndUpdate(req.user.id, userData, {
    new: true,
    runValidators: true,
  });
  if (!updatedUser)
    return next(
      new AppError("Could not update user deatails. Try again later", 500)
    );

  res.status(200).json({ status: "Success", data: { user: updatedUser } });
});

exports.deleteMyAccount = catchAsyncError(async (req, res, next) => {
  ////Allows logged in user to set his/her account to inactive
  await UserModel.findOneAndUpdate(req.user.id, { active: false });
  res.status(200).json({ status: "Account deleted!" });
});

const catchAsyncError = require("../utils/catchAsyncError");
const UserModel = require("../models/userModel");
exports.getUsers = catchAsyncError(async (req, res, next) => {
  const users = await UserModel.find();

  res.status(200).json({ status: "Sucess", users });
});
exports.getUser = (req, res, next) => {
  return res.status(200).json("Sending user with id: " + req.params.userId);
};

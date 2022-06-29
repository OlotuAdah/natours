const catchAsyncError = require("../utils/catchAsyncError");
const UserModel = require("../models/userModel");
const AppError = require("../utils/AppError");
const multer = require("multer");
const sharp = require("sharp");

///

exports.getUsers = catchAsyncError(async (req, res, next) => {
  const filter = req.query;
  const users = await UserModel.find(filter);
  res.status(200).json({ status: "Sucess", users });
});

//allows users to get their data
exports.getMe = catchAsyncError(async (req, res, next) => {
  //get data of logged in user
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    return next(new AppError("No record found!", 401));
  }
  res.status(200).json({ status: "Sucess", user });
});

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
  const fieldsAllowedToBeUpdated = ["name", "email"]; //add more fields in future; these are the only fields that user can update
  for (let el in userData) {
    if (!fieldsAllowedToBeUpdated.includes(el)) delete userData[el];
  }
  if (req.file) userData.photo = req.file.filename;
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

//////////uploading user photo
// const multerStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, "public/img/users");
//   },
//   filename: (req, file, callback) => {
//     //filename ->  user-id90388-timestamp.jpeg
//     const fileExt = file.mimetype.split("/")[1];
//     const uploadFileName = `user-${req.user.id}-${Date.now()}.${fileExt}`;
//     callback(null, uploadFileName);
//   },
// });

const multerStorage = multer.memoryStorage(); //this way, the image will be stored in memory as a buffer
const multerFilter = (req, file, callback) => {
  //test if the uploaded file is an image
  if (file.mimetype.startsWith("image")) return callback(null, true);
  callback(new AppError("Only images are accepted!", 400), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadUserPhoto = upload.single("photo");
exports.resizeUserPhoto = catchAsyncError(async (req, res, next) => {
  if (!req.file) return next();
  //the buffer is available on file obj NOW
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  //construct filename and add it to the req.file obj
  //to be accessed later by other middleware down the stack

  //NB: we need square image
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 }) //reduce the quality of the uploaded image
    .toFile(`public/img/users/${req.file.filename}`);
  //toFile() method saves the image to disk in the specified path
  next();
});

///

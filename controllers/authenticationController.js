const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");
const catchAsyncError = require("../utils/catchAsyncError");
const AppError = require("../utils/AppError");
const sendEmail = require("../utils/email");

////signup
exports.signup = catchAsyncError(async (req, res, next) => {
  const { name, email, role, password, confirmPassword, passwordChangedAt } =
    req.body;
  const newUser = await UserModel.create({
    name,
    email,
    role,
    password,
    confirmPassword,
    passwordChangedAt,
  }); //NB: Only store the selected fields for new user, to avoid user creating new doc with admin or other role privileges
  const token = signToken(newUser._id);
  newUser.password = undefined; //don't send password to user
  res.status(201).json({ status: "Success", token, user: newUser });
});

///login
exports.login = catchAsyncError(async (req, res, next) => {
  let { password, email } = req.body;
  ////1:Check if emailand password exist
  if (!email || !password)
    return next(new AppError("Please provide email and password", 404));
  //////2:Check if user exists && password is correct
  const user = await UserModel.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(`Incorrect email or password`, 401));
    //provide vague response in other not to aid user with valuable info with your res e.g password is not correct!
  }
  //3: If everything is fine, send token to client
  const token = signToken(user._id);
  return res
    .status(200)
    .json({ status: "Success", msg: "Login Successful!", token });
});

exports.protect = catchAsyncError(async (req, res, next) => {
  //1:Checking token
  let token = null;
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith("Bearer")) {
    token = authorization.split(" ")[1].toString();
  }
  if (!token) {
    return next(
      new AppError("You're not logged in! Please login to get acess"),
      401
    );
  }

  //2:Verification of signToken
  const promisifiedJWTVerifyMethod = promisify(jwt.verify);
  const decodedPayload = await promisifiedJWTVerifyMethod(
    token,
    process.env.jwtSecret
  );
  // console.log("Decoded: ", decodedPayload);
  //3:Check if user still exists
  const currentUserId = decodedPayload.id;
  const currentUser = await UserModel.findById(currentUserId);
  if (!currentUser) {
    return next(new AppError("User with this token does not exist!", 401));
  }

  //Check if currentUser changed password after the token was issued
  const resp = currentUser.changedPasswordAfter(decodedPayload.iat); //iat -->issued at
  if (resp === true) {
    //if true, token is no longer valid, sign in with new password to get another token
    return next(
      new AppError("User recently changed password! Please login again", 401)
    );
  }
  //If everything is fine, grant access to the protected route
  req.user = currentUser;
  next();
});

exports.restictTo = (...roles) => {
  // console.log(roles);
  return (req, res, next) => {
    //roles an array eg ['admin'], ['admin','lead']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`You don't have permission to perfrom this action`, 403)
      );
    }
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  //1: get user based on posted email
  const { email } = req.body;
  const user = await UserModel.findOne({ email });
  if (!user) return next(new AppError("No user with email: " + email, 404));
  //2: generate the random reset token
  const resetToken = user.createPasswordResetToken();
  //persist the new change to the doc
  await user.save({ validateBeforeSave: false }); //Turn off model validation when reseting password
  //3:send token to user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your passord? Submit a PATCH request with your new password and password confirm to : ${resetURL} \n If you didn't forget your password, kindly ignore this mail`;
  try {
    await sendEmail({
      email,
      subject: "Password Reset Token: Valid for 10 minutes",
      message,
    });
    res
      .status(200)
      .json({ status: "Success", message: "Token sent to email: " + email });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("Error occured while sending mail. Try again later! ", 500)
    );
  }
};
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  //1: get user base on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token.trim())
    .digest("hex");
  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, //if true, then the 10min expiration windows hasn't passed
  });
  // console.log(user);
  //2: if token hasn't expired, and there is user, set the new passwordResetToken
  if (!user) return next(new AppError("Token is invalid or has expired", 400));
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined; //new password has been set, remove fields from doc in db
  user.passwordResetExpires = undefined;
  await user.save(); //persist the new change to the doc

  //3: log the user in & sen jwt
  const token = signToken(user._id);
  res.status(200).json({ status: "Success", token });
});

exports.updatePassword = catchAsyncError(async (req, res, next) => {
  //// This functionality is for logged in user, but we need the user to post her current password to be sure she is who she claims to be
  //1: get user from the collection
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const user = await UserModel.findById(req.user.id).select("+password");
  //2: check if the posted password is correct
  if (!user || !(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError(`Incorrect email or password`, 401));
  }
  //3: If so, update password
  user.password = newPassword;
  user.confirmPassword = confirmPassword;
  await user.save(); // validation should apply
  //4 login user in, send token
  const token = signToken(user._id);
  res.status(200).json({ status: "Success", token, user });
});

////////////////////////
///local helper fuctions
// function createAndSendToken(user, statusCode, res) {
//   const token = signToken(user._id);
//   res.status(statusCode).json({ status: "Success", token, data: { user } });
// }

function signToken(id) {
  const token = jwt.sign({ id }, process.env.jwtSecret, {
    expiresIn: process.env.jwtExpiresIn,
  });
  return token;
}

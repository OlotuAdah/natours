const { promisify } = require("util");
// const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");
const catchAsyncError = require("../utils/catchAsyncError");
const AppError = require("../utils/AppError");

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
    token = authorization.split(" ")[1].toString().trim();
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
    //if password was changed
    return next(
      new AppError("User recently changed password! Please login again", 401)
    );
  }

  //If everything is fine, grant access to the protected route
  req.user = currentUser;
  next();
});

exports.restictTo = (...roles) => {
  console.log(roles);
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

////////////////////////
///local helper fuctions
function signToken(id) {
  const token = jwt.sign({ id }, process.env.jwtSecret, {
    expiresIn: process.env.jwtExpiresIn,
  });
  return token;
}

const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide your name"],
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please provide your email"],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: {
    type: String,
    default: "default.png",
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },

  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false, //never show in output
  },
  confirmPassword: {
    type: String,
    required: [true, "Confirm password must match password"],
    validate: function (el) {
      //el is the current field (confirmPassword)
      //This only work on model using .save(), .create(), doesn't work with findOneAndUpdate
      return el === this.password;
    },
    message: "Confirm password must macth password!",
  },
  active: {
    type: Boolean,
    default: true,
    select: false, // never show this as part of response obj
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre("save", async function (next) {
  const doc = this; //this refers to  the current document
  if (!doc.isModified("password")) return next(); //if password field has not being modified, skip this middleware to next one
  doc.password = await bcrypt.hash(doc.password, 12); // 12, the cost, determines how much cpu power will be used. 10 is default, 12 is stonger
  doc.confirmPassword = undefined; //only used for validation. No need to store
  next();
});

userSchema.pre("save", function (next) {
  const doc = this;
  if (!doc.isModified("password") || doc.isNew) return next(); //do this only when password is modified or doc is new, else goto next middleware
  this.passwordChangedAt = Date.now() - 1000; //subtract 1000millsec or 1 sec to ensure that token is created before password is changed; in the event that writing to the db lags a little bit
  next();
});

userSchema.pre(/^find/g, function (next) {
  //
  const doc = this;
  doc.find({ active: true });
  next();
});

//Instace Method:Available on all objects or docs
userSchema.methods.correctPassword = async function (
  suppliedPassword,
  passwordInDB
) {
  return bcrypt.compare(suppliedPassword, passwordInDB); //returns true if they're the same
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const pwdChangedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //NOT CHANGED:JWTTimestamp should be greter than pwdChangedTimestamp
    return JWTTimestamp < pwdChangedTimestamp ? true : false;
  }
  //false means password hasn't been changed since token was generated
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(12).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // valid for 10 minutes
  //notice doc has been updated with two fields: passwordResetToken and passowdResetExpires,
  //therefore doc needs to be saved using .save() in auth controller
  return resetToken;
};

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;

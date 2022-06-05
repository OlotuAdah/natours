const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

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
  passwordChangedAt: Date,
});

userSchema.pre("save", async function (next) {
  const doc = this; //this refers to  the current document
  if (!doc.isModified("password")) return next(); //if password field has not being modified, skip this middleware to next one
  doc.password = await bcrypt.hash(doc.password, 12); // 12, the cost, determines how much cpu power will beused. 10 is default, 12 is stonger
  doc.confirmPassword = undefined; //only used for validation. No need to store
  next();
});

//Instace Method:Available on all objects
userSchema.methods.correctPassword = async function (suppliedPass, passInDb) {
  return bcrypt.compare(suppliedPass, passInDb); //returns true if they're the same
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const pwdChangedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //NOT CHANGED:JWTTimestamp should be greter than pwdChangedTimestamp
    return JWTTimestamp < pwdChangedTimestamp ? true : false; //200 > 300
  }
  //false means password hasn't been changed since, token was generated
  return false;
};

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;

const express = require("express");
//

const { getUsers, getUser } = require("../controllers/userController");
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
} = require("../controllers/authenticationController");
const userRouter = express.Router();

////////Auth route, for users' auth requests
userRouter.post("/signup", signup);
userRouter.post("/login", login);

userRouter.patch("/forgotPassword", forgotPassword);
userRouter.patch("/resetPassword/:token", resetPassword);
userRouter.patch("/updatePassword/", protect, updatePassword);

///////User route, for admin requests on user data
userRouter.route("/").get(getUsers);
userRouter.route("/:userId").get(getUser);
/////////////

module.exports = userRouter;

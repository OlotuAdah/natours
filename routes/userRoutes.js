const express = require("express");
//

const {
  getUsers,
  getUser,
  updateMe,
  deleteMyAccount,
} = require("../controllers/userController");
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  authenticate,
} = require("../controllers/authenticationController");
const userRouter = express.Router();

////////Auth route, for users' auth requests
userRouter.post("/signup", signup);
userRouter.post("/login", login);

userRouter.patch("/forgotPassword", forgotPassword);
userRouter.patch("/resetPassword/:token", resetPassword);
userRouter.patch("/updatePassword/", authenticate, updatePassword);
userRouter.patch("/updateMe/", authenticate, updateMe);
userRouter.delete("/deleteMyAccount/", authenticate, deleteMyAccount);

///////User route, for admin requests on user data
userRouter.route("/").get(getUsers);
userRouter.route("/:userId").get(getUser);
/////////////

module.exports = userRouter;

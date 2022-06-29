const express = require("express");
//

const {
  getUsers,
  getMe,
  updateMe,
  deleteMyAccount,
  uploadUserPhoto,
  resizeUserPhoto,
} = require("../controllers/userController");
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  authenticate,
  authorize,
} = require("../controllers/authenticationController");
const userRouter = express.Router();

///////Setting up multer upload

//////////////////////

////////Auth route, for users' auth requests
userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.patch("/forgotPassword", forgotPassword);
userRouter.patch("/resetPassword/:token", resetPassword);

//for only logged in users
userRouter.use(authenticate); //from this line, all the routes need users to be authenticated to get acess
userRouter.patch("/updatePassword/", updatePassword);
userRouter.patch("/updateMe/", uploadUserPhoto, resizeUserPhoto, updateMe);
userRouter.delete("/deleteMyAccount/", deleteMyAccount);

/////////////
//get user(s)
userRouter.get("/me", getMe);
userRouter.get("/", authorize("admin"), getUsers);
/////////
module.exports = userRouter;

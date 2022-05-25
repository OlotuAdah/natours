const express = require("express");
//

const { getUsers, getUser } = require("../controllers/userController");
const userRouter = express.Router();

userRouter.route("/").get(getUsers);
userRouter.route("/:userId").get(getUser);

module.exports = userRouter;

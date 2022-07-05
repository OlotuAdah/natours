const express = require('express');
//

const {
    getUsers,
    getMe,
    updateMe,
    deleteMyAccount,
    uploadUserPhoto,
    resizeUserPhoto,
} = require('../controllers/userController');
const {
    signup,
    login,
    forgotPassword,
    resetPassword,
    updatePassword,
    authenticate,
    authorize,
} = require('../controllers/authenticationController');
const userRouter = express.Router();

///////Setting up multer upload

//////////////////////

////////Auth route, for users' auth requests
userRouter.post('/signup', signup);
userRouter.post('/login', login);
userRouter.patch('/forgotPassword', forgotPassword);
userRouter.patch('/resetPassword/:token', resetPassword);

//for only logged in users
userRouter.use(authenticate); //from this line, all the routes need users to be authenticated to get acess
userRouter.patch('/updatePassword/', updatePassword);
userRouter.patch('/updateMe/', uploadUserPhoto, resizeUserPhoto, updateMe);
userRouter.delete('/deleteMyAccount/', deleteMyAccount);

/////////////
//get user(s)
userRouter.get('/me', getMe);
userRouter.get('/', authorize('admin'), getUsers);
/////////
module.exports = userRouter;

//THE ACTIVITY FLOW FOR RESETTING PASSWORD
// 1: user click the forgort password button
//2: user enter the email address and send the req to forgotPassword route
//3: forgot password mail containing password reset toke will be sent to the registered mail (if email addr is valid) of user
//4: the body of the mail has a button, 'Reset password', click it, you will be routed to a new password collection form
//5: user is routed to the form along with his/her token
//6: user enters new password, confirmed it, then a patch req is sent to the passwordReset route along with your token
//NB: if token has not expired, password reset will be succussful!

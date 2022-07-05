//An async functons returns a promise, so if an error occured in an async function
//it means the Promise resolves -> rejected, which can then be caught with a .catch block
const catchAsyncError = (fn) => {
    //leveraging the concept of js closure.
    //NB: all identifiers available to the outer function are available to the inner function [closure!]
    return (req, res, next) => {
        fn(req, res, next).catch((err) => next(err));
    };
};

module.exports = catchAsyncError;

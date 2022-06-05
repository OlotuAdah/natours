const AppError = require("../utils/AppError");

const sendErrDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    err: err,
  });
};
const sendErrProd = (err, res) => {
  if (err.isOperationalError) {
    //Only error created explicitly by AppError class
    return res
      .status(err.statusCode)
      .json({ status: err.status, message: err.message });
  }
  //Error could be from third party library or unknown; in this case send a very genric error message to client
  //this is to avoid linking details to client
  res
    .status(500)
    .json({ status: "Error!", message: "Oops! Something went wrong" });
};

///////Handlers//////////////
const handleDBCastError = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

const handleDBDuplicateFieldsError = (error) => {
  const message = `Duplicate field value : "${error.keyValue.name}", please use a different value `;
  return new AppError(message, 400);
};

const handleDBValidationErros = (error) => {
  const validationMessages = Object.values(error.errors).join(". "); //Array of validation messages, converted to str
  const message = `Validation Error: ${validationMessages}  `;
  return new AppError(message, 400);
};
const handleJWTError = (error) =>
  new AppError("Invalid token. Please log in again!", 401);
const handleJWTExpiredTokenError = (error) =>
  new AppError("Expired token: Please log in again!", 401);

////////////////////////

const globalErrorConroller = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "Error!";

  if (process.env.NODE_ENV === "dev") {
    sendErrDev(err, res);
  } else if (process.env.NODE_ENV === "prod") {
    let error = Object.create(err); //create another object from an existing one
    //handleDBCastError returns an instance of AppError class which makes it an operational error
    if (error.name === "CastError") error = handleDBCastError(error);
    if (error.code === 11000) error = handleDBDuplicateFieldsError(error); //11000 is the errorcode for duplicate key
    if (error.name === "ValidationError")
      error = handleDBValidationErros(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError(error);
    if (error.name === "TokenExpiredError")
      error = handleJWTExpiredTokenError(error);

    sendErrProd(error, res);
  }
};

module.exports = globalErrorConroller;

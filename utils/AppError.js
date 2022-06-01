class AppError extends Error {
  constructor(message, statusCode) {
    //The new Error() constructor only takes in the msg str
    super(message); //calling the super Error class with the message,
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "Failed!" : "Error!";
    this.isOperationalError = true;

    //When a new object is created (constructor function called), prevent
    // the function call from appearing on stack trace. To avoid poluting it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

const express = require("express");
const morgan = require("morgan");

/////////////////////
const AppError = require("./utils/AppError");
const globalErrorConroller = require("./controllers/globaErrorController");
const userRouter = require("./routes/userRoutes");
const tourRouter = require("./routes/tourRoutes");

//

const app = express();

app.use(express.json());
if (process.env.NODE_ENV === "dev") app.use(morgan("dev"));
app.use(express.static(`${__dirname}/public`));
//
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next(); // move to next middleware in the middleware stack
});

//Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tours", tourRouter);

//For all http verbs (get, post, et c) that has not been handled up untill this point
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});

//GLOBAL ERROR HANDLING MIDDLEWARE//////////
app.use(globalErrorConroller);
module.exports = app;

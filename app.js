const express = require("express");
const morgan = require("morgan");
const rateLimiter = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp"); //http parameter polution

/////////////////////
const AppError = require("./utils/AppError");
const globalErrorConroller = require("./controllers/globaErrorController");
const userRouter = require("./routes/userRoutes");
const tourRouter = require("./routes/tourRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const reviewRouter = require("./routes/reviewRoute");

///////////////////

const app = express();

//GLOBAL MIDDLEWARE //////////
//set security http hearders
app.use(helmet());

if (process.env.NODE_ENV === "dev") app.use(morgan("dev"));
////Limit requests from same device(fights against DoS aband bruteforce attack)
const limiter = rateLimiter({
  max: 100,
  windowMs: 60 * 60 * 1000, // allow 100 request a given 1p in 1hr
  message: "Too many request from your device, please try again in an hour!",
});
app.use("/api", limiter); //apply this limiter to only /api* resources
////////
///Body parser, read data unto req.body
app.use(express.json({ limit: "10kb" }));

///Data sanitization aganist NoSQL query injection
app.use(mongoSanitize());

////Data sanitization aganist XSS attack (maliccious html & js code attached to it)
app.use(xss());

///Prevents http parameter pollution e.g having two sort fields in query(?sort=duration&sort=price this will throw an error)
app.use(hpp({ whitelist: ["duration", "price", "ratingsAverage"] })); //use the last one

////Serving static files
app.use(express.static(`${__dirname}/public`));
////////////////////////////////////////////
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.requestTime);
  next(); // move to next middleware in the middleware stack
});
////////////////////////////////////////////
//Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

//For all http verbs (get, post, et c) that has not been handled up untill this point
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});

//GLOBAL ERROR HANDLING MIDDLEWARE//////////
app.use(globalErrorConroller);
module.exports = app;

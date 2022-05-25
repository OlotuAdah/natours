const express = require("express");
const userRouter = require("./routes/userRoutes");
const tourRouter = require("./routes/tourRoutes");
const morgan = require("morgan");

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

module.exports = app;

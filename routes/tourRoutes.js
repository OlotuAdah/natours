const express = require("express");
//
const {
  authenticate,
  authorize,
} = require("../controllers/authenticationController");
const {
  getTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  deleteTours,
  aliasTopTours,
  aliasCheapestTours,
  getTourStats,
  getMonthlyPlan,
} = require("../controllers/tourController");
const tourRouter = express.Router();
// tourRouter.param("id", checkID);

const reviewRouter = require("../routes/reviewRoute");
//Nested route signature (here, tour resourec is parent of review resource)
//  ... /tour/233444id/reviews
//if tourRouter (parent) ever receive any request for its child resource, use the the child's router
tourRouter.use("/:tourId/reviews", reviewRouter);

//ALIAS ROUTES//////////
tourRouter.route("/top-tours").get(aliasTopTours, getTours);
tourRouter.route("/cheapest-tours").get(aliasCheapestTours, getTours);
///////////////////////////

//STATS ROUTES//////////
tourRouter.route("/tour-stats").get(getTourStats);
tourRouter
  .route("/monthly-plan/:year")
  .get(authenticate, authorize("admin", "guide", "lead-guide"), getMonthlyPlan);

/////////////////////

tourRouter
  .route("/")
  .get(getTours)
  .post(authenticate, authorize("admin", "lead-guide"), createTour)
  .delete(authenticate, authorize("admin", "lead-guide"), deleteTours);
tourRouter
  .route("/:tourId")
  .get(getTour)
  .patch(authenticate, authorize("admin", "lead-guide"), updateTour)
  .delete(authenticate, deleteTour);

module.exports = tourRouter;

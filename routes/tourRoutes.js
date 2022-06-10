const express = require("express");
//
const {
  authenticate,
  restictTo,
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

//ALIAS ROUTES//////////
tourRouter.route("/top-tours").get(aliasTopTours, getTours);
tourRouter.route("/cheapest-tours").get(aliasCheapestTours, getTours);
///////////////////////////

//STATS ROUTES//////////
tourRouter
  .route("/tour-stats")
  .get(authenticate, authorize("admin"), getTourStats);
tourRouter.route("/monthly-plan/:year").get(getMonthlyPlan);

/////////////////////

tourRouter.route("/").get(getTours).post(createTour).delete(deleteTours);
tourRouter
  .route("/:tourId")
  .get(authenticate, getTour)
  .patch(authenticate, authorize("admin"), updateTour)
  .delete(authenticate, deleteTour);

module.exports = tourRouter;

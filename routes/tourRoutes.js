const express = require("express");
//
const {
  protect,
  restictTo,
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
tourRouter.route("/tour-stats").get(getTourStats);
tourRouter.route("/monthly-plan/:year").get(getMonthlyPlan);

/////////////////////

tourRouter.route("/").get(getTours).post(createTour).delete(deleteTours);
tourRouter
  .route("/:tourId")
  .get(protect, getTour)
  .patch(protect, restictTo("admin"), updateTour)
  .delete(deleteTour);

module.exports = tourRouter;

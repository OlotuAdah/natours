const express = require("express");
//
const {
  getTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  deleteTours,
  aliasTopTours,
  aliasCheapestTours,
} = require("../controllers/tourController");
const tourRouter = express.Router();
// tourRouter.param("id", checkID);

tourRouter.route("/").get(getTours).post(createTour).delete(deleteTours);
tourRouter.route("/:tourId").get(getTour).patch(updateTour).delete(deleteTour);

//ALIAS ROUTES//////////
tourRouter.route("/top-tours").get(aliasTopTours, getTours);
tourRouter.route("/cheapest-tours").get(aliasCheapestTours, getTours);
///////////////////////////

module.exports = tourRouter;

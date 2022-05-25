const express = require("express");
//
const {
  getTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  deleteTours,
} = require("../controllers/tourController");
const tourRouter = express.Router();
// tourRouter.param("id", checkID);

tourRouter.route("/").get(getTours).post(createTour).delete(deleteTours);
tourRouter.route("/:tourId").get(getTour).patch(updateTour).delete(deleteTour);

module.exports = tourRouter;

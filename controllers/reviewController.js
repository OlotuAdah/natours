const catchAsyncError = require("../utils/catchAsyncError");
const ReviewModel = require("../models/reviewModel");
const AppError = require("../utils/AppError");

/////////////////////
exports.getReviews = catchAsyncError(async (req, res, next) => {
  const filter = filterParams(req.params);
  //if id is present, then get a specific review for a specific tour
  const reviews = await ReviewModel.find(filter);
  sendResponse(res, 200, reviews, "");
});
exports.createReview = catchAsyncError(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  const review = await ReviewModel.create(req.body);
  res.status(200).json({ status: "Sucess", data: { review } });
});

/////////////////////
exports.updateReview = catchAsyncError(async (req, res, next) => {
  const fieldsAllowedToBeUpdated = ["rating", "review"];
  const updateObj = { ...req.body };
  const filter = filterParams(req.params);
  //filter request body to remove other fields except rating and review
  Object.keys(req.body).forEach((element) => {
    if (!fieldsAllowedToBeUpdated.includes(element)) delete updateObj[element];
  });
  const updatedReview = await ReviewModel.findByIdAndUpdate(
    filter._id, //reviewId
    updateObj,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!updatedReview) {
    return next(new AppError(`No review found with id: ${filter._id}`));
  }
  sendResponse(res, 201, updatedReview, "Review updated");
});

///////////
exports.deleteReview = catchAsyncError(async (req, res, next) => {
  const filter = filterParams(req.params);
  await ReviewModel.findByIdAndDelete(filter._id); // depending on the value of filter._id points to reviewId
  sendResponse(res, 200, "Review deleted!");
});

///Local helper functions
/////////////////
function sendResponse(res, statusCode, data, message) {
  res.status(statusCode).json({ status: "Sucess", data, message });
}

function filterParams(params) {
  const filter = {};
  //if tourId alone is specified, action is performed on reviews for the tour with that tourId
  //if reviewId is specified, action is performed on the specific review
  //if tourId & reviewId are specified, action is performed on the specific review for a specific tour
  if (params.tourId) filter.tour = params.tourId;
  if (params.reviewId) filter._id = params.reviewId;
  return filter;
}

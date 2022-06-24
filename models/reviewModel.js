const mongoose = require("mongoose");
const TourModel = require("../models/tourModel");
const AppError = require("../utils/AppError");

const reviewSchema = mongoose.Schema(
  {
    //Using parent referecing: best for data items that have the potentially to grow indefinitely
    review: {
      type: String,
      required: [true, "Review can not be empty"],
    },
    rating: {
      type: Number,
      required: [true, "A Review must have a rating"],
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      //review belongs to it parent, Tour
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
    },
    user: {
      //review belongs to it parent, Tour
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must have an author"],
    },
  },
  {
    toJSON: { virtuals: true }, //show virtual properties in output/response obj
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); //a user can write on one review on a tour
reviewSchema.pre(/^find/, function (next) {
  const currQuery = this;
  //   currQuery.populate(["user", "tour"]); //
  currQuery.populate({ path: "user", select: "name" });
  // .populate({ path: "tour", select: "name" });
  next();
});

reviewSchema.statics.calculateRatingsAve = async function (tourId) {
  //this points to the model(class)
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }, //match all reviews where tour field equals tourId supplied
    },
    {
      //group all reviews by tour (id of the review)
      $group: {
        _id: "$tour", //where the field tour contains parent tour id
        nRatings: { $sum: 1 }, //add 1 to this field, nRatings for each document (review) with same tour id
        avgRatings: { $avg: "$rating" }, //calcualte avg from the ratings field in the ratings document
      },
    },
  ]);
  //persists these calculated fied to tour
  const updateObj = { ratingsQuantity: 0, ratingsAverage: 4.5 }; //default values
  if (stats.length > 0) {
    updateObj.ratingsQuantity = stats[0].nRatings;
    updateObj.ratingsAverage = stats[0].avgRatings;
  }
  await TourModel.findByIdAndUpdate(tourId, updateObj, {
    new: true,
    runValidators: true,
  });
  //
};

reviewSchema.post("save", function () {
  //the .post trigger does not get acess next function
  // "this" points to current review doc
  //since the method is static it can me called on the class (model) itself
  //since there is no access to review class at this point, the workaround is
  const Review = this.constructor;
  Review.calculateRatingsAve(this.tour); //takes in the tour id, and the model
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  //this is a query middleware, so this points to query not doc
  //so, you await the query to get the doc data b4 calculating stats in the next post hook
  const doc = await this.findOne().clone(); //clone, is used here to await a query more than once
  this.doc = doc; // workaround to get access to the doc in the next middleware
  if (!doc) return next(new AppError("No review found with this id", 404));
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  await this.doc.constructor.calculateRatingsAve(this.doc.tour);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;

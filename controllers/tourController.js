//
const AppError = require("../utils/AppError");
const catchAsyncError = require("../utils/catchAsyncError");
const TourModel = require("../models/tourModel");
const APIFeatures = require("../utils/APIFeatures");

exports.getTours = catchAsyncError(async (req, res, next) => {
  let apiFeatures = new APIFeatures(TourModel.find(), req.query);
  apiFeatures = apiFeatures.fliter().sortQry().limitFields().paginate();
  //ExECUTE QUERY NOW
  const tours = await apiFeatures.query; //await ensures that all these query now resolves with real data
  res
    .status(200)
    .json({ status: "Success", results: tours.length, data: tours });
});

exports.getTour = catchAsyncError(async (req, res, next) => {
  const { tourId } = req.params;
  const tour = await TourModel.findById(tourId);
  if (!tour)
    return next(new AppError(`Tour with id: ${tourId} not found!`, 404));
  res.status(200).json({ status: "Success", data: tour });
});

exports.createTour = catchAsyncError(async (req, res, next) => {
  const newTour = await TourModel.create(req.body);
  res.status(201).json({ status: "Sucess", data: newTour });
});

exports.updateTour = catchAsyncError(async (req, res, next) => {
  const { tourId } = req.params;
  // console.log(tourId);
  const updatedTour = await TourModel.findByIdAndUpdate(tourId, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updatedTour)
    return next(new AppError(`Tour with id: ${tourId} not found!`, 404));
  res.status(200).json({ status: "Success", data: updatedTour });
});

exports.deleteTour = catchAsyncError(async (req, res, next) => {
  const { tourId } = req.params;
  const resp = await TourModel.findByIdAndDelete(tourId);
  if (!resp)
    return next(new AppError(`Tour with id: ${tourId} not found!`, 404));
  return res.status(200).json({ status: "Sucess", resp: "Tour deleted!" });
});
exports.deleteTours = catchAsyncError(async (req, res) => {
  await TourModel.deleteMany();
  return res.status(200).json({ status: "Sucess", resp: "Tours deleted!" });
});

exports.aliasTopTours = catchAsyncError(async (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = "-ratingsAverage,-price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
});
exports.aliasCheapestTours = catchAsyncError(async (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = "price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
});

exports.getTourStats = catchAsyncError(async (req, res, next) => {
  //If you don't the aggregate it will return aggregate object, find returns a query
  //awiat it for the query to resove the real data
  const stats = await TourModel.aggregate([
    //stage1: condition for selecting the documents from this model
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    // stage 2: group, perform different aggregations on the sellected fields
    {
      $group: {
        _id: { $toUpper: "$difficulty" }, //null to perfrom aggreagete ops on all
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    //Template for repeating an aggregate stage
    // {
    //   $match: { _id: { $ne: "EASY" } },
    // },
  ]);
  res.status(200).json({ status: "Success", data: stats });
});

exports.getMonthlyPlan = catchAsyncError(async (req, res, next) => {
  const year = req.params.year * 1; //casting str yr to a num
  const plan = await TourModel.aggregate([
    {
      $unwind: { path: "$startDates" }, // preserveNullAndEmptyArrays: true
    },
    {
      $match: {
        startDates: {
          $gte: `${year}-01-12`,
          $lte: `${year}-12-31`,
        },
      },
    },
    {
      $group: {
        _id: { $month: { $dateFromString: { dateString: "$startDates" } } },
        numToursStarts: { $sum: 1 },
        tours: { $push: "$name" }, //add array tours to doc and push in name(s) of docs
      },
    },
    {
      $addFields: { month: "$_id" }, //addFields month (value is value of respective _id) to each doc
    },
    {
      $project: { _id: 0 }, //remove the _id feild from docs
    },
    {
      $sort: { numToursStarts: -1 },
    },
    {
      $limit: 12, //limits the numbers of docs to number specified
    },
  ]);
  res.status(200).json({ status: "Success", data: plan });
});

//
const AppError = require("../utils/AppError");
const catchAsyncError = require("../utils/catchAsyncError");
const TourModel = require("../models/tourModel");
const APIFeatures = require("../utils/APIFeatures");
// const { deleteOneDoc } = require("../controllers/handlerFactory");

exports.getTours = catchAsyncError(async (req, res, next) => {
  let apiFeatures = new APIFeatures(TourModel.find(), req.query);
  apiFeatures = apiFeatures.fliter().sortQry().limitFields().paginate();
  //ExECUTE QUERY NOW
  const tours = await apiFeatures.query; //await ensures that all these query resolves with real data
  res
    .status(200)
    .json({ status: "Success", results: tours.length, data: tours });
});

exports.getTour = catchAsyncError(async (req, res, next) => {
  const { tourId } = req.params;
  const tour = await TourModel.findById(tourId).populate("reviews");
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

// exports.deleteTour = deleteOneDoc(TourModel); //delete using the factory method

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
  //just manipulate the query obj before running the main getTours
  req.query.limit = 5;
  req.query.sort = "-ratingsAverage,-price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
});
exports.aliasCheapestTours = catchAsyncError(async (req, res, next) => {
  //just manipulate the query obj before running the main getTours
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

exports.getClosedByTours = catchAsyncError(async (req, res, next) => {
  //get tours within specified distance
  // "/closed-by-tours/:distance/latlon/:latlon/unit/:unit",
  //E.g closed-by-tours/182/latlon/34.111745,-118.113491/unit/mi where mi==>miles, km==>killometer
  const { distance, latlon, unit } = req.params;
  const [lat, lon] = latlon.split(",");
  //The equatorial radius of the Earth is approximately 3,963.2 miles or 6,378.1 kilometers[MongoDb Documentation]
  //radius in miles is distance/3963.2
  //radius in killometer is distance/6378.1
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lon) {
    return next(
      new AppError(
        "Please provide latitude and longitude in format lat,lon.",
        400
      )
    );
  }
  //creating filter object for the query
  const qryFilter = {
    startLocation: { $geoWithin: { $centerSphere: [[lon, lat], radius] } }, //$centerSphere takes an array of 1: lat,lon and 2: radius
  };
  const tours = await TourModel.find(qryFilter);
  res.status(200).json({
    status: "Success",
    results: tours.length,
    radius,
    data: { data: tours },
  });
});
exports.getDistances = catchAsyncError(async (req, res, next) => {
  const { latlon, unit } = req.params;
  const [lat, lon] = latlon.split(",");
  const multiplier = unit === "mi" ? 0.000621371 : 0.001;
  //The equatorial radius of the Earth is approximately 3,963.2 miles or 6,378.1 kilometers[MongoDb Documentation]
  //radius in miles is distance/3963.2
  //radius in killometer is distance/6378.1
  if (!lat || !lon) {
    return next(
      new AppError(
        "Please provide latitude and longitude in format lat,lon.",
        400
      )
    );
  }

  const distances = await TourModel.aggregate([
    //Geospatial aggregation requires that the geoNear stage is the first stage in the pipiline
    //$geoNear stage requires that at least one field contains a geospatil index
    // But that is taken care of already -> startLocation:'2dsphere'
    {
      $geoNear: {
        //2 mandetory fields for geoNear are near(supplied cords.) and distanceField(contains the calculated values)
        near: {
          type: "Point",
          coordinates: [lon * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier, //convert to either miles or killometer depending on the unit provided
      },
    },
    {
      $project: {
        //select or project only the calculated field distance and name from each of the docs
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: "Success",
    data: { data: distances },
  });
});

//

const TourModel = require("../models/tourModel");

///
exports.getTours = async (req, res) => {
  try {
    // console.log(req.query);
    // BUILD QUERY
    //1A) Filtering
    let queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    //1B) Advanced Filtering
    //convert queryObj to string to use regular expression on it
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    //for each match attach $ to the beginning to satisfy mongo requirement
    queryObj = JSON.parse(queryStr); //convert queryStr back to object
    let query = TourModel.find(queryObj);

    //2)SORTING
    if (req.query.sort) {
      let sortBy = req.query.sort;
      sortBy = sortBy.split(",").join(" ");
      query = query.sort(sortBy);
      //NOTE: sort is another mongoose method chained to the others used on the Query/Promise
      //asc||desc depending on whether the user prefix the soerBy filed with - ie desc else asc
      // E.g sort('price -aveRating')
    } else {
      //If the user does not specify sort, the result is sorted by createdAt field to allow recent ones appear first, ie desc
      query = query.sort("-createdAt");
    }

    //3) LIMITING ie allowing users to choose which field(s) they want in result
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields); //select only the fields the user wants
    } else {
      //If the user does not specify fields to select, just remove the inbuilt __v field
      query = query.select("-__v");
    }

    //4) PAGINATION: if too many items are to be returned to a user,
    //we can group this large items into several pages
    //E.g user wants page=2&limit=10 ie page 2 and 10 items on that page
    //page 1 is 1-10, page 2 is 11-20, page 3 is 21-30 ...
    let { page, limit } = req.query;
    page = Math.floor(Math.abs(+page)) || 1; //NB: +page converts it to number
    limit = Math.floor(Math.abs(+limit)) || 100;
    const skipValue = (page - 1) * limit;
    query.skip(skipValue).limit(limit);

    //Incase a user request for an ivalid page
    if (req.query.page) {
      const numOfAvailableTours = await TourModel.countDocuments();
      if (skipValue >= +numOfAvailableTours) {
        let err = new Error("This page does not exist!");
        err.status = 404;
        throw err;
      }
    }

    //ExECUTE QUERY now
    const tours = await query;
    res
      .status(200)
      .json({ status: "Success", results: tours.length, data: tours });
  } catch (error) {
    const statusCode = error.status || 500;
    res.status(statusCode).json({ status: "Failed", message: error.message });
  }
};

exports.getTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const tour = await TourModel.findById(tourId);
    res.status(200).json({ status: "Success", data: tour });
  } catch (error) {
    res.status(404).json({ status: "Failed", message: error.message });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await TourModel.create(req.body);
    res.status(201).json({ status: "Sucess", data: newTour });
  } catch (error) {
    res.status(404).json({ status: "Failed", message: error.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    console.log(tourId);
    const updatedTour = await TourModel.findByIdAndUpdate(tourId, req.body, {
      new: true,
      runValidators: true,
    });
    if (updatedTour == null) {
      return res
        .status(404)
        .json({ message: `Tour with id: ${tourId} not found!` });
    }
    res.status(200).json({ status: "Success", data: updatedTour });
  } catch (error) {
    res
      .status(500)
      .json({ status: "Failed", message: error.message, stack: error.stack });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const resp = await TourModel.findByIdAndDelete(tourId);
    if (resp == null) {
      return res.status(404).json({ message: "Tour not found!" });
    }
    return res.status(200).json({ status: "Sucess", resp: "Tour deleted!" });
  } catch (error) {
    return res.status(500).json({ status: "Failed", message: error.message });
  }
};
exports.deleteTours = async (req, res) => {
  try {
    await TourModel.deleteMany();
    return res.status(200).json({ status: "Sucess", resp: "Tours deleted!" });
  } catch (error) {
    return res.status(500).json({ status: "Failed", message: error.message });
  }
};

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = "-ratingsAverage,-price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};
exports.aliasCheapestTours = async (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = "price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

//Just for reference
// const tours = await TourModel.find()
//   .where("duration")
//   .lte(duration) //less than or equal
//   .where("difficulty")
//   .equals(difficulty);

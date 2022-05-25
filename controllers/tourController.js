//
const TourModel = require("../models/tourModel");

///
exports.getTours = async (req, res, next) => {
  try {
    const tours = await TourModel.find();
    res
      .status(200)
      .json({ status: "Success", results: tours.length, data: tours });
  } catch (error) {
    res.status(500).json({ status: "Failed", message: error.message });
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
///////////////

// try {
//   const {tourId} = req.params;
//   const tours = await TourModel.find();
//   res
//     .status(200)
//     .json({ status: "Success", data: tours });
// } catch (error) {
//   res.status(500).json({ status: "Failed", message: error.message });
// }

//////////////

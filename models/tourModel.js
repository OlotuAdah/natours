const mongoose = require("mongoose");

const tourSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "A Tour must have a name"],
    unique: true,
    trim: true,
  },
  duration: {
    type: Number,
    required: [true, "A Tour must have a duration"],
  },
  maxGroupSize: {
    //Number of persons allowed to go on a tour at once
    type: Number,
    required: [true, "A Tour must have a group size"],
  },
  difficulty: {
    type: String,
    required: [true, "A Tour must have a difficulty"],
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, "A Tour must have a price"],
  },
  priceDiscount: Number,
  summary: {
    type: String,
    required: [true, "A Tour must have a summary"],
    trim: true, //removes white spaces  from either sides
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, "A Tour must have a cover image"],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  startsDate: [Date], //array of dates at which a Tour starts
});

const Tour = mongoose.model("Tour", tourSchema);
module.exports = Tour;

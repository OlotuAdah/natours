const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");
const tourSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A Tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "Tour name must have at most 40 characters!"],
      minlength: [10, "Tour name must have at least 10 chracters!"],
      // validate: [
      //   validator.isAlpha,
      //   "Tour name must only contain alphabets a-zA-Z",
      // ],
    },
    slug: String,
    duration: {
      //duration in days
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
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty must be either easy, medium or difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be/above 1.0"],
      max: [5, "Rating must be/below 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A Tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (inputVal) {
          //caveat: the this keyword only points to the current document for creating new document, but not for update
          return inputVal < this.price ? true : false;
        },
        message: `Discount price {VALUE}, can not be greater than the price!`,
      },
    },
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
      select: false, //don't allow this field to be returned to user
    },
    startDates: [String], //array of dates at which a Tour starts
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true }, //when doc is outputed as JSON, show vitual fileds
    toObject: { virtuals: true }, //when doc is outputed as Object, show vitual fileds
  }
);

//
tourSchema.virtual("durationInWeeks").get(function () {
  return this.duration / 7; //converts duration in days to duration in weeks
});
//NB: you can't use a vitual field in aquery directly
//virtual properties makes sense for fields that can be derived  from one another
//since they aren't saved to the db
//

//NB: Document middleware, just like express middleware
//You can use multiple middleware on on a sigle hook, eg the pre 'save' hook
//trigers on .save() and .create() method ivocation but not on .insertMany()
tourSchema.pre("save", function (next) {
  //pre doc middleware
  const doc = this; //this should points to the current document
  doc.slug = slugify(doc.name, { lower: true });
  next(); //Just like express, calls the next middleware in the stack
});

tourSchema.post("save", function (doc, next) {
  //doc is document just saved
  //console.log(doc); //logs the updated doc including slug field this time
  next(); //Just like express, calls the next middleware in the stack
});

//QUERY MIDDLEWARE ////////////////
tourSchema.pre(/^find/, function (next) {
  //Regex matches find, findOne etc
  //pre query hook
  const query = this; //the this keyword points to the current query in the query middleware
  query.find({ secretTour: { $ne: true } }); //only tours that are not secret should be returned for a find... query
  query.startTime = Date.now();
  next();
});
tourSchema.post(/^find/, function (docs, next) {
  //Regex matches find, findOne etc
  //post query hook
  console.log(`Tours query time is: ${Date.now() - this.startTime} millisecs`);
  next();
});

//AGGREGATION  MIDDLEWARE ////////////////
tourSchema.pre("aggregate", function (next) {
  //this points to aggregationn object here
  const aggregationObject = this;
  // console.log(aggregationObject.pipeline());
  aggregationObject
    .pipeline()
    .unshift({ $match: { secretTour: { $ne: true } } }); //unshift pushes elements to the beginning
  next();
});
const Tour = mongoose.model("Tour", tourSchema);
module.exports = Tour;

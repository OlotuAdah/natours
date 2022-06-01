require("dotenv").config();
const fs = require("fs");
const TourModel = require("./models/tourModel");
const mongoose = require("mongoose");
//

mongoose
  .connect(process.env.mongoCloudURI)
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

console.log(process.env.PORT);
const Tours = JSON.parse(
  fs.readFileSync("./dev-data/data/tours-simple.json", {
    encoding: "utf-8",
  })
);

const importData = async () => {
  try {
    await TourModel.create(Tours); //can take arrays of tours an create them
    console.log("Data loaded successfully!");
  } catch (error) {
    console.log(error);
  } finally {
    process.exit();
  }
};
const deleteData = async () => {
  try {
    await TourModel.deleteMany(); //can take arrays of tours an create them
    console.log("Data deleted successfully!");
  } catch (error) {
    console.log(error);
  } finally {
    process.exit();
  }
};

// console.log(process.argv);

if (process.argv[2] == "--import") importData();

if (process.argv[2] == "--delete") deleteData();

require("dotenv").config();
const fs = require("fs");
const TourModel = require("./models/tourModel");
const UserModel = require("./models/userModel");
const ReviewModel = require("./models/reviewModel");
const mongoose = require("mongoose");
//

mongoose
  // .connect(process.env.mongoCloudURI)
  .connect(process.env.mongoURI)
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

// console.log(process.env.PORT);
const Tours = JSON.parse(
  fs.readFileSync("./dev-data/data/tours.json", {
    encoding: "utf-8",
  })
);
const Users = JSON.parse(
  fs.readFileSync("./dev-data/data/users.json", {
    encoding: "utf-8",
  })
);
const Reviews = JSON.parse(
  fs.readFileSync("./dev-data/data/reviews.json", {
    encoding: "utf-8",
  })
);

const importData = async () => {
  try {
    await TourModel.create(Tours); //can take arrays of tours an create them
    await UserModel.create(Users, { validateBeforeSave: false }); //can take arrays of tours an create them
    await ReviewModel.create(Reviews); //can take arrays of tours an create them
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
    await UserModel.deleteMany(); //can take arrays of tours an create them
    await ReviewModel.deleteMany(); //can take arrays of tours an create them
    console.log("Data deleted successfully!");
  } catch (error) {
    console.log(error);
  } finally {
    process.exit();
  }
};

const clearTestData = async () => {
  const regEx = /^david/;
  try {
    const resp = await UserModel.deleteMany({ name: regEx });
    console.log("Data deleted successfully!", resp);
  } catch (error) {
    console.log(error);
  } finally {
    process.exit();
  }
};

// console.log(process.argv);

if (process.argv[2] == "--import") importData();

if (process.argv[2] == "--delete") deleteData();

if (process.argv[2] == "--clear") clearTestData();

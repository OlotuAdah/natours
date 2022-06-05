require("dotenv").config();

process.on("uncaughtException", (error) => {
  console.log(error.name, "==> ", error.message);
  //UncaughtException in App, shutting down app
  process.exit(1);
});

const app = require("./app");
const mongoose = require("mongoose");
// console.log(x);

const PORT = process.env.PORT;

mongoose
  .connect(process.env.mongoURI)
  // .connect(process.env.mongoCloudURI)
  .then(() => console.log("Connected to db!"));

const server = app.listen(PORT, () => {
  console.log(`Server is Running on PORT: ${PORT}`);
});
//Test debugger!

process.on("unhandledRejection", (error) => {
  console.log(error.name, "==> ", error.message);
  //If DB isn't connecting, then close server n shutdown the app
  server.close(() => {
    process.exit(1);
  });
});

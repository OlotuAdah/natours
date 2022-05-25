require("dotenv").config();
const app = require("./app");
const mongoose = require("mongoose");

const PORT = process.env.PORT;

mongoose
  .connect(process.env.mongoURI)
  .then(() => console.log("Connected to db!"))
  .catch((err) => {
    console.log(err);
  });
app.listen(PORT, () => {
  console.log(`Server is Running on PORT: ${PORT}`);
});

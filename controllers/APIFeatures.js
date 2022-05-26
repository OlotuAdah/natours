export default class APIFeatures {
  constructor(query, queryString) {
    //query =TourModel.find() while the queryString = req.query;
    this.query = query;
    this.queryString = queryString;
  }
  fliter() {
    let queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    //1B) Advanced Filtering
    //convert queryObj to string to use regular expression on it
    let queryStr = JSON.stringify(queryObj);
    //for each match attach $ to the beginning to satisfy mongo requirement
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    queryObj = JSON.parse(queryStr);

    this.query.find(queryObj);
  }
}

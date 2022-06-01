class APIFeatures {
  constructor(query, reqQuery) {
    //query =TourModel.find() while the queryString = req.query;
    this.query = query;
    this.reqQuery = reqQuery;
  }
  fliter() {
    //1A) Filtering
    let queryObj = { ...this.reqQuery };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    //1B) Advanced Filtering
    //convert queryObj to string to use regular expression on it
    let queryStr = JSON.stringify(queryObj);
    //for each match prefix it with $ sign to satisfy mongo requirement
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    queryObj = JSON.parse(queryStr); //convert queryStr back to JS object

    this.query.find(queryObj);
    return this; //return the entire object/instance
  }
  sortQry() {
    if (this.reqQuery.sort) {
      let sortBy = this.reqQuery.sort;
      sortBy = sortBy.split(",").join(" ");
      this.query = this.query.sort(sortBy);
      //NOTE: sort is another mongoose method chained to the others used on the Query/Promise
      //asc||desc depending on whether the user prefix the soerBy filed with - ie desc else asc
      // E.g sort('price -aveRating')
    } else {
      //If the user does not specify sort, the result is sorted by createdAt field to allow recent ones appear first, ie desc
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }
  //Only include the specified fields in results; equivalent to project in sql
  limitFields() {
    if (this.reqQuery.fields) {
      const fields = this.reqQuery.fields.split(",").join(" ");
      this.query = this.query.select(fields); //select only the fields the user wants
    } else {
      //If the user does not specify fields to select, just remove the inbuilt __v field
      this.query = this.query.select("-__v");
    }
    return this;
  }

  paginate() {
    let { page, limit } = this.reqQuery;
    page = Math.floor(Math.abs(+page)) || 1; //NB: +page converts it to number
    limit = Math.floor(Math.abs(+limit)) || 100;
    const skipValue = (page - 1) * limit;
    this.query.skip(skipValue).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;

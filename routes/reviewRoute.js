const express = require('express');
const {
    createReview,
    getReviews,
    updateReview,
    deleteReview,
} = require('../controllers/reviewController');

const {
    authenticate,
    authorize,
} = require('../controllers/authenticationController');
// app.use("/api/v1/reviews", reviewRouter);

//mergeParams:true ensures that params (cointaining tourId) of parent resource,
//is merged with params of child resourse. hence, tourId becomes available in req.params here!
const reviewRouter = express.Router({ mergeParams: true });

// POST /tours/2339id3/reviews
// GET /tours/2339id3/reviews
// const routeRegex = /^\/(:[ a-zA-Z0-9 ]*)?/g;
reviewRouter.use(authenticate); //No access for any of the routes for unauthenticated users
reviewRouter.route('/').get(getReviews).post(authorize('user'), createReview); //only a user can post a review (No guides or admin should)
// .delete(deleteReviews, authorize("admin", "user"));

// POST /tours/2339id3/reviews/45555
// GET /tours/2339id3/reviews/3445
reviewRouter
    .route('/:reviewId')
    .get(getReviews) //get a specific review for a specific tour
    .patch(authorize('admin', 'user'), updateReview) //update(patch) a specific review for a specific tour
    .delete(authorize('admin', 'user'), deleteReview); //delete a specific review for a specific tour

module.exports = reviewRouter;

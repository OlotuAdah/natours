const express = require('express');
const { authenticate } = require('../controllers/authenticationController');
const { getCheckoutSession } = require('../controllers/bookingController');

const bookingRouter = express.Router();

bookingRouter.use(authenticate);

//tourId is the id of the tour being booked
bookingRouter.get('/checkout-session/:tourId', getCheckoutSession);

module.exports = bookingRouter;

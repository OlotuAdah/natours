const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const TourModel = require('../models/tourModel');
const catchAsyncError = require('../utils/catchAsyncError');
const AppError = require('../utils/AppError');

exports.getCheckoutSession = catchAsyncError(async (req, res, next) => {
  //1: get the currently booked tour
  const tour = await TourModel.findById(req.params.tourId);

  //2: create the  checkout getCheckoutSession
  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    //array of multiple items
    line_items: [
      {
        name: `${tour.name} tour `, //e.g moutain hiker tour
        description: tour.summary,
        // images: [],
        amount: tour.price * 100,
        currency: 'NGN',
        quantity: 1,
      },
    ],
  });

  //3: send session back to client
  res.status(200).json({ status: 'Success', session: stripeSession });
});

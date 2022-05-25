exports.getUsers = (req, res, next) => {
  return res.status(200).json("Sending users!");
};

exports.getUser = (req, res, next) => {
  return res.status(200).json("Sending user with id: " + req.params.userId);
};

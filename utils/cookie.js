exports.cookieOptions = {
  expires: new Date(
    Date.now() + process.env.jwtCookieExpiresIn * 24 * 60 * 60 * 1000
  ),
  secure: true, //if true then cookie can only be set via https request
  httpOnly: true,
};

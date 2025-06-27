
exports.logout = (req, res) => {
  try {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict'
    });
    res.status(200).send({ message: "Logout successful." });
  } catch (err) {
    res.status(500).send("An error occurred during logout.");
  }
};
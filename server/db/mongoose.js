const mongoose = require('mongoose');

require('dotenv').config(); // .env

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);

module.exports = {
  mongoose
};

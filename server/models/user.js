const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1
  }
});

const User = mongoose.model('User', userSchema);

module.exports = { User };

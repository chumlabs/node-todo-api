const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tokens: [
    {
      access: {
        type: String,
        required: true
      },
      token: {
        type: String,
        required: true
      }
    }
  ]
});

userSchema.methods.toJSON = function() {
  const user = this;
  const { _id, email } = user.toObject();

  return { _id, email };
};

userSchema.methods.generateAuthToken = function() {
  const user = this;
  const access = 'auth';
  const secKey = 'Sr6RHgqGxT3ZhdYsdS3SvJ';
  const token = jwt
    .sign({ _id: user._id.toHexString(), access }, secKey, { expiresIn: 60 * 60 * 24 })
    .toString();

  user.tokens = user.tokens.concat([{ access, token }]);

  return user
    .save()
    .then(() => token)
    .catch(err => console.log(err));
};

userSchema.statics.findByToken = function(token) {
  let User = this;
  let decoded;
  const secKey = 'Sr6RHgqGxT3ZhdYsdS3SvJ';

  try {
    decoded = jwt.verify(token, secKey);
  } catch (err) {
    return Promise.reject();
  }

  return User.findOne({
    _id: decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};

const User = mongoose.model('User', userSchema);

module.exports = { User };

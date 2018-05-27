const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const key = process.env.JWTSEC;

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

// schema middleware
// - pwd hash on save event
userSchema.pre('save', function(next) {
  const user = this;

  if (user.isModified('password')) {
    bcrypt
      .genSalt(10)
      .then(salt => bcrypt.hash(user.password, salt))
      .then(hash => (user.password = hash))
      .then(() => next())
      .catch(err => {
        // log error
      });
  } else {
    next();
  }
});

// findByLoginCredentials model method
// - used to find user using username/pwd
userSchema.statics.findByLoginCredentials = function(credentials) {
  let User = this;
  const { email, password } = credentials;

  return User.findOne({ email }).then(user => {
    if (!user) return Promise.reject(new Error('credentials do not match'));

    // email found, check pwd...
    return bcrypt
      .compare(password, user.password)
      .then(
        isMatch =>
          isMatch ? user : Promise.reject(new Error('credentials do not match'))
      );
  });
};

// findByToken model method
// - used to find user by token
userSchema.statics.findByToken = function(token) {
  let User = this;
  let decoded;

  try {
    decoded = jwt.verify(token, key);
  } catch (err) {
    return Promise.reject();
  }

  return User.findOne({
    _id: decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};

// toJSON (shadowing) instance method
// - ensures only id & email user props are returned
userSchema.methods.toJSON = function() {
  const user = this;
  const { _id, email } = user.toObject();

  return { _id, email };
};

// jwt auth token generator/creator instance method
// - adds new token to tokens user prop
userSchema.methods.generateAuthToken = function() {
  const user = this;
  const access = 'auth';
  const token = jwt
    .sign({ _id: user._id.toHexString(), access }, key, { expiresIn: 60 * 60 * 24 })
    .toString();

  user.tokens = user.tokens.concat([{ access, token }]);

  return user.save().then(() => token);
};

// jwt remove token instance method
// - removes a given token
userSchema.methods.removeToken = function(token) {
  const user = this;

  return user.update({
    $pull: {
      tokens: {
        token
      }
    }
  });
};

const User = mongoose.model('User', userSchema);

module.exports = { User };

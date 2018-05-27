// config env variables for dev/test
require('./config/config');

// node_modules imports
const _ = require('lodash/core');
const express = require('express');
// const bodyParser = require('body-parser');  // not needed for .json / .urlEncoded
const { ObjectID } = require('mongodb');

// app imports
const port = process.env.PORT;
const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');

const app = express();

// parser
app.use(express.json()); // needs error handling !!!

// users routes
// POST
app.post('/users', (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);
  const user = new User(body);

  user
    .generateAuthToken()
    .then(token => {
      res.header('x-auth', token).send(user);
    })
    .catch(err => {
      res.sendStatus(400);
      // console.log(`error saving new user: `, err.message);
      // log error
    });
});

app.post('/users/login', (req, res) => {
  const { email, password } = req.body;
  const authToken = req.header('x-auth') || null;

  if (!email || !password) {
    res.status(400).send('username and password required');
  } else {
    User.findByLoginCredentials({ email, password })
      .then(user => {
        // res with user & new token
        return user.generateAuthToken().then(token => {
          res.header('x-auth', token).send(user);

          // TODO: if token exists, remove token & generate a new one
        });
      })
      .catch(err => {
        res.status(400).send(err.message);
        // log error
      });
  }
});

// GET /users
app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

// todos routes
// save todo (post)
app.post('/todos', (req, res) => {
  const todo = new Todo({
    text: req.body.text
  });

  todo
    .save()
    .then(doc => res.send(doc))
    .catch(err => {
      res.status(400).send(err.message);
      // log error
    });
});

// get all todos
app.get('/todos', (req, res) => {
  Todo.find()
    .then(todos => res.send({ todos }))
    .catch(err => {
      res.status(400).send(err.message);
      // log error
    });
});

// get specific todo
// TODO: remove todo object in response?
app.get('/todos/:id', (req, res) => {
  const { id } = req.params;

  if (!ObjectID.isValid(id)) {
    return res.sendStatus(404);
  } else {
    Todo.findById(id)
      .then(todo => (todo ? res.send({ todo }) : res.sendStatus(404)))
      .catch(err => res.sendStatus(400));
  }
});

// remove todo
app.delete('/todos/:id', (req, res) => {
  const { id } = req.params;

  if (!ObjectID.isValid(id)) {
    return res.sendStatus(404);
  }

  Todo.findByIdAndRemove(id)
    .then(todo => (todo ? res.send({ todo }) : res.sendStatus(404)))
    .catch(err => res.sendStatus(400));
});

// patch (UPDATE) todo
app.patch('/todos/:id', (req, res) => {
  const { id } = req.params;
  const update = _.pick(req.body, ['text', 'completed']);
  const body = Object.assign({}, update);

  // console.log('update obj: ', update);

  if (!ObjectID.isValid(id)) {
    return res.sendStatus(404);
  }

  // handle completed value
  if (_.isBoolean(update.completed) && update.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  // console.log('body obj: ', body);

  Todo.findByIdAndUpdate(id, { $set: body }, { new: true })
    .then(todo => (todo ? res.send({ todo }) : res.sendStatus(404)))
    .catch(err => res.sendStatus(400));
});

// start listener
app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});

module.exports = { app };

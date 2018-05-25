const _ = require('lodash');
const express = require('express');
// const bodyParser = require('body-parser');  // not needed for .json .urlEncoded
const { ObjectID } = require('mongodb');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

// env
const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());

// todos route
// save todo (post)
app.post('/todos', (req, res) => {
  const todo = new Todo({
    text: req.body.text
  });

  todo.save().then(
    doc => {
      res.send(doc);
    },
    err => {
      res.status(400).send(err);
    }
  );
});

// get all todos
app.get('/todos', (req, res) => {
  Todo.find().then(
    todos => {
      return res.send({ todos });
    },
    err => res.status(400).send(err)
  );
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

  console.log(id);

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

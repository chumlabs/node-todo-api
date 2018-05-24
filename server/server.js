const express = require('express');
// const bodyParser = require('body-parser');  // not needed for .json .urlEncoded
const { ObjectID } = require('mongodb');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const port = 3000;

const app = express();

app.use(express.json());

// todos route
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

app.get('/todos', (req, res) => {
  Todo.find().then(
    todos => {
      res.send({ todos });
    },
    err => res.status(400).send(err)
  );
});

// sepecific todo
// TODO: remove todo object in response?
app.get('/todos/:id', (req, res) => {
  const { id } = req.params;

  if (!ObjectID.isValid(id)) {
    res.sendStatus(404);
  } else {
    Todo.findById(id)
      .then(todo => (todo ? res.send({ todo }) : res.sendStatus(404)))
      .catch(err => res.sendStatus(400));
  }
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});

module.exports = { app };

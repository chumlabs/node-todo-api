const express = require('express');
// const bodyParser = require('body-parser');  // not needed for .json .urlEncoded

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

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});

module.exports = { app };

const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const { User } = require('../../models/user');
const { Todo } = require('../../models/todo');

// test data
const personOneID = new ObjectID();
const personTwoID = new ObjectID();
const key = process.env.JWTSEC;

const users = [
  {
    _id: personOneID,
    email: 'personOne@test.com',
    password: 'passwordForPerson1',
    tokens: [
      {
        access: 'auth',
        token: jwt.sign({ _id: personOneID, access: 'auth' }, key).toString()
      }
    ]
  },
  {
    _id: personTwoID,
    email: 'personTwo@test.com',
    password: 'passwordForPerson2',
    tokens: [
      {
        access: 'auth',
        token: jwt.sign({ _id: personTwoID, access: 'auth' }, key).toString()
      }
    ]
  }
];

const todos = [
  {
    _id: new ObjectID(),
    text: 'test todo number 1',
    _createdBy: personOneID
  },
  {
    _id: new ObjectID(),
    text: 'test todo number 2',
    _createdBy: personTwoID,
    completed: true,
    completedAt: new Date().getTime()
  }
];

const seedUsers = done => {
  User.remove({})
    .then(() => {
      // create two users
      const personOne = new User(users[0]).save();
      const personTwo = new User(users[1]).save();

      return Promise.all([personOne, personTwo]);
    })
    .then(() => done())
    .catch(err => console.log(err));
};

// clear test db
const seedTodos = done => {
  Todo.remove({})
    .then(() => {
      Todo.insertMany(todos);
    })
    .then(() => done())
    .catch(err => console.log(err));
};

module.exports = { todos, seedTodos, users, seedUsers };

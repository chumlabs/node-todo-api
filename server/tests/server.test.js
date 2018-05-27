const request = require('supertest');

const { ObjectID } = require('mongodb');

const { app } = require('../server');
const { Todo } = require('../models/todo');
const { User } = require('../models/user');
// seed data
const { todos, seedTodos, users, seedUsers } = require('./seed/seed');

// pre-test prep
beforeEach(seedUsers);
beforeEach(seedTodos);

// TESTING USER routes
describe('POST /users', () => {
  const email = 'brandNewUser@test.com';
  const password = 'brandNewPassword';

  test('should create a (new) user and hash pwd', done => {
    request(app)
      .post('/users')
      .send({ email, password })
      .expect(200)
      .expect(res => {
        expect(res.headers['x-auth']).toBeTruthy();
        expect(res.body._id).toBeTruthy();
        expect(res.body.email).toBe(email);
      })
      .end(err => {
        if (err) return done(err);
        User.findOne({ email }).then(user => {
          expect(user).toBeTruthy();
          expect(user.password).not.toBe(password);
          done();
        });
      });
  });

  test('should not create user if account (email) already exists', done => {
    request(app)
      .post('/users')
      .send({ email: users[1].email, password })
      .expect(400)
      .expect(res => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });

  test('should return validation errors for malformed data', done => {
    request(app)
      .post('/users')
      .send({ email: 'notAnEmail', password })
      .expect(400)
      .expect(res => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('GET /users/me', () => {
  test('should return authenticated user', done => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        const { _id, email } = res.body;
        expect(_id).toBe(users[0]._id.toHexString());
        expect(email).toBe(users[0].email);
      })
      .end(done);
  });

  test('should return 401 if not authenticated', done => {
    request(app)
      .get('/users/me')
      .set('x-auth', 'JD390uwj0239j0wfhwf9')
      .expect(401)
      .expect(res => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

// TESTING TODO routes
describe('POST /todos', () => {
  test('should create a new todo', done => {
    const text = 'get it done';

    request(app)
      .post('/todos')
      .send({ text })
      .expect(200)
      .expect(res => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({ text })
          .then(todos => {
            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
            done();
          })
          .catch(err => done(err));
      });
  });

  test('should not create todo from invalid data', done => {
    request(app)
      .post('/todos')
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find()
          .then(todos => {
            expect(todos.length).toBe(2);
            done();
          })
          .catch(err => done(err));
      });
  });
});

describe('GET /todos', () => {
  test('should retrieve all todos', done => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect(res => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  test('should return todo object', done => {
    const { _id: id, text } = todos[0];
    request(app)
      .get(`/todos/${id.toHexString()}`)
      .expect(200)
      .expect(res => {
        // console.log(res.body);
        expect(res.body.todo.text).toBe(text);
      })
      .end(done);
  });

  test('should return 404 response for invalid id', done => {
    const id = 9827349;
    request(app)
      .get(`/todos/${id}`)
      .expect(404)
      .end(done);
  });

  test('should return 404 for non-existent (but valid) id', done => {
    const id = new ObjectID();
    request(app)
      .get(`/todos/${id.toHexString()}`)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  const { _id: id, text } = todos[0];

  test('removes a todo with valid id', done => {
    request(app)
      .delete(`/todos/${id.toHexString()}`)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(text);
      })

      .end((err, res) => {
        if (err) return done(err);

        Todo.findById(id.toHexString())
          .then(todo => {
            expect(todo).toBeFalsy();
            done();
          })
          .catch(err => done(err));
      });
  });

  test('should return 404 response for invalid id', done => {
    const id = 9827349;
    request(app)
      .delete(`/todos/${id}`)
      .expect(404)
      .end(done);
  });

  test('should return 404 for non-existent (but valid) id', done => {
    const id = new ObjectID();
    request(app)
      .delete(`/todos/${id.toHexString()}`)
      .expect(404)
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  test('should update an existing todo', done => {
    const { _id: id, completed } = todos[0];
    const updatedText = 'updated todo text';
    const updatedTodo = { text: updatedText };

    request(app)
      .patch(`/todos/${id}`)
      .send(updatedTodo)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(updatedText);
        expect(res.body.todo.completed).toBeFalsy();
        expect(res.body.todo.completedAt).toBeFalsy();
      })
      .end(done);
  });

  test('should update complete & completedAt when completed is updated to true', done => {
    const { _id: id } = todos[0];
    const updatedText = 'updated todo text again';
    const updatedTodo = { text: updatedText, completed: true };

    request(app)
      .patch(`/todos/${id}`)
      .send(updatedTodo)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(updatedText);
        expect(res.body.todo.completed).toBeTruthy();
        expect(res.body.todo.completedAt).toBeTruthy();
      })
      .end(done);
  });

  test('should update complete & completedAt when completed is updated to false', done => {
    const { _id: id } = todos[1];
    const updatedTodo = { completed: false };

    request(app)
      .patch(`/todos/${id}`)
      .send(updatedTodo)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.completed).toBeFalsy();
        expect(res.body.todo.completedAt).toBeFalsy();
      })
      .end(done);
  });

  test('should reply with 404 for invalid id', done => {
    const id = 9827349;
    request(app)
      .delete(`/todos/${id}`)
      .expect(404)
      .end(done);
  });

  test('should not change todo for valid id but invalid data', done => {
    const { _id: id } = todos[0];
    const updatedTodo = { inject: "console.log('gotcha')" };

    request(app)
      .patch(`/todos/${id}`)
      .send(updatedTodo)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.inject).toBeFalsy;
      })
      .end(done);
  });
});

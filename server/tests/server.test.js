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
        User.findOne({ email })
          .then(user => {
            expect(user).toBeTruthy();
            expect(user.password).not.toBe(password);
            done();
          })
          .catch(err => done(err));
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

describe('POST /users/login', () => {
  const { _id, email, password } = users[1];

  test('should login user with valid credentials', done => {
    request(app)
      .post('/users/login')
      .send({ email, password })
      .expect(200)
      .expect(res => {
        expect(res.body.email).toBe(email);
        expect(res.body._id).toBe(_id.toHexString());
        expect(res.headers['x-auth']).toBeTruthy();
      })
      .end((err, res) => {
        if (err) return done(err);

        User.findById(_id)
          .then(user => {
            expect(user.tokens[1]).toMatchObject({
              access: 'auth',
              token: res.headers['x-auth']
            });
            done();
          })
          .catch(err => done(err));
      });
  });

  test('should return 400 for existing user, incorrect user password', done => {
    request(app)
      .post('/users/login')
      .send({ email, password: 'invalidPassword' })
      .expect(400)
      .expect(res => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });

  test('should return 400 for non-existing user', done => {
    request(app)
      .post('/users/login')
      .send({ email: 'nonExistentUser@test.com', password })
      .expect(400)
      .expect(res => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });

  test('should return 400 for missing credential (password)', done => {
    request(app)
      .post('/users/login')
      .send({ email: email })
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

describe('DELETE /users/me/token', () => {
  test('should remove auth token on logout', done => {
    const token = users[0].tokens[0].token;
    const _id = users[0]._id;

    request(app)
      .delete('/users/me/token')
      .set('x-auth', token)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        User.findById(_id)
          .then(user => {
            expect(user.tokens.length).toBe(0);
            done();
          })
          .catch(err => done(err));
      });
  });

  test('should respond with 400 error for invalid token', done => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', 'jfjfjfjdkNOTAVALIDTOKENlkjsdfofeoe')
      .expect(401)
      .end(done);
  });
});

// TESTING TODO routes
describe('POST /todos', () => {
  const token = users[0].tokens[0].token;
  const text = 'get it done';

  test('should create a new todo', done => {
    request(app)
      .post('/todos')
      .set('x-auth', token)
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
      .set('x-auth', token)
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
  const token = users[0].tokens[0].token;

  test('should retrieve all todos', done => {
    request(app)
      .get('/todos')
      .set('x-auth', token)
      .expect(200)
      .expect(res => {
        expect(res.body.todos.length).toBe(1);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  const token = users[0].tokens[0].token;
  const { _id: id, text } = todos[0];

  test('should return a specific todo', done => {
    request(app)
      .get(`/todos/${id.toHexString()}`)
      .set('x-auth', token)
      .expect(200)
      .expect(res => {
        // console.log(res.body);
        expect(res.body.todo.text).toBe(text);
      })
      .end(done);
  });

  test('should return 404 response for invalid todo ID', done => {
    const invalidID = 'invalidID';

    request(app)
      .get(`/todos/${invalidID}`)
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });

  test('should not return todo created by another user (return 404)', done => {
    const validID = todos[1]._id;

    request(app)
      .get(`/todos/${validID.toHexString()}`)
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  const { _id: id, text } = todos[0];
  const token = users[0].tokens[0].token;

  test('removes a todo with valid id', done => {
    request(app)
      .delete(`/todos/${id.toHexString()}`)
      .set('x-auth', token)
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

  test('does not remove a todo created by another user', done => {
    const altID = todos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${altID}`)
      .set('x-auth', token)
      .expect(404)
      .end((err, res) => {
        if (err) return done(err);

        Todo.findById(id.toHexString())
          .then(todo => {
            expect(todo).toBeTruthy();
            done();
          })
          .catch(err => done(err));
      });
  });

  test('should return 404 response for invalid id', done => {
    const id = 9827349;
    request(app)
      .delete(`/todos/${id}`)
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });

  test('should return 404 for non-existent (but valid) id', done => {
    const id = new ObjectID().toHexString();
    request(app)
      .delete(`/todos/${id}`)
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  const token = users[0].tokens[0].token;

  test('should update an existing todo', done => {
    const { _id: id, completed } = todos[0];
    const updatedText = 'updated todo text';
    const updatedTodo = { text: updatedText };

    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', token)
      .send(updatedTodo)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(updatedText);
        expect(res.body.todo.completed).toBeFalsy();
        expect(res.body.todo.completedAt).toBeFalsy();
      })
      .end(done);
  });

  test("should not update another user's todo", done => {
    const { _id: id, completed, text } = todos[1];
    const updatedTodo = { text: 'updated todo text' };

    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', token)
      .send(updatedTodo)
      .expect(404)
      .end((err, res) => {
        if (err) return done(err);

        Todo.findById(id.toHexString())
          .then(todo => {
            expect(todo.text).toBe(text);
            done();
          })
          .catch(err => done(err));
      });
  });

  test('should update complete & completedAt when completed is updated to true', done => {
    const { _id: id } = todos[0];
    const updatedText = 'updated todo text again';
    const updatedTodo = { text: updatedText, completed: true };

    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', token)
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
    const User2Token = users[1].tokens[0].token;

    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', User2Token)
      .send(updatedTodo)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.completed).toBeFalsy();
        expect(res.body.todo.completedAt).toBeFalsy();
      })
      .end(done);
  });

  test('should reply with 404 for invalid id', done => {
    const id = new ObjectID().toHexString();
    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });

  test('should not change todo for valid id but invalid data', done => {
    const { _id: id } = todos[0];
    const updatedTodo = { inject: "console.log('gotcha')" };

    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', token)
      .send(updatedTodo)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.inject).toBeFalsy;
      })
      .end(done);
  });
});

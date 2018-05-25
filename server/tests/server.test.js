const request = require('supertest');

const { ObjectID } = require('mongodb');

const { app } = require('../server');
const { Todo } = require('../models/todo');
// const { User } = require('../models/user');

// test data
const todos = [
  {
    _id: new ObjectID(),
    text: 'test todo number 1'
  },
  {
    _id: new ObjectID(),
    text: 'test todo number 2',
    completed: true,
    completedAt: new Date().getTime()
  }
];

// clear test db
beforeEach(done => {
  Todo.remove({})
    .then(() => {
      Todo.insertMany(todos);
    })
    .then(() => done());
});

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

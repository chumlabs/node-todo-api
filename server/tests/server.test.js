const request = require('supertest');

const { app } = require('../server');
const { Todo } = require('../models/todo');
// const { User } = require('../models/user');

// clear test db
beforeEach(done => {
  Todo.remove({}).then(() => done());
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

        Todo.find()
          .then(allTodos => {
            expect(allTodos.length).toBe(1);
            expect(allTodos[0].text).toBe(text);
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
          .then(allTodos => {
            expect(allTodos.length).toBe(0);
            done();
          })
          .catch(err => done(err));
      });
  });
});

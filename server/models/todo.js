const mongoose = require('mongoose');

const todoSchema = mongoose.Schema({
  text: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Number,
    default: null
  },
  _createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  _assignedTo: {
    type: mongoose.Schema.Types.ObjectId
  }
});

const Todo = mongoose.model('Todo', todoSchema);

module.exports = { Todo };

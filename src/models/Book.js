const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  price: String,
  starRating: Number,
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
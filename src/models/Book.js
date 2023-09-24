const mongoose = require('mongoose');

// Define a Mongoose schema for the books
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  price: String,
  starRating: Number,
});

// Create a Mongoose model based on the schema
const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
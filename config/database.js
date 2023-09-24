const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost:27017/books-scrape'; // MongoDB connection URI Change database name if I need
// MongoDB connection options
const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

module.exports = async function connectToDatabase() {
    try {
        await mongoose.connect(mongoURI, mongoOptions);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};
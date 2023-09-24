const Book = require('../models/Book');

/**
 * Save books to MongoDB.
 * books - An array of book objects to be saved.
 */
async function saveBooksToMongoDB(books) {
    try {
        const existingTitles = await Book.find({ title: { $in: books.map(book => book.title) } });

        // Create a map of existing books
        const existingBooksMap = new Map(existingTitles.map(book => [book.title, book]));

        const bulkOps = [];
        const updatedCount = new Set();

        for (const book of books) {
            const existingBook = existingBooksMap.get(book.title);

            if (existingBook) {
                // Book already exists; check if it needs an update
                if (book.price !== existingBook.price || book.starRating !== existingBook.starRating) {
                    bulkOps.push({
                        updateOne: {
                            filter: { title: book.title },
                            update: { $set: book },
                        },
                    });
                    updatedCount.add(book.title);
                }
            } else {
                // New book; insert it
                bulkOps.push({
                    insertOne: {
                        document: book,
                    },
                });
            }
        }

        if (bulkOps.length > 0) {
            await Book.bulkWrite(bulkOps, { ordered: false });
        }

        console.log(`${bulkOps.length} books processed in total`);
        console.log(`${updatedCount.size} books updated`);
        console.log(`${bulkOps.length - updatedCount.size} new books saved to MongoDB`);
    } catch (err) {
        if (err.code === 11000) {
            // Handle duplicate key error (code 11000)
            console.error('Duplicate key error: This book already exists in the database.');
        } else {
            // Handle other errors
            console.error('Error saving data to MongoDB:', err);
        }
    }
}

module.exports =  saveBooksToMongoDB;

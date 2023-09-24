const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const mongoose = require('mongoose');
const rateLimiter = require('rate-limiter-flexible');


const app = express();
const PORT = 8000;

const startPage = 1; //Page to start scraping 
const baseUrl = 'http://books.toscrape.com/catalogue/page-';
const endPage = 3; // Set the desired page to end the scrapping on
let pageLimitScraped = false; // Flag to track if the page limit has been scraped
let pageLimit = 100; //hard page limit, will update on first scrape to the current max pages

// Rate limiter configuration
const limiter = new rateLimiter.RateLimiterMemory({
    points: 1, // Number of requests allowed per interval
    duration: 2, // Interval duration in seconds
});

const mongoURI = 'mongodb://localhost:27017/books-scrape'; // MongoDB connection URI Change database name if I need

// MongoDB connection options
const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

// Define a Mongoose schema for the books
const bookSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    price: String,
    starRating: Number,
});

// Create a Mongoose model based on the schema
const Book = mongoose.model('Book', bookSchema);

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        await mongoose.connect(mongoURI, mongoOptions);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
}

/**
 * Scrape and save books from a single page.
 * url - The URL of the page to scrape.
 * returns an array of book objects.
 */
async function scrapeBooksFromPage(url) {
    try {
        await limiter.consume(1); // Consume one point for each request //max 1 request per 2 sec
        const response = await axios(url);
        // Generate a random delay between 1 and 6 seconds
        const minDelay = limiter.duration * 1000; // minimum wait time
        const maxDelay = 6000; // 4000ms = 4 seconds
        const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay; // calculating random time to wait between requests
        console.log(`Waiting ${randomDelay / 1000} seconds`);
        await new Promise(resolve => setTimeout(resolve, randomDelay)); // Introduce random delay after each successful request
        const html = response.data;
        const $ = cheerio.load(html);   // Load the HTML content with Cheerio
        const pageBooks = [];

        const starRatings = {
            'One': 1,
            'Two': 2,
            'Three': 3,
            'Four': 4,
            'Five': 5
        };

        $('.product_pod', html).each(function () {
            const price = $(this).find('.price_color').text();
            const title = $(this).find('h3 a').attr('title');
            const starText = $(this).find('.star-rating').attr('class').replace('star-rating ', '');
            const starRating = starRatings[starText] || 0;

            pageBooks.push({
                title,
                price,
                starRating,
            });
        });

        if (!pageLimitScraped) {
            pageLimit = parseInt($('.current').text().trim().split(" ")[3], 10);
            console.log(pageLimit);
            pageLimitScraped = true;
        }
        return pageBooks;
    } catch (err) {
        console.error('Error scraping data:', err);
        throw err; // Re-throw the error to indicate that the function failed
    }
}




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

/**
 * Scrape books from multiple pages.
 * startPage - The page to start scraping.
 * pageLimit - Page to stop scraping at.
 * returns an array of book objects.
 */
async function scrapeBooksFromMultiplePages(startPage, endPage) {
    const allBooks = [];
    const upperBound = Math.min(endPage,pageLimit);

    for (let index = startPage; index <= upperBound; index++) {
        try {
            const url = `${baseUrl}${index}.html`;
            console.log(`Scraping page ${index}${index === 1 ? '' : ` of ${pageLimit}`}`);
            const pageBooks = await scrapeBooksFromPage(url);
            allBooks.push(...pageBooks);
        } catch (error) {
            console.error(`Error scraping page ${index}: ${error}`);
        }
    }

    return allBooks;
}

// Main function to scrape and save books
async function scrapeAndSaveBooks(startPage, endPage) {
    try {
        const allBooks = await scrapeBooksFromMultiplePages(startPage, endPage);
        console.log(`Scraped ${allBooks.length} books in total.`);
        await saveBooksToMongoDB(allBooks);
    } catch (err) {
        console.error('Error in main function:', err);
    }
}

//TODO: scheduler

// Start the application
async function start() {
    await connectToMongoDB();
    await scrapeAndSaveBooks(startPage, endPage);
    console.log('Scraping completed.');
    process.exit(0);
}

start();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});




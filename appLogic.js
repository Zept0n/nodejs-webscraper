const saveBooksToDatabase = require('./src/services/databaseService');
const scrapeBooks= require('./src/services/scrapingService');


// Main function to scrape and save books
module.exports= async function scrapeAndSaveBooks(startPage, endPage) {
    try {
        const allBooks = await scrapeBooks(startPage, endPage);
        console.log(`Scraped ${allBooks.length} books in total.`);
        await saveBooksToDatabase(allBooks);
    } catch (err) {
        console.error('Error in main function:', err);
    }
}
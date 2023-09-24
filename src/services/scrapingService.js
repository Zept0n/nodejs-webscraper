const axios = require('axios');
const cheerio = require('cheerio');
const rateLimiter = require('rate-limiter-flexible');

// Rate limiter configuration
const limiter = new rateLimiter.RateLimiterMemory({
    points: 1, // Number of requests allowed per interval
    duration: 2, // Interval duration in seconds
});


let pageLimitScraped = false; // Flag to track if the page limit has been scraped
let pageLimit = 100; //hard page limit, will update on first scrape to the current max pages
const baseUrl = 'http://books.toscrape.com/catalogue/page-';

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
            pageLimitScraped = true;
        }
        return pageBooks;
    } catch (err) {
        console.error('Error scraping data:', err);
        throw err; // Re-throw the error to indicate that the function failed
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
    const upperBound = Math.min(endPage, pageLimit);

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

module.exports= scrapeBooksFromMultiplePages;
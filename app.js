const express = require('express');
const connectToDatabase = require('./config/database');
const scrapeAndSaveBooks= require('./appLogic');

const app = express();
const PORT = 8000;

const startPage = 1; //Page to start scraping 
const endPage = 3; // Set the desired page to end the scrapping on

//TODO: scheduler 

// Start the application
async function start() {
    await connectToDatabase();
    await scrapeAndSaveBooks(startPage, endPage);
    console.log('Scraping completed.');
    process.exit(0);
}

start();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});




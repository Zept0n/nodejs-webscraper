# Node.js Web Scraper for Book Data

A Node.js web scraping project to extract book information from a specific website and save it to a MongoDB database.

## Overview
This is a project that I used to practise different concepts with. It is a web scraper built with Node.js and various libraries like Axios for making HTTP requests and Cheerio for parsing HTML. It's designed to scrape book data from a specific website (http://books.toscrape.com) and store it in a MongoDB database. The scraped data includes book titles, prices, and star ratings.

## Features

- Web scraping of book data from multiple pages.
- Rate limiting to avoid overloading the target website.
- Data storage in a MongoDB database.
- Some error handling and logging for smooth operation.

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (You can use a local or remote MongoDB instance)

### Installation

1. Clone the repository to your local machine
2. Navigate to the project directory
3. Install dependencies with:

```
npm install

```
## Usage

1. Configure your MongoDB connection settings in `config/database.js`.
2. Customize scraping parameters in `app.js`.
3. Run the scraper:

```
npm start

```

## License
This project is licensed under the MIT License.


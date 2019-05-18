# web-crawler

A program that crawls text data from a website at any depth level

### How to use?

1. Clone the repo

2. Install dependencies by running `npm install`

3. Start crawling by running `npm run crawl <website> <depth> <output file>`

   Example: `npm run crawl github.com 2 output.txt`

Output is a text file which contains all the words from the crawled website with their number of appearances:

```
I 49595
love 38230
you 26928
three 23111
thousand 22471
```

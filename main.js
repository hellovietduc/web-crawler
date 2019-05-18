const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const argUrl = process.argv[2].replace(/\s+/g, '');
const argDepth = parseInt(process.argv[3]);
const argOutput = (process.argv[4] || 'output.txt').replace(/\s+/g, '');

if (argUrl.startsWith('https://') || argUrl.startsWith('http://')) {
  console.log('Argument url should not need to include protocol');
  process.exit(0);
}
if (Number.isNaN(argDepth)) {
  console.log('Argument depth should be a number');
  process.exit(0);
}
if (!argOutput.endsWith('.txt')) {
  console.log('Argument output must be a .txt file');
  process.exit(0);
}

// The Store
const Store = {
  lock: false,
  map: new Map(),
  update: function(data) {
    while (this.lock) {}
    this.lock = true;
    data.forEach((val, key) => this.map.set(key, (this.map.has(key) ? this.map.get(key) : 0) + val));
    this.lock = false;
  }
};

// Extract words from a site
const extractText = $ =>
  $('body')
    .text()
    .replace(/[\!\@\#\$\%\&\(\)\_\=\+\[\]\;\:\/\?]/g, ' ')
    .replace(
      /[^a-zA-ZáàảãạÁÀẢÃẠăắằẳẵặĂẮẰẲẴẶâấầẩẫậÂẤẦẨẪẬđĐéèẻẽẹÉÈẺẼẸêếềểễệÊẾỀỂỄỆíìỉĩịÍÌỈĨỊóòỏõọÓÒỎÕỌôốồổỗộÔỐỒỔỖỘơớờởỡợƠỚỜỞỠỢúùủũụÚÙỦŨỤưứừửữựƯỨỪỬỮỰ\s\-]+/g,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim()
    .replace(' - ', '')
    .replace('- ', '')
    .replace(' -', '')
    .split(' ');

// Count number of appearances of each word
const countAppearances = text => {
  const words = new Map();
  text.forEach(w => words.set(w, (words.has(w) ? words.get(w) : 0) + 1));
  return words;
};

// The crawl function
const crawl = async (url, depth, host, tries) => {
  if (!url.startsWith('https://') && !url.startsWith('http://')) url = host + (url.startsWith('/') ? url : '/' + url);
  console.log(`[${depth}] Crawling ${url}`);

  try {
    // Load the site
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Extract text, count words and update Store
    const text = extractText($);
    const words = countAppearances(text);
    Store.update(words);

    // Condition to stop crawling
    if (depth <= 1) return;

    // If still crawling
    // Find every links on this site
    const links = [];
    $('a').each((i, e) => {
      const href = $(e).attr('href');
      if (href.length > 0 && href !== '#') links.push(href);
    });

    // Recursively call crawl function on these links
    await Promise.all(links.map(async link => await crawl(link, depth - 1, host, 0)));
  } catch (err) {
    // If crawling fails, try for 5 times
    if (tries < 5) {
      console.log(`[${depth}] Crawling ${url} failed, retrying (${tries + 1})`);
      await crawl(url, depth, host, tries + 1);
    }
  }
};

(async () => {
  await crawl('https://' + argUrl, argDepth, 'https://' + argUrl, 0);
  Array.from(Store.map.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, val]) => fs.appendFileSync(argOutput, `${key}\t${val}\n`));
})();

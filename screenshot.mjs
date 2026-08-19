import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  const imgBB = await page.$eval('.mobile-slider-img img', el => el.getBoundingClientRect());
  const divBB = await page.$eval('.mobile-slider-img', el => el.getBoundingClientRect());
  console.log('Div BB:', divBB);
  console.log('Img BB:', imgBB);
  
  const linkBB = await page.$eval('.mobile-slider-img', el => el.parentElement.getBoundingClientRect());
  console.log('Link BB:', linkBB);

  await browser.close();
})();

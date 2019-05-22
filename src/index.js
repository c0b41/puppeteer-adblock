const puppet = require('puppeteer-core')
//const chrome = require('chrome-aws-lambda')
const { Request, NetworkFilter } = require('@cliqz/adblocker')

const filter = NetworkFilter.parse('||githubassets.com/assets/dashboard-bootstrap-80793253.js$script');

async function getOptions(isDev) {
  let options = {}
  if (isDev) {
    options = {
      args: [],
      executablePath:
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      headless: false
    }
  } else {
    options = {
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless
    }
  }
  return options
}

let _page = null
let _browser = null

async function getPage() {
  const options = await getOptions(true)

  if (!_browser) {
    _browser = await puppet.launch(options)
  }

  _page = await _browser.newPage()

  return _page
}

async function getScreenshot(url) {
  const page = await getPage()
  
  await page.setRequestInterception(true);

  page.on('request', interceptedRequest => {

      console.log(filter.match(interceptedRequest))
      console.log(interceptedRequest.url())
      interceptedRequest.continue();
  });

  await page.goto(url)

  //await page.close()
  //return text
}


(async () => {

  await getScreenshot('https://www.github.com')

})()
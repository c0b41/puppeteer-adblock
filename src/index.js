const puppeteer = require('puppeteer');
const fetch =  require('isomorphic-unfetch')
const { parse } =  require('tldts')
const { makeRequest, fastHash, FiltersEngine, fetchLists, fetchResources } = require('@cliqz/adblocker')

function loadAdblocker() {
  console.log('Fetching resources...');
  return Promise.all([fetchLists(), fetchResources()]).then(([responses, resources]) => {
    console.log('Initialize adblocker...');
    const deduplicatedLines = new Set();
    for (let i = 0; i < responses.length; i += 1) {
      const lines = responses[i].split(/\n/g);
      for (let j = 0; j < lines.length; j += 1) {
        deduplicatedLines.add(lines[j]);
      }
    }
    const deduplicatedFilters = [...deduplicatedLines].join('\n');

    let t0 = Date.now();
    const engine = FiltersEngine.parse(deduplicatedFilters);
    let total = Date.now() - t0;
    console.log('parsing filters', total);

    t0 = Date.now();
    engine.updateResources(resources, '' + fastHash(resources));
    total = Date.now() - t0;
    console.log('parsing resources', total);

    t0 = Date.now();
    const serialized = engine.serialize();
    total = Date.now() - t0;
    console.log('serialization', total);
    console.log('size', serialized.byteLength);

    t0 = Date.now();
    const deserialized = FiltersEngine.deserialize(serialized);
    total = Date.now() - t0;
    console.log('deserialization', total);

    return deserialized;
  });
}


(async () => {


  const engine = await loadAdblocker()

  const browser = await puppeteer.launch({ 
        headless: false, 
        devtools: false
    });
  
  const page = await browser.newPage();
    
  await page.setRequestInterception(true);
  
 
  page.on('request', interceptedRequest => {

      const { redirect, match } = engine.match(makeRequest(
          {
            sourceUrl: interceptedRequest.url(),
            type: interceptedRequest.resourceType(),
            url: interceptedRequest.url()
          },
          parse
        ));

      if(redirect){
        console.log('ABORT REDIRECT')
        interceptedRequest.abort()
      } else if(match){
        console.log('ABORT MATCH')
        interceptedRequest.abort()
      } else {
        interceptedRequest.continue();
      }

      
  });


   await page.goto('https://www.nytimes.com/')

})()
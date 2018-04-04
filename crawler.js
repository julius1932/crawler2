var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var mongoS = require("./mongoSavaUrls")// including the code to save json to mongo
var promisez=[];
//var START_URL = "http://www.arstechnica.com";
var START_URL = "https://www.familyassets.com/assisted-living/california";
var SEARCH_WORD = "stemming";
var MAX_PAGES_TO_VISIT = 10;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var links=[];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;

pagesToVisit.push(START_URL);
crawl();
function crawl() {
  if(pagesToVisit.length<=0 || numPagesVisited>= MAX_PAGES_TO_VISIT) {
    console.log("visited all pages.");
    Promise.all(promisez).then(function(values) {
       printUrls();
    });
    return;
  }
  var nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {
    // We've already visited this page, so repeat the crawl
    crawl();
  } else {
    // New page we haven't visited
    if(nextPage==null){
      return;
    }
    numPagesVisited++;
    visitPage(nextPage, crawl);
  }
}
function requestPage(url, callback) {
  return new Promise(function(resolve, reject) {
      // Do async job
        request.get(url, function(err, resp, body) {
            if (err) {
                reject(err);
                callback();
            } else {
                resolve(body);
            }
        })
    })
}
function visitPage(url, callback) {
  // Add page to our set
  pagesVisited[url] = true;
  // Make the request
  console.log("Visiting page " + url);
  var requestPag = requestPage(url,callback);
  promisez.push(requestPag);
  requestPag.then(function(body) {
    var $ = cheerio.load(body);
    collectAllLinks($);
    callback();
  }, function(err) {
        console.log(err); 
        callback ();    
    })
  }

function searchForWord($, word) {
  var bodyText = $('html > body').text().toLowerCase();
  return(bodyText.indexOf(word.toLowerCase()) !== -1);
}

function collectInternalLinks($) {
    var relativeLinks = $("a[href^='/']");

    console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function() {
       console.log(baseUrl + $(this).attr('href'));
       
    });
    collectAllLinks($) 
}


function collectAllLinks($) {
    var relativeLinks = $("a");
    //console.log("Found " + relativeLinks.length + "links on page");
    relativeLinks.each(function() {
      var lnk= $(this).attr('href');
      if(lnk==null){
         return;
      }
      if(lnk.startsWith("/")){
         lnk =baseUrl+lnk;
         if (lnk in pagesVisited) {
         }else{
             pagesToVisit.push(baseUrl + $(this).attr('href')); 
         }    
      }
      if (lnk in links){

      }else{
        links.push(lnk);
        itm ={
          url:lnk
        }
        mongoS.saveData(itm);// saving json to mongodb
      }
      
    });
}
function printUrls(){
    console.log(links.length);
   console.log(links);
    mongoS.closeConnection();
}

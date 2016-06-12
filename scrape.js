/*eslint semi: ["error", "never"], strict: 0*/
'use strict'

const uri = 'https://letterboxd.com/bpfvidnite/watchlist/'

const url = require('url')
const Nightmare = require('nightmare')
const vo = require('vo')

vo(run)(function(err, result) {
  if(err) {
    throw err
  }
  console.log(result.length)
  // console.dir(result.map(u => url.resolve(uri, u)))
  require('fs').writeFileSync('links.txt', result.map(u => url.resolve(uri, u)).join('\n'))
  console.log('done.')
})

function* run() {
  const scraper = Nightmare()
  const links = []

  yield scraper.goto(uri)

  links.push(...yield scraper.evaluate(() =>
    Array
      .from(document.querySelectorAll('.linked-film-poster a'))
      .map(n => n.getAttribute('href'))
  ))
  
  while(yield scraper.visible('.paginate-next')) {
    yield scraper.click('.paginate-next')

    links.push(...yield scraper.evaluate(() =>
      Array
        .from(document.querySelectorAll('.linked-film-poster a'))
        .map(n => n.getAttribute('href'))
    ))
  }

  yield scraper.end()

  return links 
}

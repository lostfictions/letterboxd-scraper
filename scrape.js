#!/usr/bin/env node
/*eslint strict: 0*/
'use strict'

const url = require('url')
const Nightmare = require('nightmare')
const vo = require('vo')
const Progress = require('progress')

const argv = require('minimist')(process.argv.slice(2))

const uri = argv._.length > 0 ?
  argv._[0] :
  'https://letterboxd.com/bpfvidnite/watchlist/'

vo(run)(function(err, result) {
  if(err) {
    throw err
  }
  console.log(`Got ${result.length} links.`)
  require('fs').writeFileSync('links.txt', result.map(u => url.resolve(uri, u)).join('\n'))
  console.log('done.')
})

function* run() {
  const scraper = Nightmare()

  scraper.on('page', function(type, message, stack) {
    console.error(`On page: [${type}] "${message}"
    Stack:
    ${stack}`)
  })
  scraper.on('console', function(type, ...args) {
    console.log(`Console on page [${type}]: "${args.join('/')}"`)
  })
  
  yield scraper.goto(uri)
  
  const pages = yield scraper.evaluate(() => Number.parseInt(document.querySelector('.paginate-pages li:last-child a').textContent, 10))

  const progress = new Progress(':current/:total [:bar] :eta s', { total: pages })

  const links = []

  links.push(...yield scraper.evaluate(() =>
    Array
      .from(document.querySelectorAll('.linked-film-poster a'))
      .map(n => n.getAttribute('href'))
  ))
  progress.tick()
  
  for(let page = 2; page <= pages; page++) {
    yield scraper
      .goto('https://letterboxd.com/bpfvidnite/watchlist/page/' + page + '/')
      .wait('footer')

    const ls = yield scraper.evaluate(() =>
      Array
        .from(document.querySelectorAll('.linked-film-poster a'))
        .map(n => n.getAttribute('href'))
    )

    links.push(...ls)

    progress.tick()
  }
  
  yield scraper.end()

  return links 
}

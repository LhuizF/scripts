const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const jsonName = 'data.json';

const webPageData = async () => {
  const { data } = await axios.get('https://withthewill.net/threads/digimon-sprite-animation-thread-read-first-post-fully-working.10472/');
  return cheerio.load(data)
}

const normalize = (str) => str.replace(/[^a-z0-9]/gi, '');

const makeJson = async () => {
  const $ = await webPageData();
  const sections = $('div[class="bbWrapper"]')

  const json = {};
  let currentTitle = '';

  sections.each((i, section) => {
    section.children.forEach((child) => {
      const current = child.name;

      if (current === 'u') {
        const title = $(child).text();
        currentTitle = normalize(title)
      }

      if (!!currentTitle && !json[currentTitle]) {
        json[currentTitle] = [];
      }

      if (current === 'a') {
        const name = $(child).text();
        const href = $(child).attr('href');

        if (href?.includes('.gif') && !href.includes('imageshack')) {
          json[currentTitle].push({
            name: normalize(name),
            url: href
          });
        }
      }
    })
  })

  fs.writeFileSync(jsonName, JSON.stringify(json, null, 2));
}

const downloadGifs = async () => {
  if (!fs.existsSync(jsonName)) {
    await makeJson();
  }
  const data = require('./data.json');

  Object.keys(data).forEach((key) => {
    const downloadFolder = path.join(__dirname, `./download`);

    if (!fs.existsSync(downloadFolder)) {
      console.log('creating download folder');
      fs.mkdirSync(downloadFolder);
    }

    const folder = normalize(key)
    const dir = path.join(__dirname, `./download/${folder}`);
    console.log('dir ->', dir);
    if (!fs.existsSync(dir)) {
      console.log('creating ->', dir);
      fs.mkdirSync(dir);
    }

    Object.keys(data[key]).forEach(async (gif) => {
      const file = data[key][gif]

      axios({
        method: 'get',
        url: file.url,
        responseType: 'stream'
      }).then(res => {
        res.data.pipe(fs.createWriteStream(`${downloadFolder}/${folder}/${file.name}.gif`))
      })
    })

  })

  console.log('Done')
}

downloadGifs();

const { Client } = require("whatsapp-web.js");
const fs = require('fs');
const webp = require('webp-converter');


const phoneLogHandler = (log) => {
    const receiver = log.split('_')[0]
    const sender = log.split('_')[1]
    const date = log.split('_')[2]
    const flag = log.split('_')[3]

    const dataLog = `${receiver.replace(/\D/g, '')}_${sender.replace(/\D/g, '')}_${date.replace(/\D/g, '')}_${flag}\n`;
    fs.writeFileSync('./phoneLog.txt', dataLog, {flag: 'a+'});
};

const getIndexes = (list, key) => {
    var indexes = [];
    list.forEach( (val, index) => {
        if (val === key) {
            indexes.push(index);
        }
    });
    return indexes;
};

const getActivePhoneLog = (list, key) => {
    var result = '';
    key.forEach(val => {
        if (list[val].split('_')[3] === 'Y') {
            result = list[val];
        } else {
            result = false;
        }
    })
    return result
};

const setPhoneLogInactive = (key) => {
    const read = fs.readFileSync('./phoneLog.txt', { encoding: 'utf8' });
    const tempLog = read.split('\n');
    const split = tempLog[key].split('_');
    tempLog[key] = `${split[0]}_${split[1]}_${split[2]}_N`;
    fs.writeFileSync('./phoneLog.txt', '');
    tempLog.forEach(val => {
        fs.writeFileSync('./phoneLog.txt', `${val}\n`, {flag: 'a+'});
    });
};

const preventDoubleActivePhoneLog = (receiver) => {
    const read = fs.readFileSync('./phoneLog.txt', { encoding: 'utf8' });
    const tempLog = read.split('\n');
    tempLog.pop()
    fs.writeFileSync('./phoneLog.txt', '');
    tempLog.forEach(val => {
        const split = val.split('_')
        if (split[0] == receiver) {
            const dataLog = `${split[0]}_${split[1]}_${split[2]}_N`
            fs.writeFileSync('./phoneLog.txt', `${dataLog}\n`, {flag: 'a+'});
        } else {
            const dataLog = val
            fs.writeFileSync('./phoneLog.txt', `${dataLog}\n`, {flag: 'a+'});
        }
    })
};

const convertSticker = (data) => {
    async function init() {
        let result = await webp.str2webpstr(data,"webp","-q 80");
        await sleep(2000)
        return result
      }
      
      function sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
      }
      const result = init();
      return result
}

module.exports = { phoneLogHandler, getIndexes, getActivePhoneLog, setPhoneLogInactive, preventDoubleActivePhoneLog, convertSticker }
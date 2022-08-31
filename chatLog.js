const fs = require('fs');

const chatLogHandler = (log) => {
    fs.writeFileSync('./chatLog.txt', `${log}\n`, {flag: 'a+'})
};

module.exports = { chatLogHandler }
const fs = require('fs')

const phoneLogHandler = (log) => {
    const receiver = log.split('_')[0]
    const sender = log.split('_')[1]
    const date = log.split('_')[2]
    const flag = log.split('_')[3]

    const dataLog = `${receiver.replace(/\D/g, '')}_${sender.replace(/\D/g, '')}_${date.replace(/\D/g, '')}_${flag}\n`;
    fs.writeFileSync('./phoneLog.txt', dataLog, {flag: 'a+'});
}

module.exports = { phoneLogHandler }
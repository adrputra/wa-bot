const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { phoneNumberFormatter } = require('./formatter');
const { chatLogHandler } = require('./chatLog');
const { phoneLogHandler, getIndexes, getActivePhoneLog, setPhoneLogInactive, preventDoubleActivePhoneLog } = require('./Handler')
const { removeBG, writeOutput } = require('./remove-bg');
const mime = require('mime-types');
const fs = require('fs');
const express = require('express');
const socketIO = require('socket.io');
const http = require('http');

const port = process.env.PORT || 8000;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.get('/', (req, res) => {
    res.sendFile('index.html', {
      root: __dirname
    });
  });

  const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
    },
    authStrategy: new LocalAuth({ clientId: "confess-bot" })
  });


var receiver = [];
var phoneLogList = [];
const updatePhoneLog = () => {
    receiver.splice(0,receiver.length)
    phoneLogList.splice(0,phoneLogList.length)
    var phoneLog = fs.readFileSync('./phoneLog.txt', { encoding: 'utf8' });
    var phoneLogListTemp = phoneLog.split('\n');
    phoneLogListTemp.forEach(val => {
        phoneLogList.push(val);
    });
    phoneLogListTemp.forEach(val => {
        receiver.push(val.split('_')[0]);
    });
    receiver.pop();
    phoneLogList.pop();
};

const checkRegisteredNumber = function(number) {
    const isRegistered = client.isRegisteredUser(number);
    return isRegistered;
  }

const commandList = ['!ping', '!help', '!confess', '!credit', '!edit'];
var helpMessage = '*!ping*\nCheck Bot Status\n\n*!confess*\n_!confess#phone_number#message_\n\nUntuk mengirimkan pesan secara anonymous dan memberikan waktu bagi penerima selama 5 menit untuk membalas pesan pengirim melalui Bot.\n\n*!edit*\n!edit_red (red = BG Color)\n!edit_#fc0303 (#fc0303 = Code Hex Colour)\n\nFitur Remove Background foto. Command dikirimkan sebagai *caption* dari media foto.\n\n*!sticker*\nMengubah foto menjadi sticker. Command dikirimkan sebagai caption dari media foto.\n\n*!credit*\nTampilkan credit.';
var sentTag = '[BOT] _Your confession is sent._';
var replyTag = '[BOT] _Reply from someone._\n\n';
var guideTag = '[BOT] _Someone is confessing to you. You have 5 minutes to reply._';
var unknownTag = '[BOT] _Command unknown. Type *!help* to view command list._'
    
client.on('message', async message => {
	if(message.body === '!ping') {
		message.reply('_[Bot is Online]_ \nType *!help* to view command list.');
	}
    if (message.body === '!help') {
        message.reply(helpMessage)
    }
    if (message.body === '!credit') {
        message.reply('This Bot is created by _*Adrputra*_. Still in development progress.')
    }
    if (message.hasMedia) {
      if (message.body.split('_')[0] === '!edit') {
        const media = await message.downloadMedia();
        message.reply(`Please wait your photo is being edited ...`);

        const filename = message.from.split('@')[0] + '_' + Date.now();
        const extension = mime.extension(media.mimetype);
        const fullFilename = './pict/' + filename + '.' + extension;

        try {
          fs.writeFileSync(fullFilename, media.data, { encoding: 'base64' }); 
          console.log('File downloaded successfully!', fullFilename);
        } catch (err) {
          console.log('Failed to save the file:', err);
        }

        const outputFile = removeBG(filename, message.body.split('_')[1], extension)
        const attachment = await writeOutput(outputFile)

        const editedMedia = await new MessageMedia(media.mimetype, attachment, 'EditedPhotoBG');
        chatLogHandler(`${message.from}_Change Photo Background to ${message.body.split('_')[1]}_${timeNow}`);
        await client.sendMessage(message.from, editedMedia, {caption: 'This is your edited photo.'})
        return
      }
      if (message.body.split('_')[0] === '!sticker') {
        const media = await message.downloadMedia();
        await client.sendMessage(message.from, media, {sendMediaAsSticker: true});
        return
      }
      else {
        message.reply('This current version bot is unable to handle media!')
        return
      }
    }
    if (message.body.split('#')[0] === '!confess') {
        const phoneNumber = phoneNumberFormatter(message.body.split('#')[1])
        preventDoubleActivePhoneLog(phoneNumber.split('@')[0])
        const isRegisteredNumber = checkRegisteredNumber(phoneNumber);
        if (isRegisteredNumber) {
            client.sendMessage(phoneNumber, message.body.split('#')[2])
            client.sendMessage(phoneNumber, guideTag)
            client.sendMessage(message.from, sentTag)
            var timeNow = new Date();
            var timeLimit = new Date(timeNow.getTime() + 30*60000);
            phoneLogHandler(`${phoneNumber}_${phoneNumberFormatter(message.from)}_${timeLimit.getTime()}_Y`);
            chatLogHandler(`${phoneNumber}_${phoneNumberFormatter(message.from)}_${message.body}_${timeNow}`);
            updatePhoneLog();
        } else {
            message.reply('Number is not registered!')
        }
    }
    if (receiver.includes(String(message.from.split('@')[0]))) {
        const index = getIndexes(receiver, message.from.split('@')[0])
        const activePhoneLog = getActivePhoneLog(phoneLogList, index)
        // const index = receiver.indexOf(String(message.from.split('@')[0]));
        const sender = activePhoneLog.split('_')[1];
        const timestamp = activePhoneLog.split('_')[2];
        if (Date.now() < timestamp) {
            console.log('Receiver is replying ...');
            var timeNow = new Date();
            chatLogHandler(`${message.from.split('@')[0]}_${sender}_${message.body}_${timeNow}`);
            client.sendMessage(phoneNumberFormatter(sender),replyTag+message.body);
            return;
        } else {
            setPhoneLogInactive(index);
            message.reply(unknownTag)
            return;
        }
    } 
    if (!commandList.includes(message.body.split('#')[0]) || message.body.split('')[0] === '!edit') {
      message.reply(unknownTag)
      return
    }
});

client.initialize();

// Socket IO
io.on('connection', function(socket) {
    socket.emit('message', 'Connecting...');
  
    client.on('qr', (qr) => {
      console.log('QR RECEIVED', qr);
      qrcode.toDataURL(qr, (err, url) => {
        socket.emit('qr', url);
        socket.emit('message', 'QR Code received, scan please!');
      });
    });
  
    client.on('ready', () => {
      socket.emit('ready', 'Whatsapp is ready!');
      socket.emit('message', 'Whatsapp is ready!');
    });
  
    client.on('authenticated', () => {
      socket.emit('authenticated', 'Whatsapp is authenticated!');
      socket.emit('message', 'Whatsapp is authenticated!');
      console.log('AUTHENTICATED');
    });
  
    client.on('auth_failure', function(session) {
      socket.emit('message', 'Auth failure, restarting...');
    });
  
    client.on('disconnected', (reason) => {
      socket.emit('message', 'Whatsapp is disconnected!');
      client.destroy();
      client.initialize();
    });
  });

  server.listen(port, function() {
    console.log('App running on *: ' + port);
  });

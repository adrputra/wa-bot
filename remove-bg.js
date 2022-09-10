const { RemoveBgResult, RemoveBgError, removeBackgroundFromImageFile } = require("remove.bg");
const fs = require('fs');

const removeBG = (sender, bgColor, mimetype) => {

  var validBgColor = '';

  if (bgColor.includes('#')) {
    if (validateBgColor(bgColor)) {
      var validBgColor = bgColor;
    } else{
      return "Hex Color not valid!";
    }
  } else {
    var validBgColor = bgColor;
  }
  
  const localFile = `./pict/${sender}.${mimetype}`;
  const outputFile = `./pict/${sender}_edited_${Date.now()}.${mimetype}`;
  
  removeBackgroundFromImageFile({
    path: localFile,
    apiKey: "eemgbYBQVZR46zHc9xzU5t8p",
    size: "regular",
    type: "auto",
    scale: "original",
    position: "50% 100%",
    bg_color: validBgColor,
    outputFile 
  })

  return outputFile
}

const validateBgColor = (bgColor) => {
  var reg=/^#([0-9a-f]{3}){1,2}$/i;
  return reg.test(bgColor)
}

const writeOutput = (outputFile) => {
  async function init() {
    await sleep(10000);
    const attachment = await fs.readFileSync(outputFile, { encoding: 'base64' })
    await sleep(10000);
    return attachment
  }
  
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  const result = init();
  return result
}

module.exports = { removeBG, writeOutput }

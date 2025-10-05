const { imagecribe } = require('./gemini-testing/img-recog.mjs');

const imagePath = './gemini-testing/funny/sun.jpg';

imagecribe(imagePath)
    .then(description => {
        console.log(description);
    })
    .catch(error => {
        console.error('Error describing the image:', error);
    });
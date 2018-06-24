const mongoose = require('mongoose');

const db = 'mongodb://localhost/kwizzer';
mongoose.connect(db)
    .then((mongo) => {
        console.log('Connection with MongoDB established succesfully.');
    })
    .catch((err) => {
        console.log('The Server needs an established connection with MongoDB before starting. You probably forgot to turn it on.');
    });

module.exports = mongoose.conection;
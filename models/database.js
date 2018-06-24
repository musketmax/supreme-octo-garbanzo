const mongoose = require('mongoose');

const db = 'mongodb://musketmax:Lampie159159!@ds161620.mlab.com:61620/kwizzer';
mongoose.connect(db)
    .then((mongo) => {
        console.log('Connection with MongoDB established succesfully.');
    })
    .catch((err) => {
        console.log('The Server needs an established connection with MongoDB before starting. You probably forgot to turn it on.');
    });

module.exports = mongoose.conection;
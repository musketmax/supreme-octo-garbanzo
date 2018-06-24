const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeamSchema = new Schema({
    name: { type: String, required: true },
    status: { type: String, enum: ['#F1F58E', '#99F2A9', '#ff4d4d'], default: '#F1F58E' }, //geel, groen, rood
    answer: { type: String },
    points: { type: Number, default: 0.0 },
    answerStatus: { type: String, enum: ['#F1F58E', '#99F2A9', '#ff4d4d'], default: '#F1F58E' }, //geel, groen, rood
    correctAnswers: { type: Number, default: 0 }
});

module.exports = { Team: mongoose.model('Team', TeamSchema), TeamSchema: TeamSchema };
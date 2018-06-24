const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Team = require('./team');
const Question = require('./question');

const KwizzSchema = new Schema({
    name: { type: String, required: true },
    id: { type: Number, required: true },
    started: { type: Boolean, default: false },
    teams: [Team.TeamSchema],
    currentRound: { type: Number, default: 1 },
    finished: { type: Boolean, default: false },
    nrQuestions: { type: Number, default: 0 },
    currentQuestion: Question.QuestionSchema,
    endOfRound: { type: Boolean, default: false }
});

module.exports = mongoose.model('Kwizz', KwizzSchema);
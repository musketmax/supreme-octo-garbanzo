const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    _id: { type: Schema.Types.ObjectId },
    question: { type: String },
    answer: { type: String },
    category: { type: String }
});

module.exports = { Question: mongoose.model('Question', QuestionSchema), QuestionSchema: QuestionSchema };
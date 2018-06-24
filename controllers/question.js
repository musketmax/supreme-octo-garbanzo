'use strict';

const statusCodes = require('../constants/statusCodesConstants');
const express = require('express');
const router = express.Router();
const Question = require('../models/question');

router.get('/', (req, res, next) => {
    Question.Question.find({}, (err, questions) => {
        if (err) return res.status(statusCodes.SERVER_ERROR).json();
        if (questions !== null) {
            res.status(statusCodes.OK).json(questions);
        } else {
            res.status(statusCodes.NO_CONTENT).json('No questions available');
        }
    });
});

router.get('/category', (req, res, next) => {
    Question.Question.distinct('category', (err, categories) => {
        if (err) return res.status(statusCodes.SERVER_ERROR).json();
        if (categories !== null) {
            res.status(statusCodes.OK).send(categories);
        } else {
            res.status(statusCodes.NO_CONTENT).send('No content available.');
        }
    });
});

module.exports = router;
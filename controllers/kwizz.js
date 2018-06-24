'use strict';

const statusCodes = require('../constants/statusCodesConstants');
const express = require('express');
const router = express.Router();
const Kwizz = require('../models/kwizz');
const io = require('../communication/socket');
const Question = require('../models/question');

function generateID() {
    const min = Math.ceil(10000);
    const max = Math.floor(100000);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function compare(a, b) {
    if (a.correctAnswers < b.correctAnswers)
        return 1;
    if (a.correctAnswers > b.correctAnswers)
        return -1;
    return 0;
}

router.post('/', (req, res, next) => {
    if (req.body.kwizzName && req.body.kwizzName !== null) {
        const newKwizz = new Kwizz({ name: req.body.kwizzName, id: generateID() });

        newKwizz.save((err, kwizz) => {
            if (err) res.status(statusCodes.SERVER_ERROR).json(err.message);
            res.status(statusCodes.OK).json(kwizz);
        });

    } else {
        res.status(statusCodes.BAD_REQUEST).json('Please provide a name for your Kwizz');
    }
});

router.get('/:kwizzId', (req, res, next) => {
    Kwizz.findOne({ id: req.params.kwizzId }, (err, kwizz) => {
        if (err) res.status(statusCodes.BAD_REQUEST).json(err.message);
        if (kwizz !== null)
            res.status(statusCodes.OK).json(kwizz);
        else
            res.status(statusCodes.NO_CONTENT).json(`No Kwizz found with ID ${req.params.kwizzId}`);
    });
});

router.put('/:kwizzId', (req, res, next) => {
    Kwizz.updateOne({ id: req.params.kwizzId }, {
        '$set': {
            started: true
        }
    }, (err, kwizz) => {
        if (err) return res.status(statusCodes.SERVER_ERROR).json();
        const socket = io.getSocketServer();
        socket.to(req.params.kwizzId).emit('message', 'START_KWIZZ');
        res.status(statusCodes.OK).json(kwizz);
    });
});

router.put('/:kwizzId/question/:questionId', (req, res, next) => {
    Kwizz.findOne({ id: req.params.kwizzId }, (err, kwizz) => {
        if (err) return res.status(statusCodes.SERVER_ERROR).json();
        if (kwizz !== null) {
            Question.Question.findOne({ _id: req.params.questionId }, (err, question) => {
                if (err) return res.status(statusCodes.SERVER_ERROR).json();
                if (question !== null) {
                    kwizz.currentQuestion = question;
                    kwizz.save((err, kwizz) => {
                        if (err) return res.status(statusCodes.SERVER_ERROR).json();
                        const socket = io.getSocketServer();
                        socket.to(req.params.kwizzId).emit('message', 'NEW_QUESTION');
                        res.status(statusCodes.OK).json(kwizz);
                    });
                } else {
                    return res.status(statusCodes.NO_CONTENT).json('no question found');
                }
            });
        } else {
            return res.status(statusCodes.NO_CONTENT).json('no kwizz found');
        }
    });
});

router.put('/:kwizzId/team/:teamId/question', (req, res, next) => {
    if (req.body.answer && req.body.answer !== null) {
        let change = null;

        if (req.body.change === true)
            change = {
                'teams.$.answer': req.body.answer,
                'teams.$.answerStatus': '#F1F58E'
            };
        else
            change = {
                'teams.$.answer': req.body.answer
            };

        Kwizz.updateOne({ 'teams._id': req.params.teamId }, {
            '$set': change
        }, (err, kwizz) => {
            if (err) return res.status(statusCodes.SERVER_ERROR).json();
            const socket = io.getSocketServer();
            socket.to(req.params.kwizzId).emit('message', 'NEW_ANSWER');
            res.status(statusCodes.OK).json(kwizz);
        });
    } else {
        return res.status(statusCodes.BAD_REQUEST).json('Missing data');
    }
});

router.put('/:kwizzId/answer', (req, res, next) => {
    console.log(req.body)
    if (req.body && req.body !== null) {
        Kwizz.updateOne({ 'teams._id': req.body._id }, {
            '$set': {
                'teams.$.answerStatus': req.body.answerStatus
            }
        }, (err, kwizz) => {
            if (err) return res.status(statusCodes.SERVER_ERROR).json();
            const socket = io.getSocketServer();
            socket.to(req.params.kwizzId).emit('message', 'CHANGE_ANSWER_STATUS');
            res.status(statusCodes.OK).json(kwizz);
        })
    } else {
        return res.status(statusCodes.BAD_REQUEST).json('Missing data');
    }
});

router.put('/:kwizzId/closeQuestion', (req, res, next) => {
    Kwizz.findOne({ id: req.params.kwizzId }, (err, kwizz) => {
        if (err) return res.status(statusCodes.SERVER_ERROR).json(err.message);
        if (kwizz !== null) {

            const nrQuestions = 2;

            kwizz.nrQuestions++;
            kwizz.currentQuestion = null;
            if (kwizz.nrQuestions >= nrQuestions)
                kwizz.endOfRound = true;

            kwizz.teams.forEach((team) => {
                if (team.answerStatus === '#99F2A9')
                    team.correctAnswers++;
                team.answer = null;
                team.answerStatus = '#F1F58E';
            });

            if (kwizz.nrQuestions >= nrQuestions) {
                kwizz.nrQuestions = 0;
                const rankingResult = kwizz.teams.sort(compare);
                console.log(rankingResult);
                
                kwizz.teams.forEach((team) => {
                    if (team._id === rankingResult[0]._id)
                        team.points += 4;
                    else if (team._id === rankingResult[1]._id)
                        team.points += 2;
                    else if (team._id === rankingResult[2]._id)
                        team.points += 1;
                    else
                        team.points += 0.1;
                });
            }

            kwizz.save((err, kwizz) => {
                if (err) return res.status(statusCodes.SERVER_ERROR).json(err.message);
                const socket = io.getSocketServer();

                if (kwizz.endOfRound)
                    socket.to(req.params.kwizzId).emit('message', 'END_ROUND');
                else
                    socket.to(req.params.kwizzId).emit('message', 'CLOSE_QUESTION');
                return res.status(statusCodes.OK).json(kwizz);
            });

        } else {
            return res.status(statusCodes.NO_CONTENT).json('no kwizz found');
        }
    })
});

router.put('/:kwizzId/newRound', (req, res, next) => {

    Kwizz.findOne({ id: req.params.kwizzId }, (err, kwizz) => {
        if (err) return res.status(statusCodes.SERVER_ERROR).json(err.message);
        if (kwizz !== null) {
            kwizz.currentRound++;
            kwizz.endOfRound = false;

            kwizz.save((err, kwizz) => {
                if (err) return res.status(statusCodes.SERVER_ERROR).json(err.message);
                const socket = io.getSocketServer();
                socket.to(req.params.kwizzId).emit('message', 'NEW_ROUND');
                res.status(statusCodes.OK).json(kwizz);
            });
        } else {
            return res.status(statusCodes.NO_CONTENT).json('Missing data');
        }
    });
});

router.put('/:kwizzId/endKwizz', (req, res, next) => {
    Kwizz.updateOne({ id: req.params.kwizzId }, {
        '$set': {
            finished: true
        }
    }, (err, kwizz) => {
        if (err) return res.status(statusCodes.SERVER_ERROR).json(err.message);
        const socket = io.getSocketServer();
        socket.to(req.params.kwizzId).emit('message', 'END_KWIZZ');
        res.status(statusCodes.OK).json(kwizz);
    });
});

module.exports = router;
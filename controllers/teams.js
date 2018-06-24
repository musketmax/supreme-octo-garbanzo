'use strict';

const statusCodes = require('../constants/statusCodesConstants');
const express = require('express');
const router = express.Router();
const Team = require('../models/team');
const Kwizz = require('../models/kwizz');
const io = require('../communication/socket');

router.post('/:kwizzId', (req, res, next) => {
    if (req.body.teamName && req.body.teamName !== null) {

        Kwizz.findOne({ id: req.params.kwizzId }, async (err, testKwizz) => {
            await testKwizz.teams.forEach((team) => {
                if (team.name === req.body.teamName)
                    return res.status(statusCodes.BAD_REQUEST).json('Team name already exists! Please choose another.');
            });

            const newTeam = new Team.Team({ name: req.body.teamName });

            Kwizz.findOne({ id: req.params.kwizzId }, (err, kwizz) => {
                if (err) return res.status(statusCodes.SERVER_ERROR).json(err.message);
                if (kwizz !== null) {
                    kwizz.teams.push(newTeam);
                    kwizz.save((err, kwizz) => {
                        if (err) return res.status(statusCodes.SERVER_ERROR).json(err.message);
                        const socket = io.getSocketServer();
                        socket.to(req.params.kwizzId).emit('message', 'ADD_TEAM');
                        const payload = {
                            kwizz,
                            newTeam
                        };
                        return res.status(statusCodes.OK).json(payload);
                    });
                } else {
                    return res.status(statusCodes.NO_CONTENT).json('No kwizz found');
                }
            });
        });

    } else {
        return res.status(statusCodes.BAD_REQUEST).json('Please provide a team name');
    }
});

router.put('/:kwizzId/:teamId', (req, res, next) => {
    if (!req.body.status) return next();
    if (req.body && req.body !== null) {

        Kwizz.updateOne({ 'teams._id': req.params.teamId }, {
            '$set': {
                'teams.$.status': req.body.status
            }
        }, (err, kwizz) => {
            if (err) return res.status(statusCodes.SERVER_ERROR).json();
            const socket = io.getSocketServer();
            socket.to(req.params.kwizzId).emit('message', 'CHANGE_TEAM');
            res.status(statusCodes.OK).json(kwizz);
        });
    } else {
        return res.status(statusCodes.BAD_REQUEST).json('Missing data');
    }
});

router.put('/:kwizzId/:teamId', (req, res, next) => {
    if (!req.body.teamName) return next();
    if (req.body.teamName !== null) {
        Kwizz.updateOne({ 'teams._id': req.params.teamId }, {
            '$set': {
                'teams.$.name': req.body.teamName,
                'teams.$.status': '#F1F58E'
            }
        }, (err, kwizz) => {
            if (err) return res.status(statusCodes.SERVER_ERROR).json();
            const socket = io.getSocketServer();
            socket.to(req.params.kwizzId).emit('message', 'CHANGE_TEAM');
            res.status(statusCodes.OK).json(kwizz);
        });
    } else {
        return res.status(statusCodes.BAD_REQUEST).json('Missing data');
    }
});

module.exports = router;
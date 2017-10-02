/*
 * Copyright (C) 2017 Mia Nordentoft, Metilo contributors
 *
 * This file is part of Metilo.
 *
 * Metilo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Metilo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Metilo. If not, see <http://www.gnu.org/licenses/>.
 */

import express from 'express';
import passportLocal from 'passport-local';
import bcrypt from 'bcrypt';
import { promisify } from 'util';
import passport from 'passport';

import { renderPage } from '../render';
import metilo from '..';
import User from '../db/user';

export default function () {
    const router = express.Router();

    // Login page or site overview
    const getMain = (req, res, next) => {
        console.log(req.user);

        const error = req.flash('error')[0] || false;
        renderPage('admin/login', req, 'admin', { main: { error: error } })
            .then(data => res.send(data))
            .catch(err => next(err));
    };
    router.get('/', getMain);

    // Login action
    router.post('/', passport.authenticate('local', { failureFlash: '{{error.invalid}}' }), (req, res, next) => {
        res.redirect(metilo.conf.routers.admin);
    });

    return router;
};

const superUser = () => new User({
    data: {
        id: 0,
        nickname: 'Super Admin',
        username: metilo.conf.superadmin.username,
        password: metilo.conf.superadmin.password,
        level: 0
    }
});

passport.use(new passportLocal.Strategy(async (username, password, cb) => {
    if (username === metilo.conf.superadmin.username && password === metilo.conf.superadmin.password) {
        const user = superUser();
        cb(null, user);
    } else {
        // TODO: Login for regular users
        cb(null, false);
    }
}));

passport.serializeUser((user, cb) => {
    cb(null, user.data.id);
});

passport.deserializeUser((id, cb) => {
    if (id === 0) {
        cb(null, superUser());
    } else {
        cb(null, metilo.db.getUser('id = ?', id));
    }
});

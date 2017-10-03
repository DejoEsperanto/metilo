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
import { promisify } from 'util';
import passport from 'passport';
import Mustache from 'mustache';
import deepAssign from 'deep-assign';

import { renderPage as _renderPage } from '../render';
import metilo from '..';
import User from '../db/user';

export default function () {
    const admin = metilo.conf.routers.admin;

    const router = express.Router();

    const renderPage = async (name, req, subsite, format = {}, useSubglobal = 'subglobal') => {
        if (req.user) {
            const urls = metilo.getURLs('admin');

            format = deepAssign(format, {
                global: {
                    name: req.user.name(),
                    profileLink$: `<a href="${admin}/${urls.profile}">`,
                    $profileLink: '</a>',
                    logoutLink$: `<a href="${admin}?${urls.logout}">`,
                    $logoutLink: '</a>'
                },
                subglobal: {
                    isAdmin: req.user.isAdmin()
                }
            });
        }

        return await _renderPage(name, req, subsite, format, useSubglobal);
    };

    // Login page or site overview
    const getMain = (req, res, next) => {
        const locale = metilo.getLocale(req.locale.admin);
        const localeTheme = metilo.getLocaleTheme(req.locale.admin);
        const urls = metilo.getURLs('admin');

        if (req.user) {
            // Dashboard
            renderPage('admin/dashboard', req, 'admin')
                .then(data => res.send(data))
                .catch(err => next(err));
        } else {
            // Sign in
            const error = req.flash('error')[0] || '';
            const errorMessage = Mustache.render(error, locale) || false;
            renderPage('admin/login', req, 'admin', {
                main: { error: errorMessage },
                global: { hideHeader: true }
            }, false)
                .then(data => res.send(data))
                .catch(err => next(err));
        }
    };
    router.get('/', getMain);

    // Login action
    router.post('/', metilo.limiter, passport.authenticate('local', {
        failureFlash: '{{error.unauthorized}}',
        failureRedirect: admin
    }), (req, res, next) => {
        res.redirect(admin);
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

passport.use(new passportLocal.Strategy((username, password, cb) => {
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

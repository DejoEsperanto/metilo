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
import mergeOptions from 'merge-options';
import { ensureLoggedIn } from 'connect-ensure-login';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

import { renderPage as _renderPage } from '../render';
import metilo from '..';
import User from '../db/user';
import { adminXHR } from '.';

export default function () {
    const admin = metilo.conf.routers.admin;

    const urls = metilo.getURLs('admin');

    const router = express.Router();

    const renderPage = async (name, req, subsite, format = {}, useSubglobal = 'subglobal') => {
        if (req.user) {
            const urls = metilo.getURLs('admin');

            format = mergeOptions(format, {
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

    // XHR
    router.use('/xhr', adminXHR());

    // Login page or site overview
    const getMain = (req, res, next) => {
        if (urls.logout in req.query) {
            req.logout();
            res.redirect(admin);
            return;
        }

        const locale = metilo.getLocale(req.locale.admin);

        if (req.user) {
            // Dashboard
            const adminInfo = {};
            const adminID = metilo.conf.superadmin.inheritID;
            let admin;
            if (adminID) {
                admin = metilo.db.getUser('id = ?', adminID);
                if (admin) {
                    if (admin.data.role) { adminInfo.role = admin.data.role.replace('\n', '<br>'); }
                    adminInfo.name = admin.fullName();
                    if (admin.data.email) { adminInfo.email = admin.data.email; }
                    adminInfo.phoneNumber = admin.phoneNumber();
                    adminInfo.phoneNumberFull = admin.data.phoneNumber;
                }
            }

            const format = {
                main: {}
            };

            if (adminID && admin) {
                format.main.adminContactInfo = adminInfo;
            }

            renderPage('admin/dashboard', req, 'admin', format)
                .then(data => res.send(data))
                .catch(err => next(err));
        } else {
            // Sign in
            const error = req.flash('error')[0] || '';
            const errorMessage = Mustache.render(error, locale) || false;
            renderPage('admin/login', req, 'admin', {
                main: { error: errorMessage },
                global: {
                    hideHeader: true,
                    vcenter: true
                }
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

    // New user page
    router.get(`/${urls.newUser}`, ensureLoggedIn(admin), (req, res, next) => {
        if (!req.user.isAdmin()) { res.redirect(admin); return; }

        const locale = metilo.getLocale(req.locale.admin);

        const info = req.flash('info')[0] || '';
        const infoMessage = Mustache.render(info, locale) || false;
        renderPage('admin/new-user', req, 'admin', { main: { info: infoMessage } })
            .then(data => res.send(data))
            .catch(err => next(err));
    });

    // New user action
    router.post(`/${urls.newUser}`, ensureLoggedIn(admin), async (req, res, next) => {
        if (!req.user.isAdmin()) { res.redirect(admin); return; }

        if (!req.body.username) {
            // No error needed as there's client side validation
            res.redirect(`${admin}/${urls.newUser}`);
            return;
        }

        // Determine password
        let password = await promisify(crypto.randomBytes)(8);
        password = password.toString('hex');

        await User.createUser({
            name: req.body.name,
            surname: req.body.surname,
            nickname: req.body.nickname,
            username: req.body.username,
            email: req.body.email,
            phoneNumber: req.body.phone && req.body.phone !== '' ? `+${req.body['phone-code'] + req.body.phone}` : null,
            password: password,
            role: req.body.role,
            level: req.body.admin === 'on' ? 0 : 1
        });

        req.flash('info', `{{info.userCreated}} ${password}`);
        res.redirect(`${admin}/${urls.newUser}`);
    });

    // Users page
    router.get(`/${urls.users}`, ensureLoggedIn(admin), (req, res, next) => {
        if (!req.user.isAdmin()) { res.redirect(admin); return; }

        const users = metilo.db.getUsers().map(user => {
            const data = mergeOptions(user.data);
            data.fullName = user.fullName();
            data.isAdmin = user.isAdmin();
            if (data.role) {
                data.role = metilo.entities.encode(data.role).replace('\n', '<br>');
            }
            data.phoneNumberFormatted = user.phoneNumber();
            data.phoneCode = user.phoneCode();
            data.phoneNumberLocal = user.phoneNumberLocal();
            return data;
        });

        renderPage('admin/users', req, 'admin', {
            global: {
                includeScripts: '/assets/js/admin/users.js'
            },
            main: { data: users }
        })
            .then(data => res.send(data))
            .catch(err => next(err));
    });

    // New page page
    router.get(`/${urls.contentNewPage}`, ensureLoggedIn(admin), (req, res, next) => {
        renderPage('admin/new-page', req, 'admin', {
            global: {
                includeStyles: '/assets/css/admin/new-page.css',
                includeScripts: '/assets/js/admin/new-page.js'
            }
        })
            .then(data => res.send(data))
            .catch(err => next(err));
    });

    // Pages page
    router.get(`/${urls.contentPages}`, ensureLoggedIn(admin), (req, res, next) => {
        renderPage('admin/pages', req, 'admin')
            .then(data => res.send(data))
            .catch(err => next(err));
    });

    return router;
};

const superUser = () => new User({
    data: {
        id: 0,
        nickname: 'Super Admin',
        username: metilo.conf.superadmin.username,
        level: 0
    }
});

passport.use(new passportLocal.Strategy(async (username, password, cb) => {
    if (username === metilo.conf.superadmin.username) {
        if (password === metilo.conf.superadmin.password) {
            const user = superUser();
            cb(null, user);
        } else {
            cb(null, false);
        }
    } else {
        // Obtain user
        const user = metilo.db.getUser('username = ?', username);

        if (user) {
            const isValid = await bcrypt.compare(password, user.data.password);

            if (isValid) {
                cb(null, user);
            } else {
                cb(null, false);
            }
        } else {
            cb(null, false);
        }
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

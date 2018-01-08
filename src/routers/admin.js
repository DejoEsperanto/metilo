/*
 * Copyright (C) 2017-2018 Mia Nordentoft, Metilo contributors
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
import moment from 'moment-timezone';

import { renderPage as _renderPage, getMainPageFormat } from '../render';
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
                includeScripts: '/assets/js/admin/users.js?v=' + metilo.version
            },
            main: { data: users }
        })
            .then(data => res.send(data))
            .catch(err => next(err));
    });

    // New page page
    router.get(`/${urls.contentNewPage}`, ensureLoggedIn(admin), (req, res, next) => {
        renderPage('admin/new-page', req, 'admin', {
            main: {
                edit: false,
                jsonData: JSON.stringify({
                    previewURL: urls.contentPreviewPage
                })
            },
            global: {
                includeStyles: '/assets/css/admin/new-page.css?v=' + metilo.version,
                includeScripts: '/assets/js/admin/new-page.js?v=' + metilo.version
            }
        })
            .then(data => res.send(data))
            .catch(err => next(err));
    });

    // New revision page
    router.get(`/${urls.contentEditPage}/:revision`, ensureLoggedIn(admin), (req, res, next) => {
        const locale = metilo.getLocaleTheme(req.locale.admin);

        const revisionData = metilo.db.db.prepare('select * from `pages_revisions` where id = ?')
            .get(req.params.revision);

        if (!revisionData) { res.redirect(admin); return; }

        const pageData = metilo.db.db.prepare('select * from `pages` where id = ?')
            .get(revisionData.pageId);

        const revisionContent = metilo.db.db.prepare('select * from `pages_revisions_content` where `revisionId` = ?')
            .all(revisionData.id);

        for (let cell of revisionContent) {
            // Might need a switch here eventually, currently all types use text values
            switch (cell.type) {
                case 'text':
                case 'html':
                    cell.value = cell.value.toString();
            }
        }

        const jsonData = {
            name: pageData.name,
            title: revisionData.title,
            edit: true,
            content: revisionContent,
            pageId: pageData.id,
            previewURL: urls.contentPreviewPage
        };

        const format = {
            main: Object.assign(
                locale.pages['admin/edit-page'],
                {
                    pageName: pageData.name,
                    pageTitle: revisionData.title,
                    edit: true,
                    jsonData: JSON.stringify(jsonData)
                }
            ),
            global: {
                title: locale.pages['admin/edit-page'].title,
                includeStyles: '/assets/css/admin/new-page.css?v=' + metilo.version,
                includeScripts: '/assets/js/admin/new-page.js?v=' + metilo.version
            }
        };

        renderPage('admin/new-page', req, 'admin', format)
            .then(data => res.send(data))
            .catch(err => next(err));
    });

    // Preview page
    router.get(`/${urls.contentPreviewPage}/:revision`, ensureLoggedIn(admin), (req, res, next) => {
        const locale = metilo.getLocaleTheme(req.locale.admin);

        // Obtain all page data
        const pageRevisionData = metilo.db.db.prepare('select title from pages_revisions where id = ?')
            .get(req.params.revision);

        const pageRevisionContent = metilo.db.db.prepare('select * from pages_revisions_content where revisionId = ?')
            .all(req.params.revision);

        const format = mergeOptions(
            getMainPageFormat(pageRevisionData.title, pageRevisionContent),
            {
                global: locale.pages['admin/preview-page']
            },
            {
                global: {
                    showPreviewText: true
                }
            }
        );

        // Intentional underscore
        _renderPage('main/page', req, 'main', format)
            .then(data => res.send(data))
            .catch(err => next(err));
    });

    router.post(`/${urls.contentPreviewPage}`, ensureLoggedIn(admin), (req, res, next) => {
        const locale = metilo.getLocaleTheme(req.locale.admin);

        const format = mergeOptions(
            getMainPageFormat(req.body.title, req.body.content || []),
            {
                global: locale.pages['admin/preview-page']
            },
            {
                global: {
                    showPreviewText: true
                }
            }
        );

        // Intentional underscore
        _renderPage('main/page', req, 'main', format)
            .then(data => res.send(data))
            .catch(err => next(err));
    });

    // Pages page
    router.get(`/${urls.contentPages}`, ensureLoggedIn(admin), (req, res, next) => {
        const localeMain = metilo.getLocale(req.locale.admin);
        const locale = metilo.getLocaleTheme(req.locale.admin);
        moment.locale(req.locale.admin);

        const data = [];
        const jsonData = {
            editURL: urls.contentEditPage,
            previewURL: urls.contentPreviewPage,
            pages: {}
        };
        const pages = metilo.db.db.prepare('select * from `pages` order by `name`').all();

        for (let page of pages) {
            const createTimeFormatted = moment(page.time * 1000).format(locale.dateTimeFormat);
            const creator = metilo.db.getUser('id = ?', page.author);
            let created = Mustache.render('{{&pages.admin/pages.createdFormat}}', locale);
            created = Mustache.render(created, {
                name: creator.fullName(),
                time: createTimeFormatted
            });

            const revision = metilo.db.db.prepare('select * from `pages_revisions` where id = ?')
                .get(page.activeRevision);

            const revisionTimeFormatted = moment(revision.time * 1000).format(locale.dateTimeFormat);
            const reviewer = metilo.db.getUser('id = ?', revision.author);
            let revised = Mustache.render('{{&pages.admin/pages.revisionFormat}}', locale);
            revised = Mustache.render(revised, {
                revision: revision.id,
                name: reviewer.fullName(),
                time: revisionTimeFormatted
            });

            const revisionsData = metilo.db.db.prepare('select * from `pages_revisions` where pageId = ?')
                .all(page.id);

            const revisions = [];
            for (let revisionData of revisionsData) {
                const revisionTimeFormatted = moment(revisionData.time * 1000).format(locale.dateTimeFormat);
                let text = Mustache.render('{{&pages.admin/pages.chooseRevisionFormat}}', locale);
                text = Mustache.render(text, {
                    revision: revisionData.id,
                    time: revisionTimeFormatted
                });

                revisions.push({
                    id: revisionData.id,
                    text: text
                });
            }

            const urls = metilo.db.db.prepare('select url from pages_urls where pageId = ? order by redirect ASC')
                .all(page.id);

            const urlsStr = urls.map(x => x.url).join('\n');

            jsonData.pages[page.id] = {
                revisions: revisions,
                activeRevision: page.activeRevision,
                urls: urlsStr
            };

            let row = {
                id:        page.id,
                name:      page.name,
                created:   created,
                revision:  revised,
                title:     revision.title,
                changes:   revision.changes
            };
            data.push(row);
        }

        const info = req.flash('info')[0] || '';
        const infoMessage = Mustache.render(info, localeMain) || false;
        renderPage('admin/pages', req, 'admin', {
            global: {
                includeScripts: '/assets/js/admin/pages.js?v=' + metilo.version
            },
            main: {
                info: infoMessage,
                data: data,
                jsonData: JSON.stringify(jsonData)
            }
        })
            .then(data => res.send(data))
            .catch(err => next(err));
    });

    // Menu page
    router.get(`/${urls.contentMenu}`, ensureLoggedIn(admin), (req, res, next) => {
        let hasData = false;

        const pages = metilo.db.db.prepare('select id, name from pages').all();
        const menu = metilo.db.db.prepare('select * from menu').all();

        if (menu.length) { hasData = true; }

        const jsonData = {
            pages: pages,
            menu: menu
        };

        renderPage('admin/menu', req, 'admin', {
            global: {
                includeStyles: '/assets/css/admin/menu.css?v=' + metilo.version,
                includeScripts: '/assets/js/admin/menu.js?v=' + metilo.version
            },
            main: {
                hasData: hasData,
                jsonData: JSON.stringify(jsonData),
                pages: pages
            }
        })
            .then(data => res.send(data))
            .catch(err => next(err));
    });

    // Profile page
    router.get(`/${urls.profile}`, ensureLoggedIn(admin), (req, res, next) => {
        renderPage('admin/profile', req, 'admin', {
            main: {
                name: req.user.fullName(),
                role: req.user.data.role,
                email: req.user.data.email,
                phoneNumber: req.user.phoneNumber(),
                phoneNumberFull: req.user.data.phoneNumber
            }
        })
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

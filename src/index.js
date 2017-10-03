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

process.on('unhandledRejection', (reason, promise) => console.error(reason));

import express from 'express';
import deepAssign from 'deep-assign';
import mustacheExpress from 'mustache-express';
import minimist from 'minimist';
import cookieParser from 'cookie-parser';
import RateLimit from 'express-rate-limit';
import path from 'path';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import flash from 'connect-flash';
import expressSession from 'express-session';
import fs from 'fs-extra-promise';
import passport from 'passport';

import defConf from './conf';
import * as routers from './routers';
import Database from './db/database.js';

export default {
    didInit: false,
    conf: defConf,
    app: null,
    argv: minimist(process.argv.slice(2), {
        default: {
            cache: true,
            helmet: true,
            'secure-cookie': true,
            limiter: true
        },
        alias: {
            d: 'dev'
        }
    }),
    locales: null,
    localeInfo: null,
    limiter: null,
    db: null,

    init (_conf) {
        this.didInit = true;
        this.conf = deepAssign(defConf, _conf)
        this.app = express();
        this.app.engine('mustache', mustacheExpress());
        this.app.set('views', path.join(__dirname, '../web/html/', this.conf.content.theme))
        this.app.set('view engine', 'mustache');

        const dbPath = path.join(this.conf.baseDir, this.conf.dbFile);
        fs.ensureDirSync(this.conf.baseDir);
        if (!fs.existsSync(dbPath)) {
            fs.copyFileSync(path.join(__dirname, '../db_template.db'), dbPath);
            console.log('Database not found, created new from template');
        }
        this.db = new Database(dbPath);

        if (this.conf.trustProxy) {
            app.enable('trust proxy');
        }

        if (this.argv.dev) {
            console.warn('Running in development mode');
        }

        if (this.argv.helmet && !this.argv.dev) {
            this.app.use(helmet());
        } else {
            console.warn('Running without helmet. This should only be used for development and never on production.');
        }

        if (!this.argv.cache || this.argv.dev) {
            this.app.disable('view cache');
            console.warn('Running in no cache mode. This should only be used for development and never on production.');
        }

        let limiterMax;
        if (!this.argv.limiter || this.argv.dev) {
            limiterMax = 0;
            console.warn('Running without login rate limiting. This should only be used for development and never on production.');
        } else {
            limiterMax = this.conf.loginLimit.max;
        }
        this.limiter = new RateLimit({
            windowMs: this.conf.loginLimit.time * 1000,
            max: limiterMax,
            delayMs: this.conf.loginLimit.delay,
            handler: (req, res, next) => {
                res.setHeader('Retry-After', Math.ceil(this.conf.loginLimit.time));
                next(new Error('tooManyRequests'));
            }
        })

        this.app.use(cookieParser());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(expressSession({
            cookie: { maxAge: 60000 },
            resave: false,
            saveUninitialized: false,
            secret: this.conf.sessionSecret,
            name: 'metiloSession'
        }));

        this.app.use(passport.initialize());
        this.app.use(passport.session());

        this.app.use(flash());

        this.localeInfo = require('../locale');
        const localeNames = Object.keys(this.localeInfo);

        this.locales = {};
        for (let subsite in this.conf.content.locales) {
            if (this.conf.content.locales[subsite].length) {
                this.locales[subsite] = this.conf.content.locales[subsite];
            } else {
                this.locales[subsite] = localeNames;
            }
        }
    },

    /**
     * Starts Metilo
     */
    run () {
        // Middleware
        const getLocale = (req, res, next) => {
            req.locale = {};

            // TODO: Use the HTTP Accept-Language header

            for (let subsite in this.conf.content.locales) {
                const value = req.cookies[subsite + 'Locale'];
                if (this.conf.content.locales[subsite].indexOf(value) > -1) {
                    req.locale[subsite] = value;
                } else {
                    req.locale[subsite] = this.conf.content.locales[subsite][0];
                }
            }

            next();
        };
        this.app.use(getLocale);

        // Routing
        for (let name in this.conf.routers) {
            this.app.use(this.conf.routers[name], routers[name]());
        }

        this.app.use('/assets', routers['assets']());

        this.app.listen(this.conf.port, () => {
            console.log('Metilo running on port %s', this.conf.port);
        });
    }
};

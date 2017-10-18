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
import { ensureLoggedIn } from 'connect-ensure-login';
import { promisify } from 'util';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import metilo from '..';

export default function () {
    const router = express.Router();

    const admin = metilo.conf.routers.admin;

    router.post('/user-delete', ensureLoggedIn(admin), (req, res, next) => {
        if (!req.user.isAdmin()) { res.redirect(admin); return; }

        metilo.db.deleteUser(`username = ?`, [req.body.username]);

        res.send('{}');
    });

    router.post('/user-reset-pass', ensureLoggedIn(admin), async (req, res, next) => {
        if (!req.user.isAdmin()) { res.redirect(admin); return; }

        let password = await promisify(crypto.randomBytes)(8);
        password = password.toString('hex');

        const hash = await bcrypt.hash(password, metilo.conf.bcryptSaltRounds);

        metilo.db.updateUser('password = ?', 'username = ?', [hash, req.body.username]);

        res.send(JSON.stringify({
            password: password
        }));
    });

    router.post('/user-update', ensureLoggedIn(admin), (req, res, next) => {
        if (req.body.user && !req.user.isAdmin()) {
            res.send('{ error: "Regular users can only change their own settings." }');
            return;
        }

        const allowedFields = [
            'name',
            'surname',
            'nickname',
            'username',
            'email',
            'phoneNumber'
        ];

        if (req.user.isAdmin()) {
            allowedFields.push('level', 'role');
        }

        let user = req.user;
        if (req.body.user) {
            user = metilo.db.getUser('username = ?', req.body.user);
            if (!user) {
                res.send('{ error: "User not found." }');
                return;
            }
        }

        if (!req.body.fields) {
            res.send('{ error: "Missing fields field." }');
            return;
        }

        if (Object.getPrototypeOf(req.body.fields) !== Object.prototype) {
            res.send('{ error: "fields must be an object." }');
            return;
        }

        let set = '';
        const parameters = [];

        for (const field in req.body.fields) {
            if (!field in allowedFields) {
                res.send(`{ error: "Disallowed field \"${field}\"." }`);
                return;
            }

            if (set !== '') { set += ', '; }
            set += `${field} = ?`;
            parameters.push(req.body.fields[field]);
        }

        parameters.push(user.data.username);

        metilo.db.updateUser(set, 'username = ?', parameters);

        res.send('{}');
    });

    router.post('/page-add', ensureLoggedIn(admin), (req, res, next) => {
        
    });

    return router;
};

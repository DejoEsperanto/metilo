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
import {renderPage} from '../render';

export default function () {
    const router = express.Router();

    // Login page or site overview
    const getMain = (req, res, next) => {
        renderPage('admin/login', req, 'admin', { main: { error: req.flash('error')[0] || false } })
            .then(data => res.send(data))
            .catch(err => next(err));
    };
    router.get('/', getMain);

    // Login action
    router.post('/', (req, res, next) => {
        if (!req.body.username || !req.body.password) {
            req.flash('error', 'Login request missing field');
            getMain(req, res, next);
            return;
        }

        res.send('Gonna have to think about that one');
    });

    return router;
};

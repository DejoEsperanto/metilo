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
import path from 'path';
import metilo from '..';

export default function () {
    const router = express.Router();

    // Static folders
    const base = path.join(__dirname, '../../dist/web/');
    for (let folder of ['css', 'js']) {
        router.use('/' + folder, express.static(path.join(base, folder, metilo.conf.content.theme)));
    }

    // Static files
    router.get('/module/js.cookie.js', (req, res) => {
        res.sendFile(path.join(__dirname, '../../node_modules/js-cookie/src/js.cookie.js'));
    });

    router.get('/module/picomodal.js', (req, res) => {
        res.sendFile(path.join(__dirname, '../../node_modules/picomodal/src/picoModal.js'));
    });

    return router;
};

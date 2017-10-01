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
import deepAssign from 'deep-assign';

import defConf from './conf';
import * as routers from './routers';

export default function run (customConf = {}) {
    const conf = deepAssign(defConf, customConf);
    const app = express();

    for (let name in conf.routers) {
        app.use(conf.routers[name], routers[name]);
    }

    app.listen(conf.port, () => {
        console.log('Metilo running on port %s', conf.port);
    });
}

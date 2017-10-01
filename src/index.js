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

import defConf from './conf';
import * as routers from './routers';

export default {
    didInit: false,
    conf: defConf,
    app: null,

    init (_conf) {
        this.didInit = true;
        this.conf = deepAssign(defConf, _conf)
        this.app = express();
        this.app.engine('mustache', mustacheExpress());
        this.app.set('views', __dirname + '/../web/html/' + this.conf.content.theme)
        this.app.set('view engine', 'mustache');
    },

    /**
     * Starts Metilo
     */
    run () {
        for (let name in this.conf.routers) {
            this.app.use(this.conf.routers[name], routers[name]);
        }

        this.app.listen(this.conf.port, () => {
            console.log('Metilo running on port %s', this.conf.port);
        });
    }
};

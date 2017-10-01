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

import deepAssign from 'deep-assign';
import {promisify} from 'util';
import {app, conf} from '.';

/**
 * Renders a page with the provided path
 * @param  {string} name     Path of page to render
 * @param  {string} locale   Locale name
 * @param  {Object} [format] Values for page
 * @return {string} Rendered page
 */
export async function renderPage (name, locale, format) {
    const localeData = require('../locale/' + locale);

    const globalFormat = deepAssign(
        localeData.templates[conf.content.theme].pages.global,
        localeData.templates[conf.content.theme].pages[name],
        format
    );

    // Get page
    globalFormat.main = await promisify(app.render)(name, globalFormat);

    // Get global
    return await promisify(app.render)('global', globalFormat);
};

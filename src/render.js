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

import mergeOptions from 'merge-options';
import { promisify } from 'util';
import Mustache from 'mustache';
import path from 'path';
import metilo from '.';

/**
 * Renders a page with the provided path
 * @param  {string}  name     Path of page to render
 * @param  {Request} req      Express request
 * @param  {string}  subsite  Subsite name
 * @param  {Object}  [format] Values for page
 * @return {string}  Rendered page
 */
export async function renderPage (name, req, subsite, format = {}, useSubglobal = false) {
    const render = (...args) => {
        if (!metilo.hasCache) {
            metilo.mustacheExpress.cache.reset();
        }

        return promisify(metilo.app.render.bind(metilo.app))(...args);
    };

    const locale = req.locale[subsite];
    const localeData = metilo.getLocale(locale);
    const localeThemeData = metilo.getLocaleTheme(locale);
    const urls = metilo.getAllURLs(subsite);

    // Get page
    let mainFormat = mergeOptions(
        localeThemeData.pages.global,
        localeThemeData.pages[name] || {},
        {
            urls: urls,
            subsiteURL: metilo.conf.routers[subsite],
            defaultPhoneCode: metilo.conf.defaultPhoneCode[1]
        },
        format.main || {}
    );
    mainFormat = formatRecursive(mainFormat, mainFormat);
    const main = await render(name, mainFormat);

    // Get subglobal (if applicable)
    let subglobal = main;
    if (useSubglobal) {
        let subglobalFormat = mergeOptions(
            localeThemeData.pages.global,
            localeThemeData.pages[subsite],
            {
                main: main,
                urls: urls,
                subsiteURL: metilo.conf.routers[subsite]
            },
            format.subglobal || {}
        );
        subglobalFormat = formatRecursive(subglobalFormat, subglobalFormat);

        subglobal = await render(`${subsite}/${useSubglobal}`, subglobalFormat);
    }

    // Get global
    let globalFormat = mergeOptions(
        localeThemeData.pages.global,
        metilo.conf.content.localeStrings[locale],
        localeThemeData.pages[subsite],
        {
            main: subglobal,
            title: mainFormat.title || '',
            includeScripts: [],
            subsite: subsite,
            urls: urls,
            subsiteURL: metilo.conf.routers[subsite],
            locale: req.locale[subsite],
            locales: metilo.locales[subsite].map(x => {
                return {
                    code: x,
                    name: metilo.localeInfo[x].name,
                    active: x === locale
                };
            }),
            metiloVersion: metilo.version,
            meta: {
                twitterUsername: metilo.conf.twitterUsername,
                keywords: metilo.conf.keywords
            }
        },
        format.global || {}
    );
    globalFormat = formatRecursive(globalFormat, globalFormat);

    // Get global
    return await render(`${subsite}/global`, globalFormat);
};

export function formatRecursive (format, view) {
    const out = {};
    for (let key in format) {
        if (format[key] && Object.getPrototypeOf(format[key]) === Object.prototype) {
            out[key] = formatRecursive(format[key], view);
        } else if (typeof format[key] === 'string') {
            if (!metilo.hasCache) { Mustache.clearCache(); }
            out[key] = Mustache.render(format[key], view);
        } else {
            out[key] = format[key];
        }
    }

    return out;
}

export function getMainPageFormat (title, pageRevisionContent, url = null) {
    const rows = [];
    for (let cell of pageRevisionContent) {
        if (!rows[cell.y]) {
            rows[cell.y] = {
                columns: [],
                totalWidth: 0
            };
        }
        rows[cell.y].columns[cell.x] = {
            width: +cell.width,
            type: cell.type,
            value: cell.value.toString() // Right now all types use text values, this may have to be changed later
        };
        rows[cell.y].totalWidth += +cell.width;
    }

    // Obtain menu
    let menuData = metilo.db.db.prepare('select id, name, url, parent, `index` from menu left join pages_urls on menu.page = pages_urls.pageId and pages_urls.redirect = 0')
        .all();

    const menu = [];
    const parents = {};
    let i = -1;
    let hasSubmenu = false;
    let submenu = [];
    while (menuData.length) {
        if (++i >= menuData.length) { i = 0; }
        const item = menuData[i];

        let parent;
        if (item.parent === null) {
            parent = menu;
        } else if (parents[item.parent]) {
            parent = parents[item.parent];
        } else {
            continue;
        }

        parent[item.index] = {
            id: item.id,
            name: item.name,
            url: path.join(metilo.conf.routers.main, item.url || ''),
            children: []
        };
        parents[item.id] = parent[item.index].children;

        if (item.url === url) {
            submenu = parents[item.id];
        }

        menuData.splice(i, 1);
    }

    if (submenu.length) {
        hasSubmenu = true;
    }

    const hideLanguage = metilo.locales.main.length < 2;

    return {
        global: {
            title: title,
            hideLanguage: hideLanguage,
            menu: menu,
            hasSubmenu: hasSubmenu,
            submenu: submenu,
            analyticsID: metilo.conf.analyticsID
        },
        main: {
            rows: rows
        }
    };
}

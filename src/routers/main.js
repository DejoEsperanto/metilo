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
import { renderPage } from '../render';

export default function () {
    const router = express.Router();
    const baseURL = metilo.conf.routers.main;

    // Frontpage
    router.get(/(\/.*)/, (req, res, next) => {
        const url = metilo.db.db.prepare('select * from pages_urls where url = ?')
            .get(path.join(baseURL, req.params[0]));

        if (!url) {
            next();
            return;
        }

        // Handle URL redirection
        if (url.redirect) {
            const mainURL = url.mainURL = metilo.db.db.prepare('select url from pages_urls where pageId = ? and redirect = 0 order by redirect asc')
                .get(url.pageId)
                .url;
            res.redirect(301, path.join(baseURL, mainURL));
            return;
        }

        // Obtain all page data
        const pageData = metilo.db.db.prepare('select activeRevision from pages where id = ?')
            .get(url.pageId);

        const pageRevisionData = metilo.db.db.prepare('select title from pages_revisions where id = ?')
            .get(pageData.activeRevision);

        const pageRevisionContent = metilo.db.db.prepare('select * from pages_revisions_content where revisionId = ?')
            .all(pageData.activeRevision);

        const rows = [];
        for (let cell of pageRevisionContent) {
            if (!rows[cell.y]) {
                rows[cell.y] = {
                    columns: [],
                    totalWidth: 0
                };
            }
            rows[cell.y].columns[cell.x] = {
                width: cell.width,
                type: cell.type,
                value: cell.value.toString() // Right now all types use text values, this may have to be changed later
            };
            rows[cell.y].totalWidth += cell.width;
        }

        // Obtain menu
        let menuData = metilo.db.db.prepare('select id, name, url, parent, `index` from menu left join pages_urls on menu.page = pages_urls.pageId and pages_urls.redirect = 0')
            .all();
        const menu = [];
        const parents = {};
        let i = -1;
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
                url: path.join(baseURL, item.url),
                children: []
            };
            parents[item.id] = parent[item.index].children;

            menuData.splice(i, 1);
        }

        // Render page
        const hideLanguage = metilo.locales.main.length < 2;

        renderPage('main/page', req, 'main', {
            global: {
                title: pageRevisionData.title,
                hideLanguage: hideLanguage,
                menu: menu
            },
            main: {
                rows: rows
            }
        })
            .then(data => res.send(data))
            .catch(err => next(err));
    });

     return router;
};

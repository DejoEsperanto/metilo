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
    const baseURL = metilo.conf.routers.main;

    // Frontpage
    router.get(/(\/.*)/, (req, res, next) => {
        const pages = metilo.db.db.prepare('select id, urls from pages').all();
        let thisPage = null;
        pageIterator:
        for (let page of pages) {
            let pageURLs = page.urls.split('\n');
            for (let i in pageURLs) {
                const pageURL = pageURLs[i];
                const data = {
                    url: pageURL.trim(),
                    mainURL: pageURLs[0].trim(),
                    redirect: i > 0,
                    pageId: page.id
                };

                if (req.params[0] === data.url) {
                    thisPage = data;
                    break pageIterator;
                }
            }
        }

        if (!thisPage) {
            next();
            return;
        }

        if (thisPage.redirect) {
            res.redirect(path.join(baseURL, thisPage.mainURL));
            return;
        }

        const pageData = metilo.db.db.prepare('select activeRevision from pages where id = ?')
            .get(thisPage.pageId);

        const pageRevisionData = metilo.db.db.prepare('select title from pages_revisions where id = ?')
            .get(pageData.activeRevision);

        const pageRevisionContent = metilo.db.db.prepare('select * from pages_revisions_content where revisionId = ?')
            .all(pageData.activeRevision);

        res.send(pageRevisionData.title);
    });

     return router;
};

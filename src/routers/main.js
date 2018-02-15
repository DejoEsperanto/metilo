/*
 * Copyright (C) Mia Nordentoft, Metilo contributors
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
import fs from 'fs-extra-promise';
import path from 'path';

import metilo from '..';
import { renderPage, getMainPageFormat } from '../render';

export default function () {
    const router = express.Router();
    const baseURL = metilo.conf.routers.main;
    const urls = metilo.getURLs('main');

    // Files
    router.use(`/${urls.files}`, express.static(path.join(metilo.conf.baseDir, 'files')));

    // .well-known
    const wellKnownPath = path.join(metilo.conf.baseDir, '.well-known');
    fs.ensureDirSync(wellKnownPath);
    router.use(`/.well-known`, express.static(wellKnownPath));

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

        const format = getMainPageFormat(pageRevisionData.title, pageRevisionContent, url.url);

        renderPage('main/page', req, 'main', format)
            .then(data => res.send(data))
            .catch(err => next(err));
    });

     return router;
};

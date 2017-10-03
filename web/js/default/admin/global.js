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

// Util
const $ = function (el, parent = document) {
    return parent.querySelector(el);
};

const $$ = function (el, parent = document) {
    return parent.querySelectorAll(el);
};

const on = function (el, event, cb) {
    el.addEventListener(event, cb);
}

// Elements
const els = {
    selectLanguage: $('#select-language')
};

// Constants
const C = {
    subsite: document.body.dataset.subsite
};

// Header
on(els.selectLanguage, 'change', e => {
    Cookies.set(C.subsite + 'Locale', els.selectLanguage.value, { expires: 365 });
    location.reload();
});

// Button links
for (let button of $$('button[data-href]')) {
    on(button, 'click', e => {
        const href = e.currentTarget.dataset.href;
        document.location.href = href;
    })
}

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

const jsonXHR = (url, params) =>  {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.open('POST', url, true);
        req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        req.onload = () => {
            if (req.status >= 200 && req.status < 400) {
                resolve(JSON.parse(req.response));
            } else {
                reject(req.status);
            }
        };
        req.onerror = e => {
            reject(e);
        };
        let paramsStr = '';
        for (let key in params) {
            if (paramsStr !== '') { paramsStr += '&'; }
            paramsStr += `${key}=${encodeURIComponent(params[key])}`;
        }
        req.send(paramsStr);
    });
};

const confirmDialog = text => {
    return new Promise((resolve, reject) => {
        picoModal({
            content: text
        }).afterCreate(modal => {
            modal.modalElem().addEventListener('click', e => {
                if (e.target && e.target.matches('.ok')) {
                    modal.close(true);
                } else if (e.target && e.target.matches('.cancel')) {
                    modal.close(false);
                }
            });
        }).afterClose((modal, e) => {
            resolve(e.detail);
        }).show();
    });
};

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

// Form help
for (let form of $$('.form-with-help')) {
    const formName = form.dataset.name;
    const textEl = $(`.form-help-text[data-name=${formName}]`);

    for (let input of $$('[data-name]', form)) {
        const text = $(`[data-name=${input.dataset.name}]`, textEl);
        on(input, 'focus', e => {
            text.style.display = 'block';
        });
        on(input, 'blur', e => {
            text.style.display = 'none';
        });
    }
}

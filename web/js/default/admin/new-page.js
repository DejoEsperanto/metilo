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

const els = {
    row:      $('#row-template>:first-child'),
    contents: $('#new-page-contents')
};

const handleSelectChange = el => {
    const column = el.parentElement;
    const value = el.value;
    insertTypeInner(column, value);
};

const insertTypeInner = (el, type) => {
    let double = false;
    let el2 = null;
    if (type[0] === '2') {
        double = true;
        type = type.substr(1);
        el2 = el.nextElementSibling || el.previousElementSibling;
        el2.dataset.type = type;
    }
    el.dataset.type = type;

    switch (type) {
        case 'text':
            el.innerHTML = '';
            const child = document.createElement('div');
            el.appendChild(child);
            el.classList.add('nostyle');
            if (double) { el2.remove(); }
            new Quill(child, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [ { 'header': [ 1, 2, 3, false ] } ],
                        [ 'bold', 'italic', 'underline', 'strike' ],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [ 'link', 'image', 'video' ],
                        [ 'blockquote' ],
                        [ 'clean' ]
                    ]
                }
            });

            break;

        case 'html':
            el.innerHTML = '';
            if (double) { el2.remove(); }
            el.classList.add('nostyle');
            CodeMirror(el, {
                mode: 'text/html',
                lineNumbers: true,

            });
    }

    newRow();
};

const newRow = () => {
    const el = els.row.cloneNode();
    el.innerHTML = els.row.innerHTML;
    els.contents.appendChild(el);
};

on(els.contents, 'change', e => {
    const el = e.target;
    if (!el.classList.contains('column-select')) { return; }
    handleSelectChange(el);
});

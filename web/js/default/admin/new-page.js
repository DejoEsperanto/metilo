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

els = Object.assign(els, {
    row:           $('#row-template>:first-child'),
    quillToolbar:  $('#quill-toolbar-template'),
    contents:      $('#new-page-contents'),
    header:        $('#row-header-template>:first-child'),
    removeConfirm: $('#remove-confirm-template'),
    doubleConfirm: $('#double-confirm-template'),
    saveButton:    $('#page-save'),
    beforeUnload:  $('#before-unload')
});

let doBeforeUnload = false;
const beforeUnloadMessage = els.beforeUnload.innerText;

const handleSelectChange = el => {
    doBeforeUnload = true;
    const column = el.parentElement;
    const value = el.value;
    insertTypeInner(column, value);
};

const handleColumnAction = el => {
    const header = el.parentElement; 
    const col = header.parentElement;
    const row = col.parentElement;
    const action = el.dataset.action;
    const col2 = col.nextElementSibling || col.previousElementSibling;

    switch (action) {
        case 'remove':
            confirmDialog(els.removeConfirm.innerHTML)
                .then(res => {
                    if (!res) { return; }

                    col.dataset.type = '';
                    col.innerHTML = '';
                    col.classList.remove('nostyle');

                    // Remove duplicate row
                    if (!col2 || col2.dataset.type === '') { row.remove(); }
                });

            break;

        case 'move-up':
            // Already first child
            if (!row.previousElementSibling) { return; }

            els.contents.insertBefore(row, row.previousElementSibling);

            break;

        case 'move-down':
            // Already last proper child
            if (!row.nextElementSibling || !row.nextElementSibling.nextElementSibling) { return; }

            els.contents.insertBefore(row, row.nextElementSibling.nextElementSibling);

            break;

        case 'switch':
            if (!col2) { return; }

            if (col.nextElementSibling) {
                // Move to last
                row.appendChild(col);
            } else {
                // Move to first
                row.insertBefore(col, col.previousElementSibling);
            }

            break;

        case 'double':
            // Already double
            if (!col2) { return; }

            let dialog = Promise.resolve(true);
            if (col2.dataset.type !== '') {
                dialog = confirmDialog(els.doubleConfirm.innerHTML);
            }

            dialog.then(res => {
                if (!res) { return; }

                col.dataset.type = '2' + col.dataset.type;

                $('[data-action=double]',   header).style.display = 'none';
                $('[data-action=undouble]', header).style.display = '';

                col2.remove();
            });

            break;

        case 'undouble':
            // Already two columns
            if (col2) { return; }

            col.dataset.type = col.dataset.type.substr(1);

            $('[data-action=double]',   header).style.display = '';
            $('[data-action=undouble]', header).style.display = 'none';

            row.appendChild(els.row.lastElementChild.cloneNode(true));
    }
};

const insertTypeInner = (el, type) => {
    let double = false;
    let row = el.parentElement;
    row.classList.add('has-el');
    let el2 = el.nextElementSibling || el.previousElementSibling;
    el.dataset.type = type;
    if (type[0] === '2') {
        double = true;
        type = type.substr(1);
    }

    switch (type) {
        case 'text':
            el.innerHTML = '';
            const toolbar = els.quillToolbar.cloneNode(true);
            toolbar.removeAttribute('id');
            el.appendChild(toolbar);
            const editor  = document.createElement('div');
            el.appendChild(editor);
            el.classList.add('nostyle');
            if (double) { el2.remove(); }
            new Quill(editor, {
                theme: 'snow',
                modules: {
                    toolbar: toolbar
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

    el.insertBefore(els.header.cloneNode(true), el.firstChild);
    if (double) {
        $('[data-action=double]', el.firstChild).style.display = 'none';
    } else {
        $('[data-action=undouble]', el.firstChild).style.display = 'none';
    }

    if (double || el2.dataset.type === '') { newRow(); }
};

const newRow = () => {
    const el = els.row.cloneNode(true);
    els.contents.appendChild(el);
};

on(els.contents, 'click', e => {
    const el = e.target;
    if (!el.classList.contains('column-action')) { return; }
    handleColumnAction(el);
});

on(els.contents, 'change', e => {
    const el = e.target;
    if (!el.classList.contains('column-select')) { return; }
    handleSelectChange(el);
});

on(els.saveButton, 'click', e => {

});

newRow();

on(window, 'beforeunload', e => {
    if (doBeforeUnload) {
        // Barely any browsers support custom messages, but we sit it just in case
        e.returnValue = beforeUnloadMessage;
        console.log(e.returnValue);
        return beforeUnloadMessage;
    }
});

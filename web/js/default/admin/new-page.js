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
    previewButton: $('#page-preview'),
    pageName:      $('#page-name'),
    pageTitle:     $('#page-title'),
    pageChanges:   $('#page-changes')
});

const codeEditors = {};

const handleSelectChange = el => {
    const column = el.parentElement;
    const value = el.value;
    insertTypeInner(column, value);
    // TODO: Handle 2x override confirmation
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

const insertTypeInner = (el, type, insertNewRow = true, defaultValue = null) => {
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
            if (defaultValue) {
                $('.ql-editor', editor).innerHTML = defaultValue;
            }

            break;

        case 'html':
            el.innerHTML = '';
            if (double) { el2.remove(); }
            el.classList.add('nostyle');
            const id = Date.now();
            codeEditors[id] = CodeMirror(el, {
                mode: 'text/html',
                lineNumbers: true,
                value: defaultValue || ''
            });
            el.dataset.id = id;
    }

    el.insertBefore(els.header.cloneNode(true), el.firstChild);
    if (double) {
        $('[data-action=double]', el.firstChild).style.display = 'none';
    } else {
        $('[data-action=undouble]', el.firstChild).style.display = 'none';
    }

    if (insertNewRow && (double || el2.dataset.type === '')) { newRow(); }
};

const newRow = () => {
    const el = els.row.cloneNode(true);
    els.contents.appendChild(el);
    return el;
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

const getContent = () => {
    const content = [];
    let x, y = -1;
    for (let row of els.contents.children) {
        if (!row.classList.contains('has-el')) { continue; }

        y++;
        x = -1;

        for (let col of row.children) {
            x++;

            if (col.dataset.type === '') { continue; }

            let width = 1;
            let type = col.dataset.type;
            if (col.dataset.type[0] === '2') {
                width = 2;
                type = col.dataset.type.substr(1);
            }

            let value;
            switch (type) {
                case 'text':
                    value = $('.ql-editor', col).innerHTML;

                    break;

                case 'html':
                    value = codeEditors[col.dataset.id].getValue();

                // TODO: Other types
            }

            content.push({
                x: x,
                width: width,
                y: y,
                type: type,
                value: value
            });
        }
    }

    return content;
};

on(els.saveButton, 'click', e => {
    // TODO: Verify that name isn't taken

    const data = {
        name:    els.pageName.value,
        title:   els.pageTitle.value,
        changes: els.pageChanges.value,
        content: getContent()
    };

    if (!data.name || data.name.length === 0) { return; }

    if (jsonData.edit) {
        data.id = jsonData.pageId;
        jsonXHR(`${C.baseURL}/xhr/page-update`, data, true)
            .then(() => {
                document.location.href = pageOverviewURL;
            });
    } else {
        jsonXHR(`${C.baseURL}/xhr/page-add`, data, true)
            .then(() => {
                document.location.href = pageOverviewURL;
            });
    }
});

on(els.previewButton, 'click', () => {
    const data = {
        title:   els.pageTitle.value,
        content: getContent()
    };

    windowPOST(`${C.baseURL}/${jsonData.previewURL}`, data);
});

on(window, 'beforeunload', e => {
    // Barely any browsers support custom messages, but we sit it just in case
    e.returnValue = beforeUnloadMessage;
    console.log(e.returnValue);
    return beforeUnloadMessage;
});

// Add existing content if editing a page
if (jsonData.edit) {
    const formattedData = [];

    for (let cell of jsonData.content) {
        if (!formattedData[cell.y]) {
            formattedData[cell.y] = [];
        }
        formattedData[cell.y][cell.x] = cell;
    }

    for (let rowContent of formattedData) {
        const rowEl = newRow();
        let cellNum = 0;
        for (let cellContent of rowContent) {
            const cellEl = rowEl.children[cellNum];
            let type = cellContent.type;
            if (cellContent.width > 1) {
                type = cellContent.width + type;
            }
            insertTypeInner(cellEl, type, false, cellContent.value);
            cellNum++;
        }
    }
}

// Insert the elect row
newRow();

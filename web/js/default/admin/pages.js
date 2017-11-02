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

const modals = {
    edit: $('#edit-modal'),
    delete: $('#delete-modal'),
    revision: $('#revision-modal'),
    preview: $('#preview-modal'),
    urls: $('#urls-modal')
};

for (let page of $$('#pages-table>tbody>tr:not(.no-data)')) {
    (page => {
        const id = page.dataset.id;
        const pageData = jsonData.pages[id];

        for (let action of $$('[data-pages-action]', page)) {
            switch (action.dataset.pagesAction) {
                case 'edit':
                    on(action, 'click', () => {
                        const content = modals.edit.cloneNode(true);
                        const select = $('select', content);

                        for (let revision of pageData.revisions) {
                            const option = document.createElement('option');
                            option.value = revision.id;
                            option.innerText = revision.text;

                            if (revision.id === pageData.activeRevision) {
                                option.setAttribute('selected', '')
                            }

                            select.appendChild(option);
                        }

                        inputDialog(content).then(r => {
                            if (!r) { return; }

                            document.location.href = `${C.baseURL}/${jsonData.editURL}/${r[0]}`;
                        });
                    });

                    break;

                case 'delete':
                    on(action, 'click', () => {
                        const content = modals.delete.cloneNode(true);

                        confirmDialog(content).then(r => {
                            if (!r) { return; }
                            
                            jsonXHR(`${C.baseURL}/xhr/page-delete`, { id: id })
                                .then(() => {
                                    page.remove();
                                });
                        });
                    });

                    break;

                case 'pickRevision':
                    on(action, 'click', () => {
                        const content = modals.revision.cloneNode(true);
                        const select = $('select', content);

                        for (let revision of pageData.revisions) {
                            const option = document.createElement('option');
                            option.value = revision.id;
                            option.innerText = revision.text;

                            if (revision.id === pageData.activeRevision) {
                                option.setAttribute('selected', '')
                            }

                            select.appendChild(option);
                        }

                        inputDialog(content).then(r => {
                            if (!r) { return; }

                            jsonXHR(`${C.baseURL}/xhr/page-set-revision`, {
                                id: id,
                                revision: r[0]
                            }).then(() => {
                                document.location.reload();
                            });
                        });
                    });

                    break;

                case 'preview':
                    on(action, 'click', () => {
                        const content = modals.preview.cloneNode(true);
                        const select = $('select', content);

                        for (let revision of pageData.revisions) {
                            const option = document.createElement('option');
                            option.value = revision.id;
                            option.innerText = revision.text;

                            if (revision.id === pageData.activeRevision) {
                                option.setAttribute('selected', '')
                            }

                            select.appendChild(option);
                        }

                        inputDialog(content).then(r => {
                            if (!r) { return; }

                            document.location.href = `${C.baseURL}/${jsonData.previewURL}/${r[0]}`;
                        });
                    });

                    break;

                case 'urls':
                    on(action, 'click', () => {
                        const content = modals.urls.cloneNode(true);
                        $('textarea', content).value = pageData.urls;

                        inputDialog(content).then(r => {
                            if (!r) { return; }

                            jsonXHR(`${C.baseURL}/xhr/page-set-urls`, {
                                id: id,
                                urls: r[0]
                            }).then(() => {
                                pageData.urls = r[0];
                            });
                        });
                    });
            }
        }
    })(page);
}

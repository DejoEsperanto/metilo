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
    menuUl: $('#menu-ul'),
    addButton: $('#new-menu-item-button'),
    addModal: $('#add-modal-template'),
    cancelParentButton: $('#cancel-parent-button'),
    clickParentText: $('#click-parent-text')
});

// Display menu
{
    let menu = jsonData.menu.slice(0);
    let i = -1;
    while (menu.length) {
        if (++i >= menu.length) { i = 0; }
        const item = menu[i];

        let parent = $(`[data-id="${item.parent}"]>ul`, els.menuUl);
        if (item.parent && !parent) { continue; }

        const after = $(`[data-id="${item.after}"]`, els.menuUl);
        if (item.after && !after) { continue; }

        let page;
        for (let p of jsonData.pages) {
            if (p.id === item.page) {
                page = p;
                break;
            }
        }

        const el = document.createElement('li');
        el.dataset.id = item.id;
        el.innerText = `${item.name} (${page.name})`;
        const ul = document.createElement('ul');
        ul.classList.add('ul');
        el.appendChild(ul);
        if (after) {
            insertAfter(el, after);
        } else if (parent) {
            parent.appendChild(el);
        } else {
            els.menuUl.appendChild(el);
        }

        menu.splice(i, 1);
    }
}

on(els.addButton, 'click', () => {
    const text = els.addModal.innerHTML;
    inputDialog(text, true)
        .then(r => {
            if (!r) { return; }
            const data = {
                page: r.data[0],
                name: r.data[1]
            };
            const insertFn = () => {
                jsonXHR(`${C.baseURL}/xhr/menu-add`, data).then(() => {
                    document.location.reload();
                });
            };

            if (r.closeValue === 'add-global') {
                if (jsonData.menu.length) {
                    data.after = jsonData.menu[jsonData.menu.length - 1].id;
                }

                insertFn();
            } else if (r.closeValue === 'add-child') {
                els.cancelParentButton.style.display = '';
                els.clickParentText.style.display = '';
                els.menuUl.classList.add('click-mode');

                const clickHandler = e => {
                    const el = e.target;
                    if (!(el instanceof HTMLLIElement)) { return; }

                    data.parent = el.dataset.id;

                    const after = $('ul>li', el);
                    if (after) {
                        data.after = after.dataset.id;
                    }

                    cleanUpHandler();
                    insertFn();
                };

                const cleanUpHandler = () => {
                    els.cancelParentButton.style.display = 'none';
                    els.clickParentText.style.display = 'none';
                    els.menuUl.classList.remove('click-mode');
                    els.menuUl.removeEventListener('click', clickHandler);
                };

                on(els.menuUl, 'click', clickHandler);
                on(els.cancelParentButton, 'click', cleanUpHandler);

                return;
            }
        });
});

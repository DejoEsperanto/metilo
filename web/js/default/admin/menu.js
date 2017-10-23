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
    addModal: $('#add-modal-template')
});

// Display menu
{
    let menu = jsonData.menu.slice(0);
    let i = -1;
    while (menu.length) {
        if (++i >= menu.length) { i = 0; }
        const item = menu[i];

        const parent = $(`[data-id="${item.parent}"]`, els.menuUl);
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
            if (r.closeValue === 'add-global') {
                if (jsonData.menu.length) {
                    data.after = jsonData.menu[jsonData.menu.length - 1].id;
                }
            } else if (r.closeValue === 'add-child') {
                return; // TODO
            }

            jsonXHR(`${C.baseURL}/xhr/menu-add`, data).then(() => {
                document.location.reload();
            })
        });
});

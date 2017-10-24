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
    clickParentText: $('#click-parent-text'),
    menuItemActions: $('#menu-item-action-template')
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
        if (!parent) { parent = els.menuUl; }

        let page;
        for (let p of jsonData.pages) {
            if (p.id === item.page) {
                page = p;
                break;
            }
        }

        const el = document.createElement('li');
        el.dataset.id = item.id;

        const span = document.createElement('span');
        span.innerText = `${item.name} (${page.name})`;
        el.appendChild(span);

        el.appendChild(els.menuItemActions.cloneNode(true));

        const ul = document.createElement('ul');
        ul.classList.add('ul');
        el.appendChild(ul);

        let children = parent.children;
        if (children.length > item.index) {
            parent.insertBefore(el, children[item.index]);
        } else {
            parent.appendChild(el);
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
                data.index = jsonData.menu.length;
                insertFn();
            } else if (r.closeValue === 'add-child') {
                els.cancelParentButton.style.display = '';
                els.clickParentText.style.display = '';
                els.menuUl.classList.add('click-mode');

                const clickHandler = e => {
                    let el;
                    for (let pathEl of e.path) {
                        if (pathEl === document) { return; }
                        if (pathEl.tagName === 'LI') {
                            el = pathEl;
                            break;
                        }
                    }

                    data.parent = el.dataset.id;
                    data.index = $('ul', el).children.length;

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

on(els.menuUl, 'click', e => {
    let button;
    for (let el of e.path) {
        if (el === document) { return; }
        if (el.classList.contains('menu-action')) {
            button = el;
            break;
        }
    }

    const el = button.parentElement.parentElement;

    switch (button.dataset.action) {
        case 'move-up':
            if (!el.previousElementSibling) { return; } // Already at the top

            jsonXHR(`${C.baseURL}/xhr/menu-move-up`, {
                id: el.dataset.id
            }).then(() => {
                console.log('Done');
            });
    }
});

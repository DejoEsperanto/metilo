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

els = Object.assign(els, {
    menuUl: $('#menu-ul'),
    addButton: $('#new-menu-item-button'),
    addModal: $('#add-modal-template'),
    editModal: $('#edit-modal-template'),
    deleteModal: $('#delete-modal-template'),
    cancelParentButton: $('#cancel-parent-button'),
    nullParentButton: $('#null-parent-button'),
    clickParentText: $('#click-parent-text'),
    menuItemActions: $('#menu-item-action-template')
});

// Display menu
{
    let menuData = jsonData.menu.slice(0);
    const menu = [];
    const parents = {};
    let i = -1;
    while (menuData.length) {
        if (++i >= menuData.length) { i = 0; }
        const item = menuData[i];

        let parent;
        if (item.parent === null) {
            parent = menu;
        } else if (parents[item.parent]) {
            parent = parents[item.parent];
        } else {
            continue;
        }

        parent[item.index] = {
            id: item.id,
            name: item.name,
            page: item.page,
            children: []
        };
        parents[item.id] = parent[item.index].children;

        menuData.splice(i, 1);
    }

    const handleMenuItems = (items, parent) => {
        for (let item of items) {
            let page;
            for (let p of jsonData.pages) {
                if (p.id === item.page) {
                    page = p;
                    break;
                }
            }

            const el = document.createElement('li');
            el.dataset.id = item.id;
            el.dataset.page = item.page;
            el.dataset.name = item.name;

            const span = document.createElement('span');
            span.innerText = `${item.name} (${page.name})`;
            el.appendChild(span);

            el.appendChild(els.menuItemActions.cloneNode(true));

            const ul = document.createElement('ul');
            ul.classList.add('ul');
            el.appendChild(ul);

            parent.appendChild(el);

            handleMenuItems(item.children, ul);
        }
    };
    handleMenuItems(menu, els.menuUl);
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
                data.index = els.menuUl.children.length;
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
                el.parentElement.insertBefore(el, el.previousElementSibling);
            });

            break;

        case 'move-down':
            if (!el.nextElementSibling) { return; } // Already at the bottom

            jsonXHR(`${C.baseURL}/xhr/menu-move-down`, {
                id: el.dataset.id
            }).then(() => {
                insertAfter(el, el.nextElementSibling);
            });

            break;

        case 'delete':
            confirmDialog(els.deleteModal.innerHTML)
                .then(r => {
                    if (!r) { return; }

                    jsonXHR(`${C.baseURL}/xhr/menu-delete`, {
                        id: el.dataset.id
                    }).then(() => {
                        el.remove();
                    });
                });

            break;

        case 'set-parent':
            els.nullParentButton.style.display = '';
            els.cancelParentButton.style.display = '';
            els.clickParentText.style.display = '';
            els.menuUl.classList.add('click-mode');

            const clickHandler = e => {
                const data = {
                    id: el.dataset.id
                };
                let newParent;

                if (e) {
                    newParent;
                    for (let pathEl of e.path) {
                        if (pathEl === document) { return; }
                        if (pathEl.tagName === 'LI') {
                            newParent = pathEl;
                            break;
                        }
                    }

                    data.parent = newParent.dataset.id;
                    data.index = $('ul', newParent).children.length;
                } else {
                    data.parent = null;
                    data.index = els.menuUl.children.length;
                }

                jsonXHR(`${C.baseURL}/xhr/menu-set-parent`, data).then(() => {
                    if (e) {
                        $('ul', newParent).appendChild(el);
                    } else {
                        els.menuUl.appendChild(el);
                    }
                });

                cleanUpHandler();
            };

            const cleanUpHandler = () => {
                els.cancelParentButton.style.display = 'none';
                els.nullParentButton.style.display = 'none';
                els.clickParentText.style.display = 'none';
                els.menuUl.classList.remove('click-mode');
                els.menuUl.removeEventListener('click', clickHandler);
            }

            on(els.menuUl, 'click', clickHandler);
            on(els.nullParentButton, 'click', () => clickHandler(null));
            on(els.cancelParentButton, 'click', cleanUpHandler);

            break;

        case 'edit':
            let text = els.editModal.cloneNode(true);
            $(`option[value="${el.dataset.page}"]`, text).selected = 'selected';
            $('input', text).value = el.dataset.name;

            inputDialog(text)
                .then(r => {
                    if (!r) { return; }

                    jsonXHR(`${C.baseURL}/xhr/menu-update`, {
                        id: el.dataset.id,
                        page: r[0],
                        name: r[1]
                    }).then(() => {
                        document.location.reload();
                    });
                });
    }
});

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
    delete: $('#delete-modal')
};

for (let user of $$('#users-table>tbody>tr')) {
    (user => {
        let username = $('[data-name=username]', user).innerText;

        for (let action of $$('[data-users-action]', user)) {
            switch (action.dataset.usersAction) {
                case 'delete': {
                    on(action, 'click', () => {
                        const text = modals.delete.innerHTML.replace('%s', username);
                        confirmDialog(text).then(r => {
                            if (!r) { return; }
                            jsonXHR(`${baseURL}/xhr/user-delete`, { username: username })
                                .then(() => { document.location.reload(); });
                        });
                    });
                }
            }
        }
    })(user);
}

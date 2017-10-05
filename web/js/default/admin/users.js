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
    delete:  $('#delete-modal'),
    reset:   $('#reset-modal'),
    newPass: $('#new-pass-modal'),
    role:    $('#role-modal'),
    phone:   $('#phone-modal')
};

const updateUser = (user, fields) => {
    return jsonXHR(`${baseURL}/xhr/user-update`, {
        user: user,
        fields: fields
    }, true);
}

for (let user of $$('#users-table>tbody>tr')) {
    (user => {
        let username = $('[data-name=username]', user).innerText;

        for (let action of $$('[data-users-action]', user)) {
            switch (action.dataset.usersAction) {
                case 'delete':
                    on(action, 'click', () => {
                        const text = modals.delete.innerHTML.replace('%s', username);
                        confirmDialog(text).then(r => {
                            if (!r) { return; }
                            jsonXHR(`${baseURL}/xhr/user-delete`, { username: username })
                                .then(() => { document.location.reload(); });
                        });
                    });

                    break;

                case 'reset':
                    on(action, 'click', () => {
                        const text = modals.reset.innerHTML.replace('%s', username);
                        confirmDialog(text).then(r => {
                            if (!r) { return; }
                            jsonXHR(`${baseURL}/xhr/user-reset-pass`, { username: username })
                                .then(res => {
                                    const text = modals.newPass.innerHTML
                                        .replace('%s$1', username)
                                        .replace('%s$2', res.password);
                                    textDialog(text);
                                });
                        });
                    });

                    break;

                case 'role':
                    on(action, 'click', () => {
                        const text = modals.role.innerHTML.replace('%s', action.innerText);
                        inputDialog(text).then(r => {
                            if (r === null) { return; }
                            updateUser(username, { role: r[0] });
                            action.innerText = r;
                        });
                    });

                    break;

                case 'phone':
                    on(action, 'click', () => {
                        const text = modals.phone.innerHTML
                            .replace('%s$1', action.dataset.phoneCode)
                            .replace('%s$2', action.dataset.phone);
                        inputDialog(text).then(r => {
                            if (r === null) { return; }
                            let number;
                            if (r[1]) {
                                number = `+${r[0] + r[1]}`;
                            } else {
                                number = '';
                            }
                            updateUser(username, { phoneNumber: number });
                            // We'll just refresh here as formatting the phone number on the client side would require loading yet another library
                            document.location.reload();
                        });
                    });
            }
        }
    })(user);
}

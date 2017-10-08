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
    delete:   $('#delete-modal'),
    reset:    $('#reset-modal'),
    newPass:  $('#new-pass-modal'),
    role:     $('#role-modal'),
    phone:    $('#phone-modal'),
    email:    $('#email-modal'),
    nickname: $('#nickname-modal'),
    username: $('#username-modal'),
    admin0:   $('#admin0-modal'),
    admin1:   $('#admin1-modal'),
    name:     $('#name-modal')
};

const updateUser = (user, fields) => {
    return jsonXHR(`${C.baseURL}/xhr/user-update`, {
        user: user,
        fields: fields
    }, true);
};

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
                            jsonXHR(`${C.baseURL}/xhr/user-delete`, { username: username })
                                .then(() => { document.location.reload(); });
                        });
                    });

                    break;

                case 'reset':
                    on(action, 'click', () => {
                        const text = modals.reset.innerHTML.replace('%s', username);
                        confirmDialog(text).then(r => {
                            if (!r) { return; }
                            jsonXHR(`${C.baseURL}/xhr/user-reset-pass`, { username: username })
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
                            updateUser(username, { role: r[0] })
                                .then(() => { action.innerText = r; });
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
                            updateUser(username, { phoneNumber: number })
                                .then(() => {
                                    // We'll just refresh here as formatting the phone number on the client side would require loading yet another library
                                    document.location.reload();
                                });
                        });
                    });

                    break;

                case 'email':
                    on(action, 'click', () => {
                        const text = modals.email.innerHTML
                            .replace('%s', action.innerText);
                        inputDialog(text).then(r => {
                            if (r === null) { return; }
                            updateUser(username, { email: r[0] })
                                .then(() => { action.innerText = r[0]; });
                        });
                    });

                    break;

                case 'nickname':
                    on(action, 'click', () => {
                        const text = modals.nickname.innerHTML
                            .replace('%s', action.innerText);
                        inputDialog(text).then(r => {
                            if (r === null) { return; }
                            updateUser(username, { nickname: r[0] })
                                .then(() => { action.innerText = r[0]; });
                        });
                    });

                    break;

                case 'username':
                    on(action, 'click', () => {
                        const text = modals.username.innerHTML
                            .replace('%s', action.innerText);
                        inputDialog(text).then(r => {
                            if (r === null) { return; }
                            updateUser(username, { username: r[0] })
                                .then(() => {
                                    action.innerText = r[0];
                                    username = r[0];
                                });
                        });
                    });

                    break;

                case 'admin':
                    on(action, 'click', () => {
                        const newValue = +!+action.dataset.value;
                        const text = modals['admin' + newValue].innerHTML.replace('%s', username);
                        confirmDialog(text).then(r => {
                            if (!r) { return; }
                            updateUser(username, { level: newValue })
                                .then(() => {
                                    action.firstChild.innerText = newValue ? 'account_circle' : 'stars';
                                    action.dataset.value = newValue;
                                });
                        });
                    });

                    break;

                case 'name':
                    on(action, 'click', () => {
                        const text = modals.name.innerHTML
                            .replace('%s$1', action.dataset.fullName)
                            .replace('%s$2', action.dataset.surname);
                        inputDialog(text).then(r => {
                            if (r === null) { return; }
                            if (r[0].indexOf(r[1]) === -1) { return; }
                            let encodedName, encodedSurname;
                            let newFullName = '';
                            if (r[0]) { encodedName    = htmlEscape(r[0]) };
                            if (r[1]) { encodedSurname = htmlEscape(r[1]) };
                            if (r[0] && r[1]) {
                                newFullName = encodedName.replace(encodedSurname, `<span class="surname">${encodedSurname}</span>`);
                            } else if (r[0]) {
                                newFullName = encodedName;
                            } else if (r[1]) {
                                newFullName = encodedSurname;
                            }
                            updateUser(username, {
                                name: r[0],
                                surname: r[1]
                            })
                                .then(() => {
                                    action.innerHTML = newFullName;
                                    action.dataset.fullName = r[0];
                                    action.dataset.surname  = r[1];
                            });
                        });
                    });
            }
        }
    })(user);
}

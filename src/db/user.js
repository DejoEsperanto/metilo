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

import bcrypt from 'bcrypt';
import { PhoneNumberFormat as PNF, PhoneNumberUtil } from 'google-libphonenumber';
import metilo from '..';

class User {
    constructor ({
        data = {}
    } = {}) {
        data = Object.assign({
            id: undefined,
            name: null,
            surname: null,
            nickname: null,
            // username,
            email: null,
            phoneNumber: null,
            role: null,
            //password,
            level: 1
        }, data);

        this.data = data;
    }

    /**
     * Obtains the user's name. Escaped and formatted for HTML
     * @return {string}
     */
    name () {
        if (this.data.nickname) { return metilo.entities.encode(this.data.nickname); }
        if (this.data.name) { return metilo.entities.encode(this.fullName()); }
        return metilo.entities.encode(this.data.username);
    }

    /**
     * Obtains the user's full name. Escaped and formatted for HTML
     * @return {string}
     */
    fullName () {
        let fullName = this.data.name;
        if (fullName) { var encodedFullName = metilo.entities.encode(fullName); }
        let surname = this.data.surname;
        if (surname) { var encodedSurname = metilo.entities.encode(surname); }

        if (fullName && surname) {
            return encodedFullName.replace(encodedSurname, `<span class="surname">${encodedSurname}</span>`);
        } else if (fullName) { return fullName; }

        return surname;
    }

    /**
     * Retyrns whether the user is an administrator
     * @return {boolean}
     */
    isAdmin () {
        return this.data.level === 0;
    }

    static async createUser ({
        name = null,
        surname = null,
        nickname = null,
        username,
        email = null,
        phoneNumber = null,
        role = null,
        password,
        level = 1
    } = {}) {
        if (name === '') { name = null; }
        if (surname === '') { surname = null; }
        if (nickname === '') { nickname = null; }
        if (email === '') { email = null; }
        if (phoneNumber === '') { phoneNumber = null; }
        if (role === '') { role = null; }
        if (level === '') { level = 1; }

        if (name && surname) {
            if (name.indexOf(surname) === -1) { throw new Error('surname'); }
        }

        // Determine if username taken
        if (metilo.db.usernameTaken(username)) { throw new Error('usernameTaken'); }

        // Generate salt
        const hash = await bcrypt.hash(password, metilo.conf.bcryptSaltRounds);

        const data = {
            name: name,
            surname: surname,
            nickname: nickname,
            username: username,
            email: email,
            phoneNumber: phoneNumber,
            role: role,
            password: hash,
            level: level
        };

        // Insert into db
        data.id = metilo.db.insertUser(data);

        return new User({
            data: data
        });
    }

    /**
     * Returns a formatted phone number
     * @return {string|null}
     */
    phoneNumber () {
        if (this.data.phoneNumber) {
            let pnf = PNF.INTERNATIONAL;
            if (this.data.phoneNumber.indexOf('+' + metilo.conf.defaultPhoneCode[1]) === 0) {
                pnf = PNF.NATIONAL;
            }
            const phoneUtil = PhoneNumberUtil.getInstance();
            const phoneNumber = phoneUtil.parse(this.data.phoneNumber);
            return phoneUtil.format(phoneNumber, pnf);
        }
        return null;
    }
}

export default User;

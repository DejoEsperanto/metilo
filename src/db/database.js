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

import Sqlite from 'better-sqlite3';
import User from './user';

export default class Database {
    /**
     * Creates a new database
     * @param  {string} file      A path to the database to use
     * @param  {Object} [options] Options to pass to better-sqlite3
     */
    constructor (file, options = {}) {
        this.db = new Sqlite(file, options);
    }

    /**
     * Obtains a user from the database
     * @param  {string}  [where]      A where clause to include
     * @param  {Array}   [parameters] Parameters to include
     * @return {User|User[]}          Return a single user
     */
    getUser (where = '', parameters = []) {
        return this.getUsers(where, parameters, true);
    }

    /**
     * Obtains users from the database
     * @param  {string}  [where]      A where clause to include
     * @param  {Array}   [parameters] Parameters to include
     * @param  {boolean} [first]      Whether to only obtain the first user
     * @return {User|User[]|null}     Return an array of users or a single user if `first`
     */
    getUsers (where = '', parameters = [], first = false) {
        let query = 'select * from users';
        if (where) {
            query += ` where ${where}`;
        }

        if (!(parameters instanceof Array)) {
            parameters = [parameters];
        }

        const statement = this.db.prepare(query);
        if (first) {
            const row = statement.get(...parameters);
            return row ? new User({ data: row }) : null;
        } else {
            const rows = statement.all(...parameters);
            return rows.map(row => new User({ data: row }));
        }
    }

    /**
     * Returns whether a username is taken
     * @param  {string}  username The username to check
     * @return {boolean} Whether the username is tkane
     */
    usernameTaken (username) {
        return !!this.db.prepare('select 1 from users where username = ?').get(username);
    }

    /**
     * Inserts a user into the database
     * @param  {Object} data User data
     * @return {number} The user's ID
     */
    insertUser (data) {
        const parameters = [
            data.name,
            data.surname,
            data.nickname,
            data.username,
            data.email,
            data.phoneNumber,
            data.role,
            data.password,
            data.level
        ];

        return this.db.prepare(`insert into users (name, surname, nickname, username, email,
            phoneNumber, role, password, level) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(...parameters).lastInsertROWID;
    }

    /**
     * Deletes users from the database
     * @param  {string} where     Where statement
     * @param  {Array} parameters Parameters
     */
    deleteUser (where, parameters) {
        this.db.prepare(`delete from users where ${where}`)
            .run(...parameters);
    }

    /**
     * Updates users in the database
     * @param  {string} set       Set statement
     * @param  {string} where     Where statement
     * @param  {Array} parameters Parameters
     */
    updateUser (set, where, parameters) {
        this.db.prepare(`update users set ${set} where ${where}`)
            .run(...parameters);
    }
}

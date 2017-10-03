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

import path from 'path';

export default {
    // THE FOLLOWING SETTINGS MUST BE CHANGED FROM THEIR DEFAULTS
    // LEAVING THESE UNCHANGED WILL RESULT IN HUGE SECURITY ISSUES
    superadmin: {
        username: 'admin',
        password: 'admin'
    },
    sessionSecret: 'ehhoshanghochiujhaude',

    // The following settings *should* be changed from their defaults


    // The following settings may be changed if needed
    loginLimit: {
        max: 20,
        time: 15 * 60, // 15 minutes
        delay: 100 // milliseconds
    },
    bcryptSaltRounds: 20000,
    baseDir: path.join(__dirname, '../data'),
    dbFile: 'db.db',
    port: 80,
    trustProxy: false, // Only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)
    routers: {
        main: '/',
        admin: '/admin'
    },
    content: {
        theme: 'default',
        locales: {
            main: [],
            admin: []
        },
        localeStrings: {
            'da-dk': {
                copyright: {
                    local: '&copy; 2017. <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.da">CC BY-SA 4.0</a>'
                },
                siteName: 'Metilo'
            },
            'en-us': {
                copyright: {
                    local: '&copy; 2017. <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en">CC BY-SA 4.0</a>'
                },
                siteName: 'Metilo'
            },
            'eo': {
                copyright: {
                    local: '&copy; 2017. <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.eo">CC BY-SA 4.0</a>'
                },
                siteName: 'Metilo'
            }
        }
    }
};

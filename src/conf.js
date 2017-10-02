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

export default {
    port: 80,
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
                    local: '&copy; 2017 . <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.da">CC BY-SA 4.0</a>'
                },
                siteName: 'Metilo'
            },
            'en-us': {
                copyright: {
                    local: '&copy; 2017 . <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en">CC BY-SA 4.0</a>'
                },
                siteName: 'Metilo'
            },
            'eo': {
                copyright: {
                    local: '&copy; 2017 . <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.eo">CC BY-SA 4.0</a>'
                },
                siteName: 'Metilo'
            }
        }
    }
};

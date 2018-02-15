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

// Util
const $ = function (el, parent = document) {
    return parent.querySelector(el);
};

const $$ = function (el, parent = document) {
    return parent.querySelectorAll(el);
};

const on = function (el, event, cb) {
    el.addEventListener(event, cb);
};

const insertAfter = (el, after) => {
    after.parentNode.insertBefore(el, after.nextSibling);
};

const jsonXHR = (url, params, json = false) => {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.open('POST', url, true);
        if (json) {
            req.setRequestHeader('Content-Type', 'application/json');
        } else {
            req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        req.onload = () => {
            if (req.status >= 200 && req.status < 400) {
                try {
                    resolve(JSON.parse(req.response));
                } catch (e) {
                    reject(req.response);
                }
            } else { reject(req.status); }
        };
        req.onerror = e => {
            reject(e);
        };
        if (json) {
            req.send(JSON.stringify(params));
        } else {
            let paramsStr = '';
            for (let key in params) {
                if (paramsStr !== '') { paramsStr += '&'; }
                paramsStr += `${key}=${encodeURIComponent(params[key])}`;
            }
            req.send(paramsStr);
        }
    });
};

const recursiveInput = (path = [], data) => {
    let inputs = [];
    for (let key in data) {
        const thisPath = path.concat([key]);
        if (data[key] instanceof Object) {
            inputs = inputs.concat(recursiveInput(thisPath, data[key]));
        } else {
            let name = '';
            for (let i = thisPath.length - 1; i >= 0; i--) {
                if (i === 0) {
                    name = thisPath[i] + name;
                } else {
                    name = `[${thisPath[i]}]` + name;
                }
            }

            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = data[key];
            inputs.push(input);
        }
    }
    return inputs;
};

const windowPOST = (url, params, target = '_blank') => {
    const form = document.createElement('form');
    form.action = url;
    form.target = target;
    form.method = 'POST';
    form.style.display = 'none';
    document.body.appendChild(form);

    const inputs = recursiveInput([], params);
    for (let input of inputs) {
        form.appendChild(input);
    }

    form.submit();
    form.remove();
};

const confirmDialog = text => {
    return new Promise((resolve, reject) => {
        picoModal({
            content: text
        }).afterCreate(modal => {
            modal.modalElem().addEventListener('click', e => {
                if (e.target && e.target.matches('.ok')) {
                    modal.close(true);
                } else if (e.target && e.target.matches('.cancel')) {
                    modal.close(false);
                }
            });
        }).afterClose((modal, e) => {
            resolve(e.detail);
            modal.destroy();
        }).show();
    });
};

const textDialog = text => {
    picoModal({ content: text })
        .show()
        .afterClose(modal => { modal.destroy(); });
};

const inputDialog = (text, returnMore = false) => {
    let closeButton;
    return new Promise((resolve, reject) => {
        picoModal({
            content: text
        }).afterCreate(modal => {
            modal.modalElem().addEventListener('click', e => {
                closeButton = e.target;
                if (e.target && e.target.matches('.ok')) {
                    modal.close(true);
                } else if (e.target && e.target.matches('.cancel')) {
                    modal.close(false);
                }
            });
        }).beforeClose((modal, e) => {
            if (e.detail) {
                for (let el of $$('[data-inner],[data-value]', modal.modalElem())) {
                    if (el.required && !el.validity.valid) {
                        e.preventDefault();
                        break;
                    }
                }
            }
        }).afterClose((modal, e) => {
            if (e.detail) {
                const elems = Array.from($$('[data-inner],[data-value]', modal.modalElem()));
                const data = elems.map(el => {
                    if (typeof el.dataset.inner === 'string') { return el.innerText; }
                    if (typeof el.dataset.value === 'string') { return el.value; }
                });
                if (returnMore) {
                    resolve({
                        modal: modal,
                        data: data,
                        closeButton: closeButton,
                        closeValue: closeButton.dataset.value || null
                    });
                } else {
                    resolve(data);
                }
            } else {
                resolve(null);
            }
            modal.destroy();
        }).show();
    });
};

const htmlEscape = str => {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const htmlUnescape = str => {
    return str
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

// Elements
let els = {
    selectLanguage: $('#select-language')
};

// Constants
const C = {
    subsite: document.body.dataset.subsite,
    str: {}
};

// Header
on(els.selectLanguage, 'change', e => {
    Cookies.set(C.subsite + 'Locale', els.selectLanguage.value, { expires: 365 });
    location.reload();
});

// Button links
for (let button of $$('button[data-href]')) {
    on(button, 'click', e => {
        const href = e.currentTarget.dataset.href;
        document.location.href = href;
    })
}

// Form help
for (let form of $$('.form-with-help')) {
    const formName = form.dataset.name;
    const textEl = $(`.form-help-text[data-name=${formName}]`);

    for (let input of $$('[data-name]', form)) {
        const text = $(`[data-name=${input.dataset.name}]`, textEl);
        on(input, 'focus', e => {
            text.style.display = 'block';
        });
        on(input, 'blur', e => {
            text.style.display = 'none';
        });
    }
}

// Quill
// https://stackoverflow.com/a/37814768/1248084
const QuillInline = Quill.import('blots/inline');

class SmallCaps extends QuillInline {
    static create(value) {
        let node = super.create(value);
        return node;
    }

    static formats (domNode) {
        return domNode.classList.contains('smallcaps') || true;
    }

    format (name, value) {
        if (name === 'smallcaps' && value) {
            this.domNode.classList.add('smallcaps');
        } else {
            super.format(name, value);
        }
    }

    formats () {
        let formats = super.formats();
        formats['smallcaps'] = SmallCaps.formats(this.domNode);
        return formats;
    }
}
SmallCaps.blotName = 'smallcaps';
SmallCaps.className = 'smallcaps';
SmallCaps.tagName = 'span';
Quill.register({ 'formats/smallcaps': SmallCaps });

const customImageHandler = function () {
    const quill = this.quill;
    const range = quill.getSelection();
    const content = `
    <p>${C.str.imageURL}</p>
    <input data-value>
    <p class="footer">
        <button class="cancel">${C.str.modal.buttons.cancel}</button>
        <button class="ok">${C.str.modal.buttons.insert}</button>
    </p>
    `;
    inputDialog(content).then(r => {
        if (!r) { return; }

        quill.insertEmbed(range.index, 'image', r[0], Quill.sources.USER);
    });
};

// Util
const $ = function (el, parent = document) {
    return parent.querySelector(el);
};

const $$ = function (el, parent = document) {
    return parent.querySelectorAll(el);
};

const on = function (el, event, cb) {
    el.addEventListener(event, cb);
}

// Elements
const els = {
    selectLanguage: $('#select-language')
};

// Constants
const C = {
    subsite: document.body.dataset.subsite
};

// Header
on(els.selectLanguage, 'change', e => {
    Cookies.set(C.subsite + 'Locale', els.selectLanguage.value);
    location.reload();
});

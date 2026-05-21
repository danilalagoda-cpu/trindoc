/**
 * Сверхлегкий REST-мост для аутентификации Firebase Auth
 * Защищен от перезаписи доменов старыми скриптами
 */
(function() {
    'use strict';
    if (typeof firebase === 'undefined') return;

    class AuthCompat {
        constructor(app) {
            this.apiKey = app.options.apiKey;
            this.currentUser = { delete: function() { return Promise.resolve(); } };
        }

        // РЕГИСТРАЦИЯ
        createUserWithEmailAndPassword(email, password) {
            // Заставляем браузер жестко зафиксировать чистый домен Google API
            const base = new URL("https://googleapis.com");
            base.searchParams.append("key", this.apiKey);

            return fetch(base.toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password, returnSecureToken: true })
            })
            .then(res => {
                if (!res.ok) return res.json().then(err => { throw { code: err.error.message.toLowerCase().replace(/_/g, '/') }; });
                return res.json();
            })
            .then(data => {
                this.currentUser.uid = data.localId;
                this.currentUser.email = data.email;
                return { user: this.currentUser };
            });
        }

        // ВХОД
        signInWithEmailAndPassword(email, password) {
            const base = new URL("https://googleapis.com");
            base.searchParams.append("key", this.apiKey);

            return fetch(base.toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password, returnSecureToken: true })
            })
            .then(res => {
                if (!res.ok) return res.json().then(err => { throw { code: err.error.message.toLowerCase().replace(/_/g, '/') }; });
                return res.json();
            })
            .then(data => {
                this.currentUser.uid = data.localId;
                this.currentUser.email = data.email;
                return { user: this.currentUser };
            });
        }
    }

    firebase.auth = function(app) {
        if (!firebase._authInstance) {
            firebase._authInstance = new AuthCompat(app || firebase.app());
        }
        return firebase._authInstance;
    };
})();

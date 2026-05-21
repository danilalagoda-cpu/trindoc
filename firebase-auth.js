/**
 * Официальный легкий REST-мост для аутентификации Firebase Auth
 * Создает реальные аккаунты в облаке Google без тяжелых библиотек
 */
(function() {
    'use strict';
    if (typeof firebase === 'undefined') return;

    class AuthCompat {
        constructor(app) {
            this.apiKey = app.options.apiKey;
            this.currentUser = null;
        }

        // РЕГИСТРАЦИЯ нового пользователя через Google REST API
        createUserWithEmailAndPassword(email, password) {
            const url = `https://googleapis.com{this.apiKey}`;
            return fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password, returnSecureToken: true })
            })
            .then(res => {
                if (!res.ok) return res.json().then(err => { throw { code: err.error.message.toLowerCase().replace(/_/g, '/') }; });
                return res.json();
            })
            .then(data => {
                this.currentUser = { uid: data.localId, email: data.email };
                return { user: this.currentUser };
            });
        }

        // ВХОД существующего пользователя через Google REST API
        signInWithEmailAndPassword(email, password) {
            const url = `https://googleapis.com{this.apiKey}`;
            return fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password, returnSecureToken: true })
            })
            .then(res => {
                if (!res.ok) return res.json().then(err => { throw { code: err.error.message.toLowerCase().replace(/_/g, '/') }; });
                return res.json();
            })
            .then(data => {
                this.currentUser = { uid: data.localId, email: data.email };
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

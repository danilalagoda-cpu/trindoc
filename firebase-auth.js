/**
 * Сверхлегкий REST-мост для аутентификации Firebase Auth
 * Защищен от перехвата fetch и блокировок старыми скриптами
 */
(function() {
    'use strict';
    if (typeof firebase === 'undefined') return;

    class AuthCompat {
        constructor(app) {
            this.apiKey = app.options.apiKey;
            this.currentUser = { delete: function() { return Promise.resolve(); } };
        }

        // РЕГИСТРАЦИЯ через XMLHttpRequest (в обход fetch)
        createUserWithEmailAndPassword(email, password) {
            return new Promise((resolve, reject) => {
                const xhr = new MyXMLHttpRequest(); // Используем чистый системный вызов
                const url = "https://googleapis.com" + this.apiKey;
                
                xhr.open("POST", url, true);
                xhr.setRequestHeader("Content-Type", "application/json");
                
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        const response = JSON.parse(xhr.responseText);
                        if (xhr.status >= 200 && xhr.status < 300) {
                            window.firebase.auth().currentUser.uid = response.localId;
                            window.firebase.auth().currentUser.email = response.email;
                            resolve({ user: window.firebase.auth().currentUser });
                        } else {
                            reject({ code: response.error.message.toLowerCase().replace(/_/g, '/') });
                        }
                    }
                };
                xhr.send(JSON.stringify({ email: email, password: password, returnSecureToken: true }));
            });
        }

        // ВХОД через XMLHttpRequest
        signInWithEmailAndPassword(email, password) {
            return new Promise((resolve, reject) => {
                const xhr = new MyXMLHttpRequest();
                const url = "https://googleapis.com" + this.apiKey;
                
                xhr.open("POST", url, true);
                xhr.setRequestHeader("Content-Type", "application/json");
                
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        const response = JSON.parse(xhr.responseText);
                        if (xhr.status >= 200 && xhr.status < 300) {
                            window.firebase.auth().currentUser.uid = response.localId;
                            window.firebase.auth().currentUser.email = response.email;
                            resolve({ user: window.firebase.auth().currentUser });
                        } else {
                            reject({ code: response.error.message.toLowerCase().replace(/_/g, '/') });
                        }
                    }
                };
                xhr.send(JSON.stringify({ email: email, password: password, returnSecureToken: true }));
            });
        }
    }

    // Хак: вытаскиваем чистый системный объект окна, если старый скрипт подменил XMLHttpRequest
    const MyXMLHttpRequest = window.XMLHttpRequest.__proto__.constructor === Function ? window.XMLHttpRequest : (function() {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const cleanXHR = iframe.contentWindow.XMLHttpRequest;
        document.body.removeChild(iframe);
        return cleanXHR;
    })();

    firebase.auth = function(app) {
        if (!firebase._authInstance) {
            firebase._authInstance = new AuthCompat(app || firebase.app());
        }
        return firebase._authInstance;
    };
})();

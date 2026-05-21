/**
 * Сверхлегкий REST-мост для аутентификации Firebase Auth
 * Абсолютная защита от глобальных перехватчиков прототипов (fetch / XHR)
 */
(function() {
    'use strict';
    if (typeof firebase === 'undefined') return;

    // ХАК ВЕКА: Создаем скрытый невидимый фрейм, чтобы вытащить оттуда КРИСТАЛЬНО ЧИСТЫЙ объект XMLHttpRequest, 
    // который старые закешированные скрипты в принципе не способны перехватить или изменить!
    const cleanAxiosXHR = (function() {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const cleanConstructor = iframe.contentWindow.XMLHttpRequest;
        document.body.removeChild(iframe);
        return cleanConstructor;
    })();

    class AuthCompat {
        constructor(app) {
            this.apiKey = app.options.apiKey;
            this.currentUser = { delete: function() { return Promise.resolve(); } };
        }

        // РЕГИСТРАЦИЯ
        createUserWithEmailAndPassword(email, password) {
            return new Promise((resolve, reject) => {
                const xhr = new cleanAxiosXHR(); // Используем кристально чистый сетевой объект!
                const url = "https://googleapis.com" + this.apiKey;
                
                xhr.open("POST", url, true);
                xhr.setRequestHeader("Content-Type", "application/json");
                
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (xhr.status >= 200 && xhr.status < 300) {
                                window.firebase.auth().currentUser.uid = response.localId;
                                window.firebase.auth().currentUser.email = response.email;
                                resolve({ user: window.firebase.auth().currentUser });
                            } else {
                                reject({ code: (response.error && response.error.message ? response.error.message.toLowerCase().replace(/_/g, '/') : "auth/unknown") });
                            }
                        } catch(e) {
                            reject({ code: "auth/server-error-or-cached-intercept" });
                        }
                    }
                };
                xhr.send(JSON.stringify({ email: email, password: password, returnSecureToken: true }));
            });
        }

        // ВХОД
        signInWithEmailAndPassword(email, password) {
            return new Promise((resolve, reject) => {
                const xhr = new cleanAxiosXHR(); // Используем кристально чистый сетевой объект!
                const url = "https://googleapis.com" + this.apiKey;
                
                xhr.open("POST", url, true);
                xhr.setRequestHeader("Content-Type", "application/json");
                
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (xhr.status >= 200 && xhr.status < 300) {
                                window.firebase.auth().currentUser.uid = response.localId;
                                window.firebase.auth().currentUser.email = response.email;
                                resolve({ user: window.firebase.auth().currentUser });
                            } else {
                                reject({ code: (response.error && response.error.message ? response.error.message.toLowerCase().replace(/_/g, '/') : "auth/unknown") });
                            }
                        } catch(e) {
                            reject({ code: "auth/server-error-or-cached-intercept" });
                        }
                    }
                };
                xhr.send(JSON.stringify({ email: email, password: password, returnSecureToken: true }));
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

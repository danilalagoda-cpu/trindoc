/**
 * Монолитное легкое ядро Firebase App + Встроенный REST-модуль Auth
 * ИСПРАВЛЕНО: Интерполяция строк, валидный домен, безопасный fetch и обработка ошибок
 */
(function() {
    'use strict';

    // Гарантированное извлечение КРИСТАЛЬНО ЧИСТОГО метода fetch из скрытого фрейма
    function getCleanFetch() {
        if (typeof document !== 'undefined' && document.documentElement) {
            try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                // Навешиваем на documentElement, так как body в head равен null
                document.documentElement.appendChild(iframe);
                const cleanFetchFn = iframe.contentWindow.fetch;
                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
                return cleanFetchFn;
            } catch(e) {
                return window.fetch;
            }
        }
        return window.fetch;
    }

    class FirebaseApp {
        constructor(options, name) {
            this.options = options;
            this.name = name || '[DEFAULT]';
            // Инициализируем currentUser в конструкторе для сохранения состояния игрока
            this._currentUser = { 
                uid: null, 
                email: null, 
                idToken: null,
                delete: function() { return Promise.resolve(); } 
            };
        }
        
        database() { 
            if (window.firebase && typeof window.firebase.database === 'function') {
                return window.firebase.database(this); 
            }
            throw new Error("Firebase Database module is not loaded");
        }
        
        auth() {
            return {
                currentUser: this._currentUser,
                
                _sendRequest: (action, email, password) => {
                    const cleanFetch = getCleanFetch();
                    
                    // ИСПРАВЛЕНО: Полный рабочий URL Firebase REST API с поддержкой знака $
                    const targetUrl = "https://identitytoolkit.googleapis.com/v1/accounts:" + action + "?key=" + this.options.apiKey;
                    
                    return cleanFetch(targetUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email, password: password, returnSecureToken: true })
                    })
                    .then(res => {
                        return res.json().then(data => {
                            if (!res.ok) {
                                // ИСПРАВЛЕНО: Безопасное чтение ошибки без риска вызвать падение скрипта
                                const rawMsg = data && data.error && data.error.message ? data.error.message : "UNKNOWN_ERROR";
                                const formattedCode = `auth/${rawMsg.toLowerCase().replace(/_/g, '-')}`;
                                throw { code: formattedCode };
                            }
                            return data;
                        });
                    })
                    .then(data => {
                        // Сохраняем данные успешной авторизации в объекте пользователя
                        this._currentUser.uid = data.localId;
                        this._currentUser.email = data.email;
                        this._currentUser.idToken = data.idToken; // Этот токен нужен для записи прогресса в базу данных
                        return { user: this._currentUser };
                    });
                },

                // Метод регистрации
                createUserWithEmailAndPassword(email, password) {
                    return this._sendRequest('signUp', email, password);
                },

                // Метод входа
                signInWithEmailAndPassword(email, password) {
                    return this._sendRequest('signInWithPassword', email, password);
                }
            };
        }
    }

    const appsMap = new Map();
    const firebaseNamespace = {
        initializeApp: function(options, config) {
            const name = (config && config.name) || '[DEFAULT]';
            if (appsMap.has(name)) return appsMap.get(name);
            const newApp = new FirebaseApp(options, name);
            appsMap.set(name, newApp);
            return newApp;
        },
        app: function(name) {
            const appName = name || '[DEFAULT]';
            if (!appsMap.has(appName)) throw new Error("No Firebase App created");
            return appsMap.get(appName);
        },
        // Поддержка быстрого вызова firebase.auth() напрямую
        auth: function() {
            const defaultApp = appsMap.get('[DEFAULT]');
            if (!defaultApp) throw new Error("No Firebase App created");
            return defaultApp.auth();
        }
    };

    // Регистрируем пространство имен глобально в браузере
    if (typeof window !== 'undefined') window.firebase = firebaseNamespace;
    if (typeof globalThis !== 'undefined') globalThis.firebase = firebaseNamespace;
})();

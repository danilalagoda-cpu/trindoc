/**
 * Монолитное легкое ядро Firebase App + Встроенный REST-мост Auth
 * Полная изоляция модулей от конфликтов с firebase-database.js
 * ИСПРАВЛЕНО: Безопасный контекст получения apiKey через targetApp
 */
(function() {
    'use strict';

    function getCleanFetch() {
        if (typeof document !== 'undefined' && document.documentElement) {
            try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
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
            return window.firebase.auth(this);
        }
    }

    const appsMap = new Map();
    let authInstance = null;

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
        auth: function(app) {
            if (!authInstance) {
                const targetApp = app || appsMap.get('[DEFAULT]');
                if (!targetApp) throw new Error("No Firebase App created");

                authInstance = {
                    currentUser: targetApp._currentUser,
                    
                    _sendRequest: (action, email, password) => {
                        const cleanFetch = getCleanFetch();
                        
                        // ИСПРАВЛЕНО: Берем apiKey напрямую из targetApp, избегая падения TypeError
                        const targetUrl = "https://identitytoolkit.googleapis.com/v1/accounts:" + action + "?key=" + targetApp.options.apiKey;
                        
                        return cleanFetch(targetUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: email, password: password, returnSecureToken: true })
                        })
                        .then(res => {
                            return res.json().then(data => {
                                if (!res.ok) {
                                    const rawMsg = data && data.error && data.error.message ? data.error.message : "UNKNOWN_ERROR";
                                    const formattedCode = "auth/" + rawMsg.toLowerCase().replace(/_/g, '-');
                                    throw { code: formattedCode };
                                }
                                return data;
                            });
                        })
                        .then(data => {
                            targetApp._currentUser.uid = data.localId;
                            targetApp._currentUser.email = data.email;
                            targetApp._currentUser.idToken = data.idToken; 
                            return { user: targetApp._currentUser };
                        });
                    },

                    createUserWithEmailAndPassword(email, password) {
                        return this._sendRequest('signUp', email, password);
                    },

                    signInWithEmailAndPassword(email, password) {
                        return this._sendRequest('signInWithPassword', email, password);
                    }
                };
            }
            return authInstance;
        }
    };

    if (typeof window !== 'undefined') window.firebase = firebaseNamespace;
    if (typeof globalThis !== 'undefined') globalThis.firebase = firebaseNamespace;
})();

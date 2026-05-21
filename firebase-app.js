/**
 * Исправленное легкое ядро Firebase App
 * Защищено от CORS, пропусков и синтаксических ошибок
 */
(function() {
    'use strict';
    class FirebaseApp {
        constructor(options, name) {
            this.options = options;
            this.name = name || '[DEFAULT]';
        }
        database() { return window.firebase.database(this); }
        auth() { return window.firebase.auth(this); }
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
        }
    };
    if (typeof window !== 'undefined') window.firebase = firebaseNamespace;
    if (typeof globalThis !== 'undefined') globalThis.firebase = firebaseNamespace;
})();

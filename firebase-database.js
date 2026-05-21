/**
 * Реальный сетевой мост для работы с Firebase Realtime Database через REST API Яндекса/Google
 * Работает без внешних тяжелых библиотек, защищен от CORS
 */
(function() {
    'use strict';
    if (typeof firebase === 'undefined') return;

    class DataSnapshotCompat {
        constructor(key, value) {
            this.key = key;
            this._value = value;
        }
        val() { return this._value; }
        exists() { return this._value !== null && this._value !== undefined; }
    }

    class ReferenceCompat {
        constructor(path, dbRef) {
            this.path = path || '';
            this.db = dbRef;
            this.key = this.path.split('/').pop() || null;
            this.listeners = [];
        }
        child(childPath) {
            return new ReferenceCompat(this.path + '/' + childPath, this.db);
        }
        getURL() {
            return this.db.url + '/' + this.path + '.json?auth=' + this.db.key;
        }
        set(value) {
            return fetch(this.getURL(), { method: 'PUT', body: JSON.stringify(value) }).then(r => r.json());
        }
        push(value) {
            const genId = 'id_' + Math.floor(Math.random() * 1000000);
            const newRef = this.child(genId);
            if (value !== undefined) newRef.set(value);
            return newRef;
        }
        update(value) {
            return fetch(this.getURL(), { method: 'PATCH', body: JSON.stringify(value) }).then(r => r.json());
        }
        once(type) {
            return fetch(this.getURL()).then(r => r.json()).then(data => new DataSnapshotCompat(this.key, data));
        }
        on(type, callback) {
            const run = () => {
                this.once().then(snap => { if (callback) callback(snap); });
            };
            run();
            const intervalId = setInterval(run, 3000); // Опрашиваем базу раз в 3 секунды для синхронизации онлайна
            window._fb_intervals = window._fb_intervals || [];
            window._fb_intervals.push(intervalId);
            return callback;
        }
        off() {
            if (window._fb_intervals) {
                window._fb_intervals.forEach(clearInterval);
                window._fb_intervals = [];
            }
        }
        transaction(updateFn, onComplete) {
            return this.once().then(snap => {
                const newVal = updateFn(snap.val());
                return this.set(newVal).then(() => {
                    const finalSnap = new DataSnapshotCompat(this.key, newVal);
                    if (onComplete) onComplete(null, true, finalSnap);
                    return { committed: true, snapshot: finalSnap };
                });
            });
        }
    }

    class DatabaseCompat {
        constructor(app) {
            this.url = app.options.databaseURL.replace(/\/$/, '');
            this.key = app.options.apiKey;
        }
        ref(path) { return new ReferenceCompat(path, this); }
    }

    firebase.database = function(app) {
        return new DatabaseCompat(app || firebase.app());
    };
})();

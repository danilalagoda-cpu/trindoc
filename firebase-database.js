(function() {
    'use strict';
    if (!window.firebase) return;
    
    class DatabaseRef {
        constructor(path) { this.path = path; }
        set(data, callback) {
            localStorage.setItem('trindoc_db_' + this.path, JSON.stringify(data));
            if (callback) callback(null);
            return Promise.resolve();
        }
        update(data, callback) {
            let current = localStorage.getItem('trindoc_db_' + this.path);
            let currentObj = current ? JSON.parse(current) : {};
            let merged = Object.assign({}, currentObj, data);
            localStorage.setItem('trindoc_db_' + this.path, JSON.stringify(merged));
            if (callback) callback(null);
            return Promise.resolve();
        }
        once(type) {
            let current = localStorage.getItem('trindoc_db_' + this.path);
            let val = current ? JSON.parse(current) : null;
            return Promise.resolve({ val: () => val });
        }
        remove() {
            localStorage.removeItem('trindoc_db_' + this.path);
            return Promise.resolve();
        }
    }

    window.firebase.database = function() {
        return {
            ref: function(path) { return new DatabaseRef(path); }
        };
    };
})();

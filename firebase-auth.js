(function() {
    'use strict';
    if (!window.firebase) return;

    class FirebaseAuth {
        constructor() { this.currentUser = { delete: function() { return Promise.resolve(); } }; }
        createUserWithEmailAndPassword(email, password) {
            let userKey = 'trindoc_user_' + btoa(email);
            if (localStorage.getItem(userKey)) {
                return Promise.reject({ code: "auth/email-already-in-use" });
            }
            let uid = 'uid_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(userKey, JSON.stringify({ password: password, uid: uid }));
            this.currentUser.uid = uid;
            return Promise.resolve({ user: { uid: uid } });
        }
        signInWithEmailAndPassword(email, password) {
            let userKey = 'trindoc_user_' + btoa(email);
            let account = localStorage.getItem(userKey);
            if (!account) return Promise.reject({ code: "auth/user-not-found" });
            let parsed = JSON.parse(account);
            if (parsed.password !== password) return Promise.reject({ code: "auth/wrong-password" });
            this.currentUser.uid = parsed.uid;
            return Promise.resolve({ user: { uid: parsed.uid } });
        }
    }

    window.firebase.auth = function() {
        if (!window.firebase._authInstance) {
            window.firebase._authInstance = new FirebaseAuth();
        }
        return window.firebase._authInstance;
    };
})();

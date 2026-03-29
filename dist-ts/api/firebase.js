"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.googleProvider = exports.auth = void 0;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const firebaseConfig = {
    apiKey: "AIzaSyDRRfZDyVMpq5t6BNCyEf6M4Dx1rcMAVLE",
    authDomain: "clarity-pm-assistant-gcp.firebaseapp.com",
    projectId: "clarity-pm-assistant-gcp",
    storageBucket: "clarity-pm-assistant-gcp.firebasestorage.app",
    messagingSenderId: "132738195526",
    appId: "1:132738195526:web:2e13fb7c6012e1204c6a47",
    measurementId: "G-WGBLXJMTS8"
};
const app = (0, app_1.initializeApp)(firebaseConfig);
exports.auth = (0, auth_1.getAuth)(app);
exports.googleProvider = new auth_1.GoogleAuthProvider();
exports.db = (0, firestore_1.initializeFirestore)(app, {
    localCache: (0, firestore_1.persistentLocalCache)({
        tabManager: (0, firestore_1.persistentMultipleTabManager)()
    })
});

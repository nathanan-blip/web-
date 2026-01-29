import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, updateDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';

const COLLECTION_NAME = 'users';
const STORAGE_KEYS = {
    IS_LOGGED_IN: 'isLoggedIn',
    CURRENT_USER: 'current_user' // We keep session local
};

let unsubscribeUsers = null;

// Initialize admin if not exists (One-time check usually, or use rules)
async function initAuthSystem() {
    const q = query(collection(db, COLLECTION_NAME), where("username", "==", "admin"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const adminUser = {
            username: 'admin',
            surname: 'admin',
            password: '123', // Still plaintext as per legacy
            email: 'admin@bbgun.com',
            phone: '000-000-0000',
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, COLLECTION_NAME), adminUser);
        console.log("Admin seeded to Firestore");
    }
}

// Real-time listener for Admin panel to see all members
function initUserListener(onUpdate) {
    if (unsubscribeUsers) unsubscribeUsers();

    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

    unsubscribeUsers = onSnapshot(q, (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        onUpdate(users);
    }, (error) => {
        console.error("Error listening to users:", error);
    });
}

async function registerUser(userData) {
    // Check if username exists
    const q = query(collection(db, COLLECTION_NAME), where("username", "==", userData.username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error('Username already exists');
    }

    if (userData.username === 'admin') {
        throw new Error('Username "admin" is reserved');
    }

    const newUser = {
        ...userData,
        role: 'member',
        createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, COLLECTION_NAME), newUser);
    return newUser;
}

async function loginUser(usernameInput, password) {
    // 1. Try to find by username
    const qUsername = query(collection(db, COLLECTION_NAME),
        where("username", "==", usernameInput),
        where("password", "==", password)
    );
    const snapshotUsername = await getDocs(qUsername);

    if (!snapshotUsername.empty) {
        const userDoc = snapshotUsername.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() };
        saveSession(user);
        return user;
    }

    // 2. If not found, try to find by email
    const qEmail = query(collection(db, COLLECTION_NAME),
        where("email", "==", usernameInput),
        where("password", "==", password)
    );
    const snapshotEmail = await getDocs(qEmail);

    if (!snapshotEmail.empty) {
        const userDoc = snapshotEmail.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() };
        saveSession(user);
        return user;
    }

    return null;
}

function saveSession(user) {
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

function getCurrentUser() {
    const userRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userRaw ? JSON.parse(userRaw) : null;
}

function updateAuthUI() {
    const isLoggedIn = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
    const currentUser = getCurrentUser();
    const authContainer = document.getElementById('auth-buttons');

    if (isLoggedIn === 'true' && currentUser && authContainer) {
        const isAdmin = currentUser.role === 'admin';

        authContainer.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="hidden md:flex flex-col items-end mr-2">
                    <span class="text-sm font-bold text-primary dark:text-white">${currentUser.username} ${currentUser.surname}</span>
                    <span class="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1 justify-end">
                        ${isAdmin ? '<span class="text-red-500 font-bold">ADMIN</span>' : 'Member'}
                    </span>
                </div>

                <div class="h-9 w-9 rounded-full ${isAdmin ? 'bg-red-600' : 'bg-primary'} text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    ${currentUser.username ? currentUser.username.charAt(0).toUpperCase() : '?'}
                </div>

                <div class="relative group">
                     <button class="flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                        <span class="material-symbols-outlined">more_vert</span>
                     </button>
                     <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-100 dark:border-neutral-700 py-1 hidden group-hover:block z-50">
                        ${isAdmin ? `
                        <a href="admin.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2">
                            <span class="material-symbols-outlined text-lg">admin_panel_settings</span>
                            จัดการระบบ
                        </a>
                        <div class="border-t border-gray-100 dark:border-neutral-700 my-1"></div>
                        ` : ''}
                        <button onclick="logout()" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                            <span class="material-symbols-outlined text-lg">logout</span>
                            ออกจากระบบ
                        </button>
                     </div>
                </div>
            </div>
        `;
    }
}

function logout() {
    if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
        localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        window.location.href = 'index.html';
    }
}

// Make globally available (keep for backward compatibility or simple console testing)
window.logout = logout;
window.authSystem = {
    initAuthSystem,
    initUserListener,
    registerUser,
    loginUser,
    getCurrentUser,
    updateAuthUI
};

export { initAuthSystem, initUserListener, registerUser, loginUser, getCurrentUser, updateAuthUI, logout };


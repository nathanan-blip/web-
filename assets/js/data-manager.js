export const STORAGE_KEYS = {
    USERS: 'users_db',
    PRODUCTS: 'products_db',
    ORDERS: 'orders_db',
    SESSION: 'current_session'
};

// --- Helper Functions ---
function getStorage(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error(`Error reading ${key}:`, e);
        return defaultValue;
    }
}

function setStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        // Dispatch event for real-time updates across tabs/windows
        window.dispatchEvent(new StorageEvent('storage', {
            key: key,
            newValue: JSON.stringify(data)
        }));
    } catch (e) {
        console.error(`Error writing ${key}:`, e);
    }
}

// --- Auth System ---
export const authSystem = {
    init: () => {
        let users = getStorage(STORAGE_KEYS.USERS);
        // Seed Admin if not exists
        if (!users.find(u => u.username === 'admin')) {
            const admin = {
                id: 'admin-' + Date.now(),
                username: 'admin',
                password: '123',
                role: 'admin',
                name: 'Admin',
                surname: 'User',
                email: 'admin@porninshop.com',
                createdAt: new Date().toISOString()
            };
            users.push(admin);
            setStorage(STORAGE_KEYS.USERS, users);
            console.log("Admin seeded");
        }
    },

    register: async (userData) => {
        let users = getStorage(STORAGE_KEYS.USERS);
        if (users.find(u => u.username === userData.username)) {
            throw new Error('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');
        }

        const newUser = {
            id: 'u-' + Date.now(),
            role: 'member',
            createdAt: new Date().toISOString(),
            ...userData
        };

        users.push(newUser);
        setStorage(STORAGE_KEYS.USERS, users);
        return newUser;
    },

    login: async (username, password) => {
        const users = getStorage(STORAGE_KEYS.USERS);
        const user = users.find(u =>
            (u.username === username || u.email === username) && u.password === password
        );

        if (user) {
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
            return user;
        }
        return null;
    },

    logout: () => {
        if (confirm('ต้องการออกจากระบบ?')) {
            localStorage.removeItem(STORAGE_KEYS.SESSION);
            window.location.href = 'index.html';
        }
    },

    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION));
    },

    updateAuthUI: () => {
        const user = authSystem.getCurrentUser();
        const container = document.getElementById('auth-buttons');
        if (!container) return;

        if (user) {
            const isAdmin = user.role === 'admin';
            container.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="hidden md:flex flex-col items-end mr-2">
                        <span class="text-sm font-bold text-primary dark:text-white">${user.username}</span>
                        <span class="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1 justify-end">
                            ${isAdmin ? '<span class="text-red-500 font-bold">ADMIN</span>' : 'Member'}
                        </span>
                    </div>

                    <div class="h-9 w-9 rounded-full ${isAdmin ? 'bg-red-600' : 'bg-primary'} text-white flex items-center justify-center font-bold text-lg shadow-sm">
                        ${user.username ? user.username.charAt(0).toUpperCase() : '?'}
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
                            <button onclick="dataManager.auth.logout()" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                <span class="material-symbols-outlined text-lg">logout</span>
                                ออกจากระบบ
                            </button>
                         </div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <a href="login.html" class="hidden md:flex text-sm font-bold text-primary dark:text-white hover:text-primary/70 transition-colors">
                    เข้าสู่ระบบ
                </a>
                <a href="register.html" class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-105 hover:bg-primary-hover shadow-lg">
                    <span class="material-symbols-outlined text-lg">person_add</span>
                    สมัครสมาชิก
                </a>
            `;
        }
    }
};

// --- Product System ---
export const productSystem = {
    getAll: () => {
        let products = getStorage(STORAGE_KEYS.PRODUCTS);
        // Auto-seed if empty for better user experience
        if (!products || products.length === 0) {
            const DEFAULT_PRODUCTS = [
                {
                    id: "1",
                    name: "ตำไทย (Som Tum Thai)",
                    category: "somtum",
                    price: 50,
                    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQR1Tz2SPBn3ZEKbYVqy3mUOWo1IiY1_iWtgQ&s",
                    desc: "ส้มตำไทยรสเด็ด เปรี้ยวหวานลงตัว มะละกอกรอบๆ ถั่วลิสงคั่วหอมๆ กุ้งแห้งตัวโตๆ รับประกันความแซ่บ!"
                },
                {
                    id: "2",
                    name: "ตำปูปลาร้า (Som Tum Pu Pla Ra)",
                    category: "somtum",
                    price: 60,
                    image: "https://1376delivery.com/productimages/6618_-.jpg",
                    desc: "ส้มตำปูปลาร้านัวๆ กลิ่นหอมยั่วๆ รสชาติอีสานแท้ๆ เผ็ดจัดจ้านถึงใจ ใครชอบนัวต้องลอง"
                },
                {
                    id: "3",
                    name: "ไก่ย่าง (Grilled Chicken)",
                    category: "side",
                    price: 120,
                    image: "https://tecnogasthai.com/wp-content/uploads/2024/06/4.-%E0%B8%AA%E0%B8%B9%E0%B8%95%E0%B8%A3%E0%B9%84%E0%B8%81%E0%B9%88%E0%B8%A2%E0%B9%88%E0%B8%B2%E0%B8%87%E0%B8%99%E0%B8%A1%E0%B8%AA%E0%B8%94.webp",
                    desc: "ไก่ย่างหมักเครื่องเทศสูตรพิเศษ ย่างถ่านหอมๆ หนังกรอบเนื้อนุ่ม จิ้มกับน้ำจิ้มแจ่วรสเด็ด เข้ากันสุดๆ"
                },
                {
                    id: "4",
                    name: "ข้าวเหนียว (Sticky Rice)",
                    category: "side",
                    price: 15,
                    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbqhAPupv6OGXkl8GJz9t_2WdGQJRFdMSsNg&s",
                    desc: "ข้าวเหนียวเขี้ยวงู นึ่งร้อนๆ นุ่มๆ หอมใบเตย ใส่กระติบเก็บความร้อน ทานคู่กับส้มตำฟินมาก"
                },
                {
                    id: "5",
                    name: "ลาบหมู (Spicy Minced Pork)",
                    category: "somtum",
                    price: 80,
                    image: "https://assets.unileversolutions.com/recipes-v2/117606.jpg",
                    desc: "ลาบหมูรสเด็ด หอมข้าวคั่วและพริกป่นทำเอง ปรุงรสด้วยมะนาวสด เผ็ดเปรี้ยวเค็ม หอมสมุนไพร"
                },
                {
                    id: "6",
                    name: "ตำข้าวโพด (Corn Som Tum)",
                    category: "somtum",
                    price: 70,
                    image: "https://recipe.sgethai.com/wp-content/uploads/2025/09/cover-19092025-thai-spicy-corn-salad_result.webp",
                    desc: "ตำข้าวโพดหวานกรอบ ตำไทยรสเปรี้ยวหวาน ไข่เค็มมันๆ อร่อยทานเพลิน เด็กทานได้ ผู้ใหญ่ทานดี"
                },
                {
                    id: "7",
                    name: "น้ำเก๊กฮวย (Chrysanthemum Tea)",
                    category: "drink",
                    price: 25,
                    image: "https://inwfile.com/s-gd/dezxyc.jpg",
                    desc: "น้ำเก๊กฮวยเย็นๆ หวานหอมชื่นใจ ดับกระหายคลายเผ็ดได้ดีเยี่ยม ต้มสดใหม่ทุกวัน"
                },
                {
                    id: "8",
                    name: "น้ำลำไย (Longan Juice)",
                    category: "drink",
                    price: 25,
                    image: "https://www.gourmetandcuisine.com/Images/cooking/recipes/recipe_1951detail.jpg",
                    desc: "น้ำลำไยพร้อมเนื้อลำไยเน้นๆ หวานเย็นชื่นใจ"
                }
            ];
            setStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
            products = DEFAULT_PRODUCTS;
        }
        return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    save: async (product) => {
        let products = getStorage(STORAGE_KEYS.PRODUCTS);

        if (product.id) {
            // Edit
            const index = products.findIndex(p => p.id === product.id);
            if (index !== -1) {
                products[index] = { ...products[index], ...product };
            }
        } else {
            // New
            const newProduct = {
                id: 'p-' + Date.now(),
                createdAt: new Date().toISOString(),
                ...product,
                price: Number(product.price)
            };
            products.push(newProduct);
        }
        setStorage(STORAGE_KEYS.PRODUCTS, products);
    },

    delete: async (id) => {
        let products = getStorage(STORAGE_KEYS.PRODUCTS);
        products = products.filter(p => p.id !== id);
        setStorage(STORAGE_KEYS.PRODUCTS, products);
    },

    restoreDefaults: async () => {
        const DEFAULT_PRODUCTS = [
            {
                id: "1",
                name: "ตำไทย (Som Tum Thai)",
                category: "somtum",
                price: 50,
                image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQR1Tz2SPBn3ZEKbYVqy3mUOWo1IiY1_iWtgQ&s",
                desc: "ส้มตำไทยรสเด็ด เปรี้ยวหวานลงตัว มะละกอกรอบๆ ถั่วลิสงคั่วหอมๆ กุ้งแห้งตัวโตๆ รับประกันความแซ่บ!"
            },
            {
                id: "2",
                name: "ตำปูปลาร้า (Som Tum Pu Pla Ra)",
                category: "somtum",
                price: 60,
                image: "https://1376delivery.com/productimages/6618_-.jpg",
                desc: "ส้มตำปูปลาร้านัวๆ กลิ่นหอมยั่วๆ รสชาติอีสานแท้ๆ เผ็ดจัดจ้านถึงใจ ใครชอบนัวต้องลอง"
            },
            {
                id: "3",
                name: "ไก่ย่าง (Grilled Chicken)",
                category: "side",
                price: 120,
                image: "https://tecnogasthai.com/wp-content/uploads/2024/06/4.-%E0%B8%AA%E0%B8%B9%E0%B8%95%E0%B8%A3%E0%B9%84%E0%B8%81%E0%B9%88%E0%B8%A2%E0%B9%88%E0%B8%B2%E0%B8%87%E0%B8%99%E0%B8%A1%E0%B8%AA%E0%B8%94.webp",
                desc: "ไก่ย่างหมักเครื่องเทศสูตรพิเศษ ย่างถ่านหอมๆ หนังกรอบเนื้อนุ่ม จิ้มกับน้ำจิ้มแจ่วรสเด็ด เข้ากันสุดๆ"
            },
            {
                id: "4",
                name: "ข้าวเหนียว (Sticky Rice)",
                category: "side",
                price: 15,
                image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbqhAPupv6OGXkl8GJz9t_2WdGQJRFdMSsNg&s",
                desc: "ข้าวเหนียวเขี้ยวงู นึ่งร้อนๆ นุ่มๆ หอมใบเตย ใส่กระติบเก็บความร้อน ทานคู่กับส้มตำฟินมาก"
            },
            {
                id: "5",
                name: "ลาบหมู (Spicy Minced Pork)",
                category: "somtum",
                price: 80,
                image: "https://assets.unileversolutions.com/recipes-v2/117606.jpg",
                desc: "ลาบหมูรสเด็ด หอมข้าวคั่วและพริกป่นทำเอง ปรุงรสด้วยมะนาวสด เผ็ดเปรี้ยวเค็ม หอมสมุนไพร"
            },
            {
                id: "6",
                name: "ตำข้าวโพด (Corn Som Tum)",
                category: "somtum",
                price: 70,
                image: "https://recipe.sgethai.com/wp-content/uploads/2025/09/cover-19092025-thai-spicy-corn-salad_result.webp",
                desc: "ตำข้าวโพดหวานกรอบ ตำไทยรสเปรี้ยวหวาน ไข่เค็มมันๆ อร่อยทานเพลิน เด็กทานได้ ผู้ใหญ่ทานดี"
            },
            {
                id: "7",
                name: "น้ำเก๊กฮวย (Chrysanthemum Tea)",
                category: "drink",
                price: 25,
                image: "https://inwfile.com/s-gd/dezxyc.jpg",
                desc: "น้ำเก๊กฮวยเย็นๆ หวานหอมชื่นใจ ดับกระหายคลายเผ็ดได้ดีเยี่ยม ต้มสดใหม่ทุกวัน"
            },
            {
                id: "8",
                name: "น้ำลำไย (Longan Juice)",
                category: "drink",
                price: 25,
                image: "https://www.gourmetandcuisine.com/Images/cooking/recipes/recipe_1951detail.jpg",
                desc: "น้ำลำไยพร้อมเนื้อลำไยเน้นๆ หวานเย็นชื่นใจ"
            }
        ];
        setStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    }
};

// --- Order System ---
export const orderSystem = {
    getAll: () => {
        return getStorage(STORAGE_KEYS.ORDERS).sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    getByUser: (username) => {
        return orderSystem.getAll().filter(o => o.user === username);
    },

    create: async (orderData) => {
        let orders = getStorage(STORAGE_KEYS.ORDERS);
        const newOrder = {
            id: 'ORD-' + Date.now().toString().slice(-6),
            date: new Date().toISOString(), // Use ISO for sorting, format for display
            status: 'รอตรวจสอบ',
            ...orderData
        };
        orders.push(newOrder);
        setStorage(STORAGE_KEYS.ORDERS, orders);
        return newOrder;
    },

    updateStatus: async (orderId, status) => {
        let orders = getStorage(STORAGE_KEYS.ORDERS);
        const index = orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            orders[index].status = status;
            setStorage(STORAGE_KEYS.ORDERS, orders);
        }
    },

    delete: async (orderId) => {
        let orders = getStorage(STORAGE_KEYS.ORDERS);
        orders = orders.filter(o => o.id !== orderId);
        setStorage(STORAGE_KEYS.ORDERS, orders);
    }
};


// --- Global Export ---
window.dataManager = {
    auth: authSystem,
    products: productSystem,
    orders: orderSystem
};

// Auto Init
authSystem.init();
document.addEventListener('DOMContentLoaded', () => {
    authSystem.updateAuthUI();
});

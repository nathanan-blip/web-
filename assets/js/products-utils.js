import { db } from './firebase-config.js';
import { collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { DEFAULT_PRODUCTS } from './products-data.js';

const COLLECTION_NAME = 'products';

let unsubscribe = null;

function initProductListener(onUpdate) {
    if (unsubscribe) {
        unsubscribe();
    }

    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

    unsubscribe = onSnapshot(q, (snapshot) => {
        const products = [];
        snapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        onUpdate(products);
    }, (error) => {
        console.error("Error listening to products:", error);
    });
}

async function saveProduct(product) {
    try {
        const productData = { ...product };

        if (product.id && typeof product.id === 'string' && product.id.length > 10) {
            // Update existing
            // Note: We check length > 10 to distinguish from legacy numeric IDs if any remain, 
            // though Firestore IDs are strings.
            const docRef = doc(db, COLLECTION_NAME, product.id);
            // Remove id from data to avoid duplicating it in fields
            delete productData.id;
            await updateDoc(docRef, productData);
            console.log("Product updated");
        } else {
            // Add new
            // Ensure numeric fields are numbers
            productData.price = Number(productData.price);
            productData.createdAt = new Date().toISOString();
            delete productData.id; // Let Firestore generate ID

            await addDoc(collection(db, COLLECTION_NAME), productData);
            console.log("Product added");
        }
    } catch (e) {
        console.error("Error saving product: ", e);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + e.message);
    }
}

async function deleteProduct(id) {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        console.log("Product deleted");
    } catch (e) {
        console.error("Error deleting product: ", e);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล: " + e.message);
    }
}

async function restoreDefaultProducts() {
    try {
        const promises = DEFAULT_PRODUCTS.map(product => saveProduct(product));
        await Promise.all(promises);
        return true;
    } catch (error) {
        console.error("Error restoring products:", error);
        throw error;
    }
}

export { initProductListener, saveProduct, deleteProduct, restoreDefaultProducts };

// Attach to window for legacy scripts (wrapper)
window.productSystem = {
    // We can't return products synchronously anymore. 
    // The UI must depend on initProductListener callback.
    initProductListener,
    saveProduct,
    deleteProduct
};


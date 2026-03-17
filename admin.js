// Use shared data from shared.js
let menu = JSON.parse(localStorage.getItem('foody_menu'));
if (!Array.isArray(menu) || menu.length === 0) {
    menu = window.defaultMenu || [];
    localStorage.setItem('foody_menu', JSON.stringify(menu));
}

let catEmojis = JSON.parse(localStorage.getItem('foody_cat_emojis'));
if (!catEmojis || Object.keys(catEmojis).length === 0) {
    catEmojis = window.defaultCatEmojis;
    localStorage.setItem('foody_cat_emojis', JSON.stringify(catEmojis));
}

// restaurantConfig is already loaded and merged in shared.js
let restaurantConfig = window.restaurantConfig;

// Default admin credentials (change these!)
let promoIds;
try {
    promoIds = JSON.parse(localStorage.getItem('foody_promo_ids'));
    if (!Array.isArray(promoIds)) promoIds = [];
} catch (e) {
    promoIds = [];
}

// Credentials with fallback to defaults
let adminAuth = JSON.parse(localStorage.getItem('foody_admin_creds')) || { user: 'admin', pass: 'foody2026' };

document.addEventListener('DOMContentLoaded', () => {
    // Bypass login screen
    sessionStorage.setItem('foody_admin_auth', 'true');
    showDashboard();

    // Allow Enter key on login
    document.getElementById('loginPass').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') attemptLogin();
    });
    document.getElementById('loginUser').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('loginPass').focus();
    });
});

function attemptLogin() {
    sessionStorage.setItem('foody_admin_auth', 'true');
    showDashboard();
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminSidebar').style.display = 'flex';
    document.getElementById('adminMain').style.display = 'block';
    refreshUI();
    initForms();
}

function adminLogout() {
    sessionStorage.removeItem('foody_admin_auth');
    location.reload();
}

function refreshUI() {
    renderMenuTable();
    renderCatTable();
    renderSuperCatTable();
    populateCatDropdown();
    initWifiForm();
    initLandingPageForm();
    initSuperCatForm();
    initSecurityForm();
    initHoursForm();
    initGalleryForm();
    renderGalleryAdmin();
    updateStats();
}

function renderMenuTable() {
    const tbody = document.querySelector('#menuTable tbody');
    if (!tbody) return;
    try {
        tbody.innerHTML = menu.map(item => {
            // Fix image fallback logic
            const images = (item.images && item.images.length > 0) ? item.images : (item.img ? [item.img] : []);
            const firstImg = images.length > 0 ? images[0] : '';
            const safePrice = Number(item.price) || 0;
            const likeCount = (typeof window.getLikeCount === 'function') ? window.getLikeCount(item.id) : 0;
            return `
            <tr>
                <td>
                    <div style="width:50px; height:50px; background:#eee; border-radius:8px; overflow:hidden; border:1px solid #ddd; cursor:pointer" onclick="openImageModal(${item.id})">
                        ${firstImg ? `<img src="${firstImg}" style="width:100%; height:100%; object-fit:cover" onerror="this.src='https://via.placeholder.com/50?text=Error'">` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:20px">📷</div>'}
                    </div>
                    ${images.length > 0 ? `<small style="display:block;text-align:center;font-size:10px;color:var(--primary);cursor:pointer;margin-top:2px" onclick="openImageModal(${item.id})">${images.length} image(s)</small>` : ''}
                </td>
                <td><strong>${item.name || 'UnnamedItem'}</strong><br><small style="color:#888">${item.desc || ''}</small></td>
                <td>${item.cat || 'Uncategorized'}</td>
                <td>MAD ${safePrice.toFixed(2)}</td>
                <td><span style="color:#e01e2f">❤️</span> ${likeCount}</td>
                <td><span class="promo-star action-btn ${promoIds.includes(item.id) ? 'promo-active' : ''}" onclick="togglePromo(${item.id})">⭐</span></td>
                <td><span class="promo-star action-btn ${item.featured ? 'promo-active' : ''}" onclick="toggleFeatured(${item.id})" style="filter: ${item.featured ? 'none' : 'grayscale(1)'}; opacity: ${item.featured ? '1' : '0.5'};">✨</span></td>
                <td>
                    <button class="action-btn" onclick="editItem(${item.id})" title="Modifier les détails">✏️</button>
                    <button class="action-btn" onclick="openImageModal(${item.id})" title="Gérer les images">🖼️</button>
                    <button class="action-btn" onclick="deleteItem(${item.id})">🗑️</button>
                </td>
            </tr>`;
        }).join('');
    } catch (e) {
        console.error('Render Table Error:', e);
        tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Erreur de chargement des produits. Veuillez cliquer sur 'Reset All Data'.</td></tr>`;
    }
}

let editingItemId = null;

function editItem(id) {
    const item = menu.find(m => m.id == id);
    if (!item) return;

    editingItemId = id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCat').value = item.cat;
    document.getElementById('itemDesc').value = item.desc;
    document.getElementById('itemIngredients').value = (item.ingredients || []).join(', ');
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemFeatured').checked = item.featured || false;

    // Populate image URL field — only show URL images, not base64 blobs
    const existingImages = item.images || (item.img ? [item.img] : []);
    const urlImages = existingImages.filter(img => !img.startsWith('data:'));
    const imgInput = document.getElementById('itemImg');
    if (imgInput) imgInput.value = urlImages.join('\n');

    // Change form title and button
    document.querySelector('#menu h3').textContent = "Modifier le produit: " + item.name;
    document.querySelector('#foodForm .primary-btn').textContent = "💾 Mettre à jour le produit";

    // Scroll to form
    document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
}

function resetFoodForm() {
    editingItemId = null;
    document.getElementById('foodForm').reset();
    document.getElementById('itemFeatured').checked = false;
    document.querySelector('#menu h3').textContent = "Add New Food Item";
    document.querySelector('#foodForm .primary-btn').textContent = "➕ Save Product";
}

function initForms() {
    document.getElementById('foodForm').onsubmit = async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('itemFile');
        const urlInput = document.getElementById('itemImg').value;

        // Parse URL images — split by NEWLINE only (not comma, which breaks base64)
        let images = urlInput.split(/\n/).map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('data:'));

        // Add file uploads (compressed)
        if (fileInput.files.length > 0) {
            for (let file of fileInput.files) {
                try {
                    const base64 = await compressImage(file);
                    images.push(base64);
                } catch (err) {
                    console.error('Image compression failed:', err);
                    showToast('⚠️ Image trop grande ou format non supporté');
                }
            }
        }

        // When editing, keep existing base64 images that were already stored
        if (editingItemId) {
            const existingItem = menu.find(m => m.id == editingItemId);
            if (existingItem && images.length === 0) {
                // No new images provided — keep existing ones
                images = existingItem.images || (existingItem.img ? [existingItem.img] : []);
            } else if (existingItem && fileInput.files.length === 0) {
                // Only URL changes, no file uploads — use the new URLs
                // (images already has the URLs from above)
            }
            // If file uploads were added, those are already in images
        }

        const ingredients = document.getElementById('itemIngredients').value.split(',').map(s => s.trim()).filter(s => s.length > 0);

        if (editingItemId) {
            const index = menu.findIndex(m => m.id == editingItemId);
            if (index !== -1) {
                menu[index] = {
                    ...menu[index],
                    name: document.getElementById('itemName').value,
                    cat: document.getElementById('itemCat').value,
                    desc: document.getElementById('itemDesc').value,
                    ingredients: ingredients,
                    price: parseFloat(document.getElementById('itemPrice').value),
                    images: images,
                    img: images[0] || '',
                    featured: document.getElementById('itemFeatured').checked
                };
            }
            showToast('Produit mis à jour avec succès !');
        } else {
            const newItem = {
                id: Date.now(),
                name: document.getElementById('itemName').value,
                cat: document.getElementById('itemCat').value,
                desc: document.getElementById('itemDesc').value,
                ingredients: ingredients,
                price: parseFloat(document.getElementById('itemPrice').value),
                images: images,
                img: images[0] || '',
                featured: document.getElementById('itemFeatured').checked
            };
            menu.push(newItem);
            showToast('Produit ajouté avec succès !');
        }

        saveAndRefresh();
        resetFoodForm();
    };

    document.getElementById('catForm').onsubmit = (e) => {
        e.preventDefault();
        catEmojis[document.getElementById('catName').value] = document.getElementById('catEmoji').value;
        saveAndRefresh();
        e.target.reset();
        showToast('Catégorie ajoutée !');
    };

    document.getElementById('wifiForm').onsubmit = (e) => {
        e.preventDefault();
        restaurantConfig.wifi.name = document.getElementById('wifiSSID').value;
        restaurantConfig.wifi.code = document.getElementById('wifiPassInput').value;
        saveAndRefresh();
        showToast('WiFi mis à jour !');
    };

    document.getElementById('landingPageForm').onsubmit = (e) => {
        e.preventDefault();
        restaurantConfig.location.address = document.getElementById('lpAddress').value;
        restaurantConfig.location.url = document.getElementById('lpMapUrl').value;
        restaurantConfig.phone = document.getElementById('lpPhone').value;
        restaurantConfig.socials.instagram = document.getElementById('lpInsta').value;
        restaurantConfig.socials.facebook = document.getElementById('lpFb').value;
        restaurantConfig.socials.tiktok = document.getElementById('lpTiktok').value;
        restaurantConfig.socials.tripadvisor = document.getElementById('lpTrip').value;
        saveAndRefresh();
        showToast('Landing Page info sauvegardée !');
    };

    document.getElementById('superCatForm').onsubmit = (e) => {
        e.preventDefault();
        const selectedCats = Array.from(document.querySelectorAll('.sc-cat-check:checked')).map(cb => cb.value);
        const name = document.getElementById('scName').value;
        const emoji = document.getElementById('scEmoji').value;
        const desc = document.getElementById('scDesc').value;
        const time = document.getElementById('scTime').value;

        const id = name.toLowerCase().replace(/\s+/g, '_');
        const existingIdx = restaurantConfig.superCategories.findIndex(sc => sc.id === id);

        const newSC = { id, name, emoji, desc, time, cats: selectedCats };

        if (existingIdx !== -1) {
            restaurantConfig.superCategories[existingIdx] = newSC;
        } else {
            restaurantConfig.superCategories.push(newSC);
        }

        saveAndRefresh();
        e.target.reset();
        showToast('Super Catégorie sauvegardée !');
    };
}

function initLandingPageForm() {
    const config = restaurantConfig;
    document.getElementById('lpAddress').value = config.location.address;
    document.getElementById('lpMapUrl').value = config.location.url;
    document.getElementById('lpPhone').value = config.phone;
    document.getElementById('lpInsta').value = config.socials.instagram;
    document.getElementById('lpFb').value = config.socials.facebook;
    document.getElementById('lpTiktok').value = config.socials.tiktok;
    document.getElementById('lpTrip').value = config.socials.tripadvisor || '';
}

function initSuperCatForm() {
    const container = document.getElementById('scCatsList');
    if (!container) return;
    const cats = Object.keys(catEmojis);
    container.innerHTML = cats.map(cat => `
        <label style="display:flex; align-items:center; gap:5px; background:#f0f0f0; padding:5px 10px; border-radius:20px; font-size:0.8rem; cursor:pointer;">
            <input type="checkbox" value="${cat}" class="sc-cat-check" style="width:auto; margin:0;">
            ${cat}
        </label>
    `).join('');
}

function renderSuperCatTable() {
    const tbody = document.querySelector('#superCatTable tbody');
    if (!tbody) return;
    tbody.innerHTML = restaurantConfig.superCategories.map(sc => `
        <tr>
            <td>${sc.emoji}</td>
            <td><strong>${sc.name}</strong><br><small>${sc.time || ''}</small></td>
            <td>${sc.cats.join(', ')}</td>
            <td>
                <button class="action-btn" onclick="editSuperCat('${sc.id}')">✏️</button>
                <button class="action-btn" onclick="deleteSuperCat('${sc.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function editSuperCat(id) {
    const sc = restaurantConfig.superCategories.find(s => s.id === id);
    if (!sc) return;
    document.getElementById('scName').value = sc.name;
    document.getElementById('scEmoji').value = sc.emoji;
    document.getElementById('scDesc').value = sc.desc;
    document.getElementById('scTime').value = sc.time || '';

    const checks = document.querySelectorAll('.sc-cat-check');
    checks.forEach(cb => cb.checked = sc.cats.includes(cb.value));

    document.getElementById('supercategories').scrollIntoView({ behavior: 'smooth' });
}

function deleteSuperCat(id) {
    if (confirm('Supprimer cette super catégorie ?')) {
        restaurantConfig.superCategories = restaurantConfig.superCategories.filter(s => s.id !== id);
        saveAndRefresh();
    }
}

function initSecurityForm() {
    const form = document.getElementById('securityForm');
    document.getElementById('adminNewUser').value = adminAuth.user;

    form.onsubmit = (e) => {
        e.preventDefault();
        const newUser = document.getElementById('adminNewUser').value.trim();
        const newPass = document.getElementById('adminNewPass').value;
        const confirmPass = document.getElementById('adminConfirmPass').value;

        if (newPass && newPass !== confirmPass) {
            return alert('❌ Les mots de passe ne correspondent pas !');
        }

        adminAuth.user = newUser;
        if (newPass) adminAuth.pass = newPass;

        localStorage.setItem('foody_admin_creds', JSON.stringify(adminAuth));
        showToast('🔒 Identifiants mis à jour avec succès !');
        form.reset();
        document.getElementById('adminNewUser').value = adminAuth.user;
    };
}

// Smart image compressor — auto-resize & compress any image to fit storage
function compressImage(file, maxWidth = 800, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width;
                let h = img.height;

                // Scale down proportionally
                if (w > maxWidth) {
                    h = Math.round(h * maxWidth / w);
                    w = maxWidth;
                }

                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                // Try progressively lower quality if result is too big
                let result = canvas.toDataURL('image/jpeg', quality);

                // If result > 200KB, reduce quality
                if (result.length > 200000) {
                    result = canvas.toDataURL('image/jpeg', 0.5);
                }
                // If still > 200KB, reduce dimensions too
                if (result.length > 200000) {
                    const smallCanvas = document.createElement('canvas');
                    const sw = Math.min(w, 400);
                    const sh = Math.round(h * sw / w);
                    smallCanvas.width = sw;
                    smallCanvas.height = sh;
                    smallCanvas.getContext('2d').drawImage(img, 0, 0, sw, sh);
                    result = smallCanvas.toDataURL('image/jpeg', 0.5);
                }

                resolve(result);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Keep old name as alias so existing form code still works
const toBase64 = (file) => compressImage(file);

function deleteItem(id) { if (confirm('Supprimer cet article ?')) { menu = menu.filter(m => m.id != id); promoIds = promoIds.filter(pid => pid != id); saveAndRefresh(); } }
function togglePromo(id) {
    if (promoIds.includes(id)) {
        promoIds = promoIds.filter(pid => pid != id);
    } else {
        promoIds.push(id);
    }
    saveAndRefresh();
}
function toggleFeatured(id) {
    const item = menu.find(m => m.id == id);
    if (item) {
        item.featured = !item.featured;
        saveAndRefresh();
    }
}
function forceSaveChanges() {
    try {
        // AUTO-COMMIT: If user is editing a food item, submit the form first
        if (editingItemId) {
            const foodForm = document.getElementById('foodForm');
            if (foodForm) {
                // Trigger form submission programmatically to commit the edit
                foodForm.requestSubmit();
                // requestSubmit triggers the onsubmit handler which calls saveAndRefresh(),
                // so we just need the visual feedback here
                const btn = document.getElementById('floatSaveBtn');
                if (btn) {
                    btn.classList.add('saved');
                    btn.innerHTML = '<span style="font-size:1.3rem;">✅</span><span>Sauvegardé !</span>';
                    setTimeout(() => {
                        btn.classList.remove('saved');
                        btn.innerHTML = '<span style="font-size:1.3rem;">💾</span><span>Sauvegarder</span>';
                    }, 2500);
                }
                showToast('✅ Produit mis à jour et sauvegardé !');
                return; // form onsubmit already called saveAndRefresh()
            }
        }

        // Save all data
        localStorage.setItem('foody_menu', JSON.stringify(menu));
        localStorage.setItem('foody_cat_emojis', JSON.stringify(catEmojis));
        localStorage.setItem('foody_config', JSON.stringify(restaurantConfig));
        localStorage.setItem('foody_promo_ids', JSON.stringify(promoIds));

        // Save hours if present
        const hoursData = window._pendingHours;
        if (hoursData) {
            localStorage.setItem('foody_hours', JSON.stringify(hoursData));
        }

        refreshUI();

        // Visual feedback on float button
        const btn = document.getElementById('floatSaveBtn');
        if (btn) {
            btn.classList.add('saved');
            btn.innerHTML = '<span style="font-size:1.3rem;">✅</span><span>Sauvegardé !</span>';
            setTimeout(() => {
                btn.classList.remove('saved');
                btn.innerHTML = '<span style="font-size:1.3rem;">💾</span><span>Sauvegarder</span>';
            }, 2500);
        }

        showToast('✅ Toutes les modifications ont été enregistrées !');
    } catch (e) {
        console.error('Save Error:', e);
        alert('❌ Erreur de sauvegarde. L\'image est peut-être trop grande - essayez une URL à la place.');
    }
}
function saveAndRefresh() {
    try {
        localStorage.setItem('foody_menu', JSON.stringify(menu));
        localStorage.setItem('foody_cat_emojis', JSON.stringify(catEmojis));
        localStorage.setItem('foody_config', JSON.stringify(restaurantConfig));
        localStorage.setItem('foody_promo_ids', JSON.stringify(promoIds));
        refreshUI();
    } catch (e) {
        console.error('Storage Error:', e);
        alert('❌ Erreur de sauvegarde : L\'image est probablement trop grande (Base64). Essayez une image plus petite ou un lien URL.');
    }
}
function showToast(msg) { const t = document.getElementById('adminToast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
function showSection(id, btn) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');

    // Auto-close sidebar on mobile after choosing
    if (window.innerWidth <= 992) {
        toggleSidebar();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
}
function populateCatDropdown() { document.getElementById('itemCat').innerHTML = Object.keys(catEmojis).map(c => `<option value="${c}">${c}</option>`).join(''); }
function renderCatTable() { document.querySelector('#catTable tbody').innerHTML = Object.keys(catEmojis).map(cat => `<tr><td>${catEmojis[cat]}</td><td><strong>${cat}</strong></td><td>${menu.filter(m => m.cat === cat).length} items</td><td><button class="action-btn" onclick="deleteCat('${cat}')">🗑️</button></td></tr>`).join(''); }
function deleteCat(cat) { if (menu.some(m => m.cat === cat)) return alert('Supprimez d\'abord les produits de cette catégorie !'); delete catEmojis[cat]; saveAndRefresh(); }
function initWifiForm() {
    document.getElementById('wifiSSID').value = restaurantConfig.wifi.name;
    document.getElementById('wifiPassInput').value = restaurantConfig.wifi.code;
    document.getElementById('hintS').textContent = restaurantConfig.wifi.name;
    document.getElementById('hintP').textContent = restaurantConfig.wifi.code;
}
function updateStats() { document.getElementById('stat-products').textContent = menu.length; document.getElementById('stat-cats').textContent = Object.keys(catEmojis).length; document.getElementById('stat-promo').textContent = promoIds.length; }

// IMAGE MODAL LOGIC
let currentEditingId = null;

function openImageModal(id) {
    currentEditingId = id;
    const item = menu.find(m => m.id == id); // Use == for safety
    if (!item) return;

    // Ensure item has an images array
    if (!item.images) {
        item.images = item.img ? [item.img] : [];
    }

    document.getElementById('imgModalItemName').textContent = item.name;
    document.getElementById('imageModal').style.display = 'flex';
    renderModalImages();
}

function closeImageModal() {
    document.getElementById('imageModal').style.display = 'none';
    currentEditingId = null;
}

function renderModalImages() {
    const item = menu.find(m => m.id == currentEditingId);
    if (!item) return;
    const grid = document.getElementById('currentImagesGrid');
    const images = item.images || (item.img ? [item.img] : []);

    grid.innerHTML = images.map((img, index) => `
        <div style="position:relative; aspect-ratio:1; border-radius:10px; overflow:hidden; border:1px solid #ddd;">
            <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
            <button onclick="deleteModalImage(${index})" style="position:absolute; top:5px; right:5px; background:rgba(255,0,0,0.8); color:#fff; border:none; border-radius:5px; cursor:pointer; padding:2px 6px; font-size:12px;">✕</button>
        </div>
    `).join('') + (images.length === 0 ? '<p style="grid-column: span 3; color:#888; text-align:center;">Aucune image pour le moment.</p>' : '');
}

async function handleModalImageUpload(input) {
    if (!input.files || input.files.length === 0) return;
    const item = menu.find(m => m.id == currentEditingId);
    if (!item) return;

    if (!item.images) item.images = item.img ? [item.img] : [];

    for (let file of input.files) {
        const base64 = await toBase64(file);
        item.images.push(base64);
    }

    // SYNC: Ensure main img is set to the first image for the main page cards
    if (item.images.length > 0) item.img = item.images[0];

    input.value = '';
    saveAndRefresh();
    renderModalImages();
    showToast('Image(s) ajoutée(s)!');
}

function addModalImageUrl() {
    const url = document.getElementById('modalImgUrl').value.trim();
    if (!url) return;
    const item = menu.find(m => m.id == currentEditingId);
    if (!item) return;

    if (!item.images) item.images = item.img ? [item.img] : [];
    item.images.push(url);

    // SYNC: Keep main img updated
    if (item.images.length > 0) item.img = item.images[0];

    document.getElementById('modalImgUrl').value = '';
    saveAndRefresh();
    renderModalImages();
    showToast('Image ajoutée via URL!');
}

function deleteModalImage(index) {
    const item = menu.find(m => m.id == currentEditingId);
    if (!item || !item.images) return;

    item.images.splice(index, 1);

    // SYNC: Keep main img updated after deletion
    item.img = item.images.length > 0 ? item.images[0] : '';

    saveAndRefresh();
    renderModalImages();
    showToast('Image supprimée');
}

function resetDefaults() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser TOUTES les données du menu et de la configuration aux valeurs par défaut ? Cette action est irréversible.')) {
        localStorage.removeItem('foody_menu');
        localStorage.removeItem('foody_cat_emojis');
        localStorage.removeItem('foody_config');
        localStorage.removeItem('foody_super_cats');
        localStorage.removeItem('foody_promo_ids');
        localStorage.removeItem('foody_hours');
        localStorage.removeItem('foody_hours_note');
        location.reload();
    }
}

// ═══════════════════════ HOURS MANAGEMENT ═══════════════════════
const HOUR_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function initHoursForm() {
    const hours = JSON.parse(localStorage.getItem('foody_hours')) || window.defaultHours;
    const note = localStorage.getItem('foody_hours_note') || window.defaultHoursNote || '';

    // Populate inputs
    HOUR_KEYS.forEach((key, i) => {
        const h = hours[i];
        const openEl = document.getElementById(`h_${key}_open`);
        const closeEl = document.getElementById(`h_${key}_close`);
        const hlEl = document.getElementById(`h_${key}_hl`);
        if (openEl) openEl.value = h.open || '11:00';
        if (closeEl) closeEl.value = h.close || '23:00';
        if (hlEl) hlEl.checked = h.highlight || false;
    });

    const noteEl = document.getElementById('hoursNote');
    if (noteEl) noteEl.value = note;

    // Form submit
    const form = document.getElementById('hoursForm');
    if (form) {
        form.onsubmit = function (e) {
            e.preventDefault();
            const updatedHours = window.defaultHours.map((def, i) => {
                const key = HOUR_KEYS[i];
                return {
                    day: def.day,
                    i18n: def.i18n,
                    open: document.getElementById(`h_${key}_open`).value || def.open,
                    close: document.getElementById(`h_${key}_close`).value || def.close,
                    highlight: document.getElementById(`h_${key}_hl`).checked
                };
            });
            const updatedNote = document.getElementById('hoursNote').value.trim();
            localStorage.setItem('foody_hours', JSON.stringify(updatedHours));
            localStorage.setItem('foody_hours_note', updatedNote);
            showToast('✅ Horaires mis à jour !');
        };
    }
}

// ═══════════════════════ GALLERY MANAGEMENT ═══════════════════════

function initGalleryForm() {
    const form = document.getElementById('galleryForm');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('galleryFileInput');
        const urlInput = document.getElementById('galleryUrlInput');

        if (!restaurantConfig.gallery) restaurantConfig.gallery = [];

        // Handle URLs
        if (urlInput.value.trim()) {
            restaurantConfig.gallery.push(urlInput.value.trim());
            urlInput.value = '';
        }

        // Handle Files
        if (fileInput.files.length > 0) {
            for (let file of fileInput.files) {
                const base64 = await toBase64(file);
                restaurantConfig.gallery.push(base64);
            }
            fileInput.value = '';
        }

        saveAndRefresh();
        renderGalleryAdmin();
        showToast('🖼️ Images ajoutées à la galerie !');
    };
}

function renderGalleryAdmin() {
    const grid = document.getElementById('galleryAdminGrid');
    if (!grid) return;

    const images = restaurantConfig.gallery || [];

    grid.innerHTML = images.map((img, index) => `
        <div style="position:relative; aspect-ratio:1.5; border-radius:12px; overflow:hidden; border:1px solid #ddd; background:#eee;">
            <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
            <button onclick="deleteGalleryImage(${index})" style="position:absolute; top:8px; right:8px; background:rgba(255,0,0,0.8); color:#fff; border:none; border-radius:6px; cursor:pointer; padding:4px 8px; font-size:14px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2);">✕</button>
        </div>
    `).join('') + (images.length === 0 ? '<p style="grid-column: 1/-1; color:#888; text-align:center; padding:40px; border:2px dashed #eee; border-radius:15px;">La galerie est vide.</p>' : '');
}

function deleteGalleryImage(index) {
    if (confirm('Supprimer cette image de la galerie ?')) {
        restaurantConfig.gallery.splice(index, 1);
        saveAndRefresh();
        renderGalleryAdmin();
        showToast('Image supprimée');
    }
}

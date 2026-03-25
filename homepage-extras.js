function homepageState() {
    return typeof window.__homepageGetState === 'function'
        ? window.__homepageGetState()
        : {};
}

function tx(key, fallback, vars) {
    if (typeof window.formatTranslation === 'function') {
        return window.formatTranslation(key, fallback, vars);
    }
    if (typeof window.getTranslation === 'function') {
        return window.getTranslation(key, fallback);
    }
    return fallback;
}

function renderHours() {
    const grid = document.getElementById('hoursGrid');
    const noteEl = document.getElementById('hoursNote');
    if (!grid) return;

    const hours = Array.isArray(window.restaurantConfig?._hours) && window.restaurantConfig._hours.length > 0
        ? window.restaurantConfig._hours
        : window.defaultHours;
    const note = typeof window.restaurantConfig?._hoursNote === 'string'
        ? window.restaurantConfig._hoursNote
        : (window.defaultHoursNote || '');

    grid.innerHTML = hours.map(h => `
        <div class="hours-row${h.highlight ? ' highlight-row' : ''}">
            <span class="hours-day" data-i18n="${h.i18n}">${h.day}</span>
            <span class="hours-dash"></span>
            <span class="hours-time">${h.open} – ${h.close}</span>
        </div>
    `).join('');

    if (noteEl) noteEl.textContent = note;
}

function updateWifiUI() {
    const { wifiData = {} } = homepageState();
    const ssidEl = document.getElementById('wifiSSIDDisplay');
    const passEl = document.getElementById('wifiPass');
    const qrEl = document.getElementById('wifiQR');
    const wifiSsid = (typeof wifiData?.ssid === 'string' && wifiData.ssid.trim())
        ? wifiData.ssid.trim()
        : tx('wifi_default_name', 'Restaurant WiFi');
    const wifiPass = (typeof wifiData?.pass === 'string' && wifiData.pass.trim())
        ? wifiData.pass.trim()
        : tx('wifi_default_code_help', 'Ask the team');
    if (ssidEl) ssidEl.innerHTML = `<strong>${tx('wifi_ssid_label', 'SSID')}:</strong> ${wifiSsid}`;
    if (passEl) passEl.textContent = wifiPass;
    if (qrEl) {
        qrEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WIFI:S:${encodeURIComponent(wifiSsid)};T:WPA;P:${encodeURIComponent(wifiPass)};;`;
    }
}

function updateWhatsAppLinks() {
    const { socialLinks = {} } = homepageState();
    const phoneFallback = (window.restaurantConfig?.phone || '').replace(/\D/g, '');
    const wa = (socialLinks.whatsapp || '').replace(/\D/g, '') || phoneFallback;
    const eventLink = document.getElementById('eventWALink');
    const contactLink = document.getElementById('contactWALink');

    if (eventLink) {
        if (wa) {
            eventLink.href = `https://wa.me/${wa}`;
        } else {
            eventLink.removeAttribute('href');
        }
    }

    if (contactLink) {
        if (!wa) {
            contactLink.removeAttribute('href');
            contactLink.textContent = window.restaurantConfig?.phone || tx('social_whatsapp', 'WhatsApp');
            return;
        }

        contactLink.href = `https://wa.me/${wa}`;
        contactLink.textContent = socialLinks.whatsapp ? `+${wa}` : (window.restaurantConfig?.phone || `+${wa}`);
    }
}

function renderSocialLinks() {
    const { socialLinks = {} } = homepageState();
    const modalList = document.getElementById('modalSocialList');
    const footerContainer = document.getElementById('footerSocial');
    const contactSocialLinks = document.getElementById('contactSocialLinks');

    let modalItems = '';
    let footerIcons = '';
    let contactButtons = '';
    const instagramUrl = window.getSafeExternalUrl(socialLinks.instagram);
    const facebookUrl = window.getSafeExternalUrl(socialLinks.facebook);
    const tiktokUrl = window.getSafeExternalUrl(socialLinks.tiktok);
    const tripAdvisorUrl = window.getSafeExternalUrl(socialLinks.tripadvisor);

    if (instagramUrl) {
        modalItems += `<a href="${instagramUrl}" target="_blank" class="social-link-item instagram"><span>📸</span> ${tx('social_instagram', 'Instagram')}</a>`;
        footerIcons += `<a href="${instagramUrl}" target="_blank" class="footer-social-icon">📸</a>`;
        contactButtons += `<a href="${instagramUrl}" target="_blank" class="social-btn">📸 ${tx('social_instagram', 'Instagram')}</a>`;
    }
    if (facebookUrl) {
        modalItems += `<a href="${facebookUrl}" target="_blank" class="social-link-item facebook"><span>📘</span> ${tx('social_facebook', 'Facebook')}</a>`;
        footerIcons += `<a href="${facebookUrl}" target="_blank" class="footer-social-icon">📘</a>`;
        contactButtons += `<a href="${facebookUrl}" target="_blank" class="social-btn">📘 ${tx('social_facebook', 'Facebook')}</a>`;
    }
    if (tiktokUrl) {
        modalItems += `<a href="${tiktokUrl}" target="_blank" class="social-link-item tiktok"><span>🎵</span> ${tx('social_tiktok', 'TikTok')}</a>`;
        footerIcons += `<a href="${tiktokUrl}" target="_blank" class="footer-social-icon">🎵</a>`;
        contactButtons += `<a href="${tiktokUrl}" target="_blank" class="social-btn">🎵 ${tx('social_tiktok', 'TikTok')}</a>`;
    }
    if (tripAdvisorUrl) {
        modalItems += `<a href="${tripAdvisorUrl}" target="_blank" class="social-link-item"><span>⭐</span> ${tx('social_tripadvisor', 'TripAdvisor')}</a>`;
        footerIcons += `<a href="${tripAdvisorUrl}" target="_blank" class="footer-social-icon">⭐</a>`;
        contactButtons += `<a href="${tripAdvisorUrl}" target="_blank" class="social-btn">⭐ ${tx('social_tripadvisor', 'TripAdvisor')}</a>`;
    }
    const waNumber = typeof window.getWhatsAppNumber === 'function'
        ? window.getWhatsAppNumber()
        : String(socialLinks.whatsapp || '').replace(/\D/g, '');
    if (waNumber) {
        modalItems += `<a href="https://wa.me/${waNumber}" target="_blank" class="social-link-item whatsapp"><span>📞</span> ${tx('social_whatsapp', 'WhatsApp')}</a>`;
        footerIcons += `<a href="https://wa.me/${waNumber}" target="_blank" class="footer-social-icon">📞</a>`;
        contactButtons += `<a href="https://wa.me/${waNumber}" target="_blank" class="social-btn">📞 ${tx('social_whatsapp', 'WhatsApp')}</a>`;
    }

    const emptyText = typeof window.getTranslation === 'function'
        ? window.getTranslation('social_empty', 'Aucun lien configuré.')
        : 'Aucun lien configuré.';
    const emptyStateHtml = `
        <div class="website-empty-state is-social">
            <strong>${typeof window.getTranslation === 'function'
                ? window.getTranslation('social_modal_title', 'Nos réseaux')
                : 'Nos réseaux'}</strong>
            <span>${emptyText}</span>
        </div>
    `;
    if (modalList) modalList.innerHTML = modalItems || emptyStateHtml;
    if (footerContainer) {
        footerContainer.innerHTML = footerIcons;
        footerContainer.style.display = footerIcons ? '' : 'none';
    }
    if (contactSocialLinks) {
        contactSocialLinks.innerHTML = contactButtons || emptyStateHtml;
    }
}

function renderGallery() {
    const grid = document.getElementById('mainGalleryGrid');
    if (!grid) return;
    const gallerySection = document.getElementById('gallery');

    const images = window.restaurantConfig?.gallery || [];
    const emptyText = typeof window.getTranslation === 'function'
        ? window.getTranslation('gallery_empty', 'De nouvelles photos arrivent bientôt...')
        : 'De nouvelles photos arrivent bientôt...';
    const emptyStateHtml = `
        <div class="website-empty-state is-gallery">
            <strong>${typeof window.getTranslation === 'function'
                ? window.getTranslation('gallery_title', 'Galerie')
                : 'Galerie'}</strong>
            <span>${emptyText}</span>
        </div>
    `;
    if (images.length === 0) {
        grid.innerHTML = emptyStateHtml;
        if (gallerySection && (window.restaurantConfig?.sectionVisibility?.gallery !== false)) {
            gallerySection.style.display = '';
        }
        return;
    }

    grid.innerHTML = images.map(img => `
        <div class="gallery-item" onclick="openGalleryLightbox('${img}')">
            <img src="${img}" alt="Gallery Image" width="640" height="640" loading="lazy" decoding="async" fetchpriority="low" />
        </div>
    `).join('');
    grid.querySelectorAll('img').forEach((imgEl) => {
        imgEl.onerror = () => {
            const card = imgEl.closest('.gallery-item');
            if (card) card.remove();
            if (!grid.querySelector('.gallery-item')) {
                grid.innerHTML = emptyStateHtml;
            }
        };
    });
}

function renderLocation() {
    const addressText = document.getElementById('contactAddressText');
    const footerAddressText = document.getElementById('footerAddressText');
    const addressCard = document.getElementById('contactAddressCard');
    const topAddressText = document.getElementById('topAddressDisplay');
    const topPhoneText = document.getElementById('topPhoneDisplay');
    const contactPhoneLink = document.getElementById('contactPhoneLink');
    const directionsLink = document.getElementById('directionsLink');
    const reviewsLink = document.getElementById('reviewsLink');

    if (window.restaurantConfig?.location) {
        if (addressText) addressText.textContent = window.restaurantConfig.location.address;
        if (footerAddressText) footerAddressText.textContent = window.restaurantConfig.location.address;
        if (topAddressText) topAddressText.textContent = `📍 ${window.restaurantConfig.location.address}`;
        const mapUrl = window.getSafeExternalUrl(window.restaurantConfig.location.url);
        if (addressCard && mapUrl) {
            addressCard.onclick = () => {
                window.openSafeExternalUrl(mapUrl, '_blank');
            };
            addressCard.classList.add('is-actionable');
        } else if (addressCard) {
            addressCard.onclick = null;
            addressCard.classList.remove('is-actionable');
        }
        if (directionsLink && mapUrl) {
            directionsLink.href = mapUrl;
            directionsLink.classList.remove('is-disabled');
        } else if (directionsLink) {
            directionsLink.removeAttribute('href');
            directionsLink.classList.add('is-disabled');
        }
        if (reviewsLink && mapUrl) {
            reviewsLink.href = mapUrl;
            reviewsLink.classList.remove('is-disabled');
        } else if (reviewsLink) {
            reviewsLink.removeAttribute('href');
            reviewsLink.classList.add('is-disabled');
        }
    } else if (addressCard) {
        addressCard.onclick = null;
        addressCard.classList.remove('is-actionable');
        if (addressText) {
            addressText.textContent = typeof window.getTranslation === 'function'
                ? window.getTranslation('landing_address_placeholder', 'Restaurant address')
                : 'Restaurant address';
        }
        if (footerAddressText) footerAddressText.textContent = '';
        if (topAddressText) topAddressText.textContent = '';
        if (reviewsLink) {
            reviewsLink.removeAttribute('href');
            reviewsLink.classList.add('is-disabled');
        }
    }

    if (window.restaurantConfig?.phone) {
        if (topPhoneText) topPhoneText.textContent = `📞 ${window.restaurantConfig.phone}`;
        if (contactPhoneLink) {
            const phoneHref = window.getSafePhoneHref(window.restaurantConfig.phone);
            if (phoneHref) {
                contactPhoneLink.href = phoneHref;
            } else {
                contactPhoneLink.removeAttribute('href');
            }
            contactPhoneLink.textContent = window.restaurantConfig.phone;
        }
    }

    if (!window.restaurantConfig?.phone) {
        if (topPhoneText) topPhoneText.textContent = '';
        if (contactPhoneLink) {
            contactPhoneLink.removeAttribute('href');
            contactPhoneLink.textContent = typeof window.getTranslation === 'function'
                ? window.getTranslation('landing_phone_placeholder', 'Phone coming soon')
                : 'Phone coming soon';
        }
    }

    if (typeof window.applyBranding === 'function') {
        window.applyBranding();
    }
}

function renderPaymentFacilities() {
    const { guestExperience = {} } = homepageState();
    const section = document.getElementById('payments');
    const paymentsList = document.getElementById('paymentMethodsList');
    const facilitiesList = document.getElementById('facilityList');
    const divider = document.getElementById('paymentsDivider');

    if (!section || !paymentsList || !facilitiesList) return;

    const paymentCatalog = {
        cash: { icon: '💵', labelKey: 'pf_payment_cash' },
        tpe: { icon: '💳', labelKey: 'pf_payment_tpe' }
    };
    const facilityCatalog = {
        wifi: { icon: '📶', labelKey: 'pf_facility_wifi' },
        accessible: { icon: '♿', labelKey: 'pf_facility_accessible' },
        parking: { icon: '🅿️', labelKey: 'pf_facility_parking' },
        terrace: { icon: '☀️', labelKey: 'pf_facility_terrace' },
        family: { icon: '👨‍👩‍👧‍👦', labelKey: 'pf_facility_family' }
    };

    const paymentItems = (guestExperience.paymentMethods || [])
        .map((id) => paymentCatalog[id])
        .filter(Boolean)
        .map((item) => `
            <div class="pf-icon-item">
              <span class="pf-icon">${item.icon}</span>
              <span class="pf-label" data-i18n="${item.labelKey}">${window.getTranslation(item.labelKey, item.labelKey)}</span>
            </div>
        `)
        .join('');

    const facilityItems = (guestExperience.facilities || [])
        .map((id) => facilityCatalog[id])
        .filter(Boolean)
        .map((item) => `
            <div class="pf-icon-item">
              <span class="pf-icon">${item.icon}</span>
              <span class="pf-label" data-i18n="${item.labelKey}">${window.getTranslation(item.labelKey, item.labelKey)}</span>
            </div>
        `)
        .join('');

    paymentsList.innerHTML = paymentItems;
    facilitiesList.innerHTML = facilityItems;

    const hasPayments = Boolean(paymentItems);
    const hasFacilities = Boolean(facilityItems);

    const paymentsCard = document.getElementById('paymentsCard');
    const facilitiesCard = document.getElementById('facilitiesCard');
    if (paymentsCard) paymentsCard.style.display = hasPayments ? '' : 'none';
    if (facilitiesCard) facilitiesCard.style.display = hasFacilities ? '' : 'none';
    if (divider) divider.style.display = hasPayments && hasFacilities ? '' : 'none';
    section.style.display = hasPayments || hasFacilities ? '' : 'none';
}

function renderSectionLayout() {
    const { sectionVisibility = {}, sectionOrder = [], defaultSectionVisibility = {} } = homepageState();
    const visibility = window.restaurantConfig?.sectionVisibility || sectionVisibility || defaultSectionVisibility;
    const orderSource = Array.isArray(window.restaurantConfig?.sectionOrder) ? window.restaurantConfig.sectionOrder : sectionOrder;
    const order = [];
    const knownKeys = ['about', 'payments', 'events', 'gallery', 'hours', 'contact'];

    (Array.isArray(orderSource) ? orderSource : []).forEach((key) => {
        if (!knownKeys.includes(key) || order.includes(key)) return;
        order.push(key);
    });
    knownKeys.forEach((key) => {
        if (!order.includes(key)) order.push(key);
    });

    const sectionMap = {
        about: 'about',
        payments: 'payments',
        events: 'events',
        gallery: 'gallery',
        hours: 'hours',
        contact: 'contact'
    };

    const anchor = document.getElementById('footer');
    if (anchor && anchor.parentNode) {
        order.forEach((key) => {
            const section = document.getElementById(sectionMap[key]);
            if (section) {
                anchor.parentNode.insertBefore(section, anchor);
            }
        });
    }

    Object.entries(sectionMap).forEach(([key, id]) => {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = visibility[key] === false ? 'none' : '';
        }
        document.querySelectorAll(`[data-section-link="${key}"]`).forEach((link) => {
            link.style.display = visibility[key] === false ? 'none' : '';
        });
    });

    const footerSocial = document.getElementById('footerSocial');
    if (footerSocial && !footerSocial.innerHTML.trim()) {
        footerSocial.style.display = 'none';
    } else if (footerSocial) {
        footerSocial.style.display = '';
    }

    const hoursNote = document.getElementById('hoursNote');
    if (hoursNote && !hoursNote.textContent.trim()) {
        hoursNote.style.display = 'none';
    } else if (hoursNote) {
        hoursNote.style.display = '';
    }
}

window.__homepageOpenGalleryLightbox = function __homepageOpenGalleryLightbox() {
    window.showToast(window.getTranslation('lightbox_soon', 'Aperçu photo à venir'));
};

window.__homepageOpenSocialModal = function __homepageOpenSocialModal() {
    document.getElementById('socialOverlay')?.classList.add('open');
    document.getElementById('socialModal')?.classList.add('open');
};

window.__homepageCloseSocialModal = function __homepageCloseSocialModal() {
    document.getElementById('socialOverlay')?.classList.remove('open');
    document.getElementById('socialModal')?.classList.remove('open');
};

window.__homepageOpenWifiModal = function __homepageOpenWifiModal() {
    document.getElementById('wifiOverlay')?.classList.add('open');
    document.getElementById('wifiModal')?.classList.add('open');
};

window.__homepageCloseWifiModal = function __homepageCloseWifiModal() {
    document.getElementById('wifiOverlay')?.classList.remove('open');
    document.getElementById('wifiModal')?.classList.remove('open');
};

window.__homepageCopyWifi = function __homepageCopyWifi() {
    const pass = document.getElementById('wifiPass')?.textContent || '';
    navigator.clipboard.writeText(pass).then(() => {
        window.showToast(tx('wifi_password_copied', 'Mot de passe copié !'));
    });
};

window.__homepageRenderLocation = renderLocation;
window.__homepageRenderDeferredSections = function __homepageRenderDeferredSections() {
    renderSocialLinks();
    renderHours();
    renderGallery();
    renderPaymentFacilities();
    renderSectionLayout();
    updateWifiUI();
    updateWhatsAppLinks();
};

window.__homepageExtrasReady = true;

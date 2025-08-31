(function() {
    // --- Configuration ---
    const FIREBASE_PROJECT_ID = 'permi-2881a';
    const FIREBASE_REGION = 'us-central1';
    const API_BASE_URL = `https://${FIREBASE_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net`;

    const SCRIPT_ID = 'dpdp-consent-script';
    const COOKIE_NAME = 'dpdp_consent_choices'; // Changed cookie name
    const COOKIE_EXP_DAYS = 365;

    let configId = null;
    let bannerConfig = null;

    // --- Helper Functions ---
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    // --- UI Creation ---
    function injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            #dpdp-consent-banner { position: fixed; bottom: 0; left: 0; width: 100%; background-color: #fff; color: #000; padding: 20px; box-sizing: border-box; z-index: 9999; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); gap: 20px; }
            #dpdp-consent-banner .dpdp-content { flex-grow: 1; }
            #dpdp-consent-banner .dpdp-actions { display: flex; gap: 10px; flex-shrink: 0; }
            #dpdp-consent-banner button { padding: 10px 20px; cursor: pointer; border: 1px solid #ccc; background-color: #f2f2f2; }
            #dpdp-preferences-modal { display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); }
            #dpdp-preferences-modal .modal-content { background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 600px; }
            #dpdp-preferences-modal .category-item { margin-bottom: 15px; }
            #dpdp-preferences-modal .category-item label { display: flex; align-items: center; }
            #dpdp-preferences-modal .category-item input { margin-right: 10px; }
            #dpdp-preferences-modal .category-item .desc { font-size: 0.9em; color: #666; margin-left: 25px; }
        `;
        document.head.appendChild(style);
    }

    function createBanner() {
        const banner = document.createElement('div');
        banner.id = 'dpdp-consent-banner';
        banner.innerHTML = `
            <div class="dpdp-content">${bannerConfig.mainContent}</div>
            <div class="dpdp-actions">
                <button id="dpdp-accept-btn">Accept All</button>
                <button id="dpdp-necessary-btn">Necessary Only</button>
                <button id="dpdp-prefs-btn">Customize</button>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById('dpdp-accept-btn').addEventListener('click', handleAcceptAll);
        document.getElementById('dpdp-necessary-btn').addEventListener('click', handleAcceptNecessary);
        document.getElementById('dpdp-prefs-btn').addEventListener('click', showPreferencesModal);
    }

    function createPreferencesModal() {
        let categoriesHtml = bannerConfig.categories.map(cat => `
            <div class="category-item">
                <label>
                    <input type="checkbox" id="dpdp-cat-${cat.id}" ${cat.required ? 'checked disabled' : ''}>
                    <strong>${cat.name}</strong>
                </label>
                <div class="desc">${cat.description}</div>
            </div>
        `).join('');

        const modal = document.createElement('div');
        modal.id = 'dpdp-preferences-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Privacy Preferences</h2>
                <p>You can control your consent settings for the following categories.</p>
                <div>${categoriesHtml}</div>
                <button id="dpdp-save-prefs-btn">Save Preferences</button>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('dpdp-save-prefs-btn').addEventListener('click', handleSavePreferences);
    }

    // --- Event Handlers ---
    function handleAcceptAll() {
        const allCategoryIds = bannerConfig.categories.map(c => c.id);
        logConsent(allCategoryIds);
    }

    function handleAcceptNecessary() {
        const necessaryCategoryIds = bannerConfig.categories.filter(c => c.required).map(c => c.id);
        logConsent(necessaryCategoryIds);
    }

    function showPreferencesModal() {
        document.getElementById('dpdp-preferences-modal').style.display = 'block';
    }

    function handleSavePreferences() {
        const grantedCategories = bannerConfig.categories
            .filter(cat => document.getElementById(`dpdp-cat-${cat.id}`).checked)
            .map(cat => cat.id);
        logConsent(grantedCategories);
    }

    function logConsent(grantedCategories) {
        setCookie(COOKIE_NAME, JSON.stringify(grantedCategories), COOKIE_EXP_DAYS);
        document.getElementById('dpdp-consent-banner').style.display = 'none';
        const modal = document.getElementById('dpdp-preferences-modal');
        if (modal) modal.style.display = 'none';

        fetch(`${API_BASE_URL}/logConsent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                configurationId: configId,
                grantedCategories: grantedCategories,
                userIdentifier: 'user_ip_placeholder',
                metadata: { userAgent: navigator.userAgent }
            }),
        }).catch(error => console.error('DPDP Consent: Error logging consent:', error));
    }

    // --- Core Logic ---
    function init() {
        if (getCookie(COOKIE_NAME)) return;

        const scriptTag = document.getElementById(SCRIPT_ID);
        if (!scriptTag) return console.error('DPDP Consent: Script tag with ID ' + SCRIPT_ID + ' not found.');
        
        configId = scriptTag.getAttribute('data-config-id');
        if (!configId) return console.error('DPDP Consent: data-config-id attribute not found on script tag.');

        fetch(`${API_BASE_URL}/getBannerConfig?id=${configId}`)
            .then(response => response.ok ? response.json() : Promise.reject(response.statusText))
            .then(config => {
                bannerConfig = config;
                injectStyles();
                createBanner();
                createPreferencesModal();
            })
            .catch(error => console.error('DPDP Consent: Error fetching banner configuration:', error));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
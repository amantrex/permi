(function() {
    // --- Configuration ---
    const FIREBASE_PROJECT_ID = 'permi-2881a';
    const FIREBASE_REGION = 'us-central1';
    const API_BASE_URL = `https://${FIREBASE_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net`;

    const SCRIPT_ID = 'dpdp-consent-script';
    const COOKIE_NAME = 'dpdp_consent_given';
    const COOKIE_EXP_DAYS = 365;

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

    // --- Core Logic ---
    function init() {
        if (getCookie(COOKIE_NAME)) {
            return;
        }

        const scriptTag = document.getElementById(SCRIPT_ID);
        if (!scriptTag) {
            console.error('DPDP Consent: Script tag with ID ' + SCRIPT_ID + ' not found.');
            return;
        }

        const configId = scriptTag.getAttribute('data-config-id');
        if (!configId) {
            console.error('DPDP Consent: data-config-id attribute not found on script tag.');
            return;
        }

        // Fetch banner config from our new Cloud Function
        fetch(`${API_BASE_URL}/getBannerConfig?id=${configId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                return response.json();
            })
            .then(config => {
                createBanner(config, configId);
            })
            .catch(error => {
                console.error('DPDP Consent: Error fetching banner configuration:', error);
            });
    }

    function createBanner(config, configId) {
        const banner = document.createElement('div');
        banner.id = 'dpdp-consent-banner';
        banner.innerHTML = `
            <div class="dpdp-content">${config.content}</div>
            <div class="dpdp-actions"><button id="dpdp-consent-button">${config.button_text}</button></div>
        `;
        
        // Apply styles
        Object.assign(banner.style, {
            position: 'fixed', bottom: '0', left: '0', width: '100%',
            backgroundColor: config.background_color || '#fff', color: config.text_color || '#000',
            padding: '20px', boxSizing: 'border-box', zIndex: '9999', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        });

        document.body.appendChild(banner);

        const consentButton = document.getElementById('dpdp-consent-button');
        Object.assign(consentButton.style, { padding: '10px 20px', cursor: 'pointer' });

        consentButton.addEventListener('click', () => {
            handleConsent(configId);
            banner.style.display = 'none';
        });
    }

    function handleConsent(configId) {
        setCookie(COOKIE_NAME, 'true', COOKIE_EXP_DAYS);
        
        // Log the consent action with our new Cloud Function
        fetch(`${API_BASE_URL}/logConsent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                configurationId: configId,
                userIdentifier: 'user_ip_placeholder', // In a real scenario, you might capture an IP or session ID
                metadata: { userAgent: navigator.userAgent }
            }),
        }).catch(error => console.error('DPDP Consent: Error logging consent:', error));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

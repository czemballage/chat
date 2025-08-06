const SETTINGS_KEY = 'pixelSketchSettings';

const defaultSettings = {
    onionSkinOpacity: 0.25,
    gridLines: true,
    autosave: true,
    defaultFps: 12,
};

let appSettings = { ...defaultSettings };

function saveAppSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
}

function loadAppSettings() {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
        appSettings = { ...defaultSettings, ...JSON.parse(savedSettings) };
    }
    updateSettingsUI();
}

function updateSettingsUI() {
    const onionOpacitySlider = document.getElementById('onionSkinOpacity');
    const onionOpacityValue = document.getElementById('onionSkinOpacityValue');
    if(onionOpacitySlider) {
        onionOpacitySlider.value = appSettings.onionSkinOpacity;
        onionOpacityValue.textContent = appSettings.onionSkinOpacity;
    }

    const gridLinesToggle = document.getElementById('gridLinesToggle');
    if(gridLinesToggle) gridLinesToggle.checked = appSettings.gridLines;

    const autosaveToggle = document.getElementById('autosaveToggle');
    if(autosaveToggle) autosaveToggle.checked = appSettings.autosave;

    const defaultFpsSlider = document.getElementById('defaultFps');
    const defaultFpsValue = document.getElementById('defaultFpsValue');
    if(defaultFpsSlider) {
        defaultFpsSlider.value = appSettings.defaultFps;
        defaultFpsValue.textContent = appSettings.defaultFps;
    }
}

function initSettings() {
    loadAppSettings();

    const settingsForm = document.getElementById('settingsForm');
    const closeBtn = document.getElementById('closeSettingsBtn');
    const resetBtn = document.getElementById('resetSettingsBtn');

    if (settingsForm) {
        settingsForm.addEventListener('input', (e) => {
            const key = e.target.id;
            let value;
            if (e.target.type === 'checkbox') {
                value = e.target.checked;
                appSettings[key.replace('Toggle', '')] = value;
            } else if (e.target.type === 'range') {
                value = parseFloat(e.target.value);
                appSettings[key] = value;
            }
            saveAppSettings();
            updateSettingsUI();
            applySetting(key.replace('Toggle', ''), value);
        });
    }

    if(closeBtn) closeBtn.addEventListener('click', () => showScreen('homeScreen'));

    if(resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all settings to their defaults?')) {
                appSettings = { ...defaultSettings };
                saveAppSettings();
                updateSettingsUI();
                // Re-apply all default settings
                Object.keys(appSettings).forEach(key => applySetting(key, appSettings[key]));
            }
        });
    }
}

function applySetting(key, value) {
    console.log(`Applying setting: ${key} = ${value}`);
    if (key === 'gridLines' && typeof pixelCanvas !== 'undefined' && pixelCanvas) {
        pixelCanvas.toggleGrid(value);
    }
    if (key === 'onionSkinOpacity' && typeof pixelCanvas !== 'undefined' && pixelCanvas) {
        pixelCanvas.setOnionSkinOpacity(value);
    }
}

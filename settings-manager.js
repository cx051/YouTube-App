const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const settingsPath = path.join(app.getPath('userData'), 'settings.json');

const defaultSettings = {
  hardwareAcceleration: false,
  soundEffects: true,
  skipIntro: false,
};

function getSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error reading settings:', error);
  }
  return { ...defaultSettings };
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

function updateSetting(key, value) {
  const settings = getSettings();
  settings[key] = value;
  saveSettings(settings);
}

module.exports = {
  getSettings,
  saveSettings,
  updateSetting,
};

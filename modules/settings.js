/**
 * Модуль для работы с файлами конфигураций приложения
 */
'use strict';

const fs = require('fs'),
	baseSettingsPath = 'settings/',
	applicationSettingsPath = `${baseSettingsPath}application.json`,
	servicesSettingsPath = `${baseSettingsPath}services.json`;

/**
 * Загружает конфигурации в один объект
 * @param {string} name Название блока конфигураций
 * @returns {object}
 */
function load(name) {
	if (name) {
		return JSON.parse(fs.readFileSync(`${baseSettingsPath}${name}.json`, 'utf8'));
	}
	else {
		return {
			application: JSON.parse(fs.readFileSync(applicationSettingsPath, 'utf8')),
			services: JSON.parse(fs.readFileSync(servicesSettingsPath, 'utf8'))
		};
	}
}

/**
 * Сохраняет конфигурации
 * @param {Object} settings Объект конфигураций, полученный с помощью load()
 * @param {string} name Название блока конфигураций
 */
function save(settings, name) {
	if (name) {
		fs.writeFileSync(`${baseSettingsPath}${name}.json`, JSON.stringify(settings, undefined, '\t', 'utf8'));
	}
	else {
		fs.writeFileSync(applicationSettingsPath, JSON.stringify(settings.application, undefined, '\t', 'utf8'));
		fs.writeFileSync(servicesSettingsPath, JSON.stringify(settings.services, undefined, '\t', 'utf8'));
	}
}

module.exports = {
	load: load,
	save: save
};

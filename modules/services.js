/**
 * Модуль, управляющий сервисами
 */
'use strict';

let settingsModule = req('modules/settings'),
	servicesDescription = settingsModule.load('services'), // Настройки приложения
	Service = req('classes/service'),
	services = new Map(); // Запущенные сервисы {<имя>: Service, ...}

/**
 * Возвращает список доступных сервисов
 * @returns {Array}
 */
function list() {
	if (servicesDescription && servicesDescription && servicesDescription.length) {
		return servicesDescription.map(setting => setting.name);
	}
	else {
		return [];
	}
}

/**
 * Запускает все сервисы
 * @returns {Promise}
 */
function start() {
	servicesDescription = settingsModule.load('services');
	services.clear();
	return new Promise((resolve, reject) => {
		let serverPromises = [];
		for (const serviceDescription of servicesDescription) {
			// Стартуем только, если ещё нет сервиса с таким именем
			if (!services.has(serviceDescription.name)) {
				// Так как создание сервиса может занимать произвольное время, оборачиваем процесс промисом
				serverPromises.push(new Promise((resolve, reject) => {
					// Добавляем запись о сервисе
					services.set(
						serviceDescription.name,
						new Service(serviceDescription).once('started', resolve).once('error', reject)
					);
				}));
			}
		}
		Promise.all(serverPromises).then(() => resolve(services)).catch(reject);
	});
}

/**
 * Останавливает все сервисы
 * @returns {Promise}
 */
function stop() {
	return new Promise((resolve, reject) => {
		let closePromises = [];
		for (const service of services.values()) {
			closePromises.push(new Promise((resolve, reject) => {
				service.once('stopped', resolve);
				service.stop();
			}));
		}
		Promise.all(closePromises).then(resolve).catch(reject);
	});
}

/**
 * Получает хеш-таблицу сервисов, либо конкретный сервис
 * @param {string} [name] Имя сервиса
 * @returns {object}
 */
function get(name) {
	if (name) {
		return services.get(name);
	}
	else {
		return services;
	}
}

module.exports = {
	list: list,
	start: start,
	stop: stop,
	get: get
};

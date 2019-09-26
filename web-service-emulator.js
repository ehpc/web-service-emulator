/**
 * Головной модуль
 */
'use strict';

global.req = path => require(`${__dirname}/${path}`);

const services = req('modules/services'),
	admin = req('modules/admin');

services.start()
	.then(function () {
		return admin.start();
	})
	.catch(function (err) {
		console.error('Ошибка при запуске сервисов.', err);
	});

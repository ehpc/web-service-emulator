/**
 * Модуль системы администрирования
 */
'use strict';

const fs = require('fs'),
	express = require('express'),
	enableDestroy = require('server-destroy'),
	expressHandlebars  = require('express-handlebars'),
	bodyParser = require('body-parser'),
	logger = req('modules/logger'),
	services = req('modules/services'),
	settingsModule = req('modules/settings'),
	settings = settingsModule.load('application'),
	app = express();

let listener, // HTTP.Server
	hbs = expressHandlebars.create({
		extname: 'hbs',
		defaultLayout: 'default',
		layoutsDir: 'views/layouts',
		partialsDir: 'views/partials'
	});

/**
 * Увеличивает аргумент на единицу
 * @param {number} x Число
 */
hbs.handlebars.registerHelper('inc', x => x + 1);

/**
 * Возвращает элемент массива по индексу
 * @param {Array} arr Массив
 * @param {number} index Индекс
 */
hbs.handlebars.registerHelper('getItemByIndex', (arr, index) => arr[index]);

/**
 * Partial
 * @param {string} name Имя
 * @param {Object} options
 * @returns {hbs.handlebars.SafeString}
 */
hbs.handlebars.registerHelper('partial', (name, options) => {
	let template = hbs.handlebars.compile(fs.readFileSync(`${__dirname}/../views/${name}.hbs`, 'utf8'));
	return new hbs.handlebars.SafeString(template(Object.assign(
		(options.hash.context && JSON.parse(JSON.stringify(options.hash.context))) || {},
		options.hash,
		{
			html: options.fn ? options.fn() : ''
		}
	)));
});

// Настройка статики
app.use(express.static('public'));

// Принимает JSON
app.use(bodyParser.json());

// Настройка view
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

// Основная страница
app.get('/', (req, res) => {
	res.render('admin', {
		settings: settingsModule.load('application'),
		services: settingsModule.load('services')
	});
});

// Получение текущих настроек
app.get('/settings', (req, res) => {
	res.json({
		settings: settingsModule.load('application'),
		services: settingsModule.load('services')
	});
});

// Перезапись текущих настроек
app.put('/settings', (req, res) => {
	if (req.body && req.body.settings && req.body.services) {
		settingsModule.save(req.body.settings, 'application');
		settingsModule.save(req.body.services, 'services');
		services
			.stop()
			.then(() => services.start())
			.then(() => {
				res.json({
					settings: settingsModule.load('application'),
					services: settingsModule.load('services')
				});
			})
			.catch((err) => {
				logger.error(err);
				res.status(400);
				res.json({
					error: true,
					message: err
				});
			});
	}
	else {
		res.status(400);
		res.json({
			error: true,
			message: 'Не найдены данные для сохранения.',
			body: req.body
		});
	}
});

// Рендеринг страницы администрирования
app.post('/render/admin', (req, res) => {
	res.render(
		'admin',
		{
			settings: req.body.settings,
			services: req.body.services,
			layout: false
		}
	);
});

/**
 * Запуск системы администрирования
 * @returns {Promise}
 */
function start() {
	return new Promise((resolve, reject) => {
		listener = app.listen(settings.port, () => {
			logger.info('Запущена система администрирования.');
			resolve();
		});
		// close() не закрывает keep-alive соединения, поэтому нужен данный плагин
		enableDestroy(listener);
	});
}

/**
 * Остановка системы администрирования
 * @returns {Promise}
 */
function stop() {
	return new Promise((resolve, reject) => {
		listener.destroy(() => {
			logger.info('Остановлена система администрирования.');
			resolve();
		});
	});
}

module.exports = {
	start: start,
	stop: stop
};

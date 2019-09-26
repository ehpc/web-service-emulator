'use strict';

const express = require('express'),
	enableDestroy = require('server-destroy'),
	EventEmitter = require('events'),
	fs = require('fs'),
	http = require('http'),
	https = require('https');

/**
 * Класс, представляющий собой HTTP-сервер для сервиса
 */
class Server extends EventEmitter {

	/**
	 * Конструктор
	 * @param {number} port Порт сервиса
	 */
	constructor(port) {
		super();
		this.port = port;
	}

	/**
	 * Добавляет обработчик маршрута
	 * @param {string} endpoint Маршрут
	 * @param {function} handler Обработчик
	 */
	addRoute(endpoint, handler) {
		if (endpoint) {
			this.server.all(endpoint, handler);
		}
		else {
			this.server.use(handler);
		}
	}

	/**
	 * Инициализация сервера
	 */
	initializeServer() {
		let isHttps = true;
		try {
			this.privateKey = fs.readFileSync('cert.key');
			this.cert = fs.readFileSync('cert.crt');
		}
		catch (err) {
			isHttps = false;
		}
		this.server = express(); // Express-экземпляр сервиса
		// Обработчик HTTP body
		this.server.use((req, res, next) => {
			req.text = '';
			req.setEncoding('utf8');
			req.on('data', chunk => req.text += chunk);
			req.on('end', next);
		});
		let httpServer = isHttps ? https.createServer({key: this.privateKey, cert: this.cert}, this.server) : http.createServer(this.server);
		this.listener = httpServer.listen(this.port, () => this.emit('started')).on('error', (err) => this.emit('error', err.toString()));
		// close() не закрывает keep-alive соединения, поэтому нужен данный плагин
		enableDestroy(this.listener);
	}

	/**
	 * Возвращает порт, на котором работает сервер
	 * @returns {number}
	 */
	getPort() {
		return this.listener.address().port;
	}

	/**
	 * Останавливает сервер
	 * @returns {Service} this
	 */
	stop() {
		this.listener.destroy(() => this.emit('stopped'));
		return this;
	}

}

module.exports = Server;

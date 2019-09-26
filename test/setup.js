'use strict';

global.req = path => require(`${__dirname}/../${path}`);
const chai = require('chai'),
	request = require('request');
chai.should();

/**
 * Функция для тестирования POST-запросов
 * @param {string} uri Входящий URI
 * @param {string} [body] Тело запроса
 * @param {object} [headers] Хедеры запроса
 * @param {boolean} [json] Принимать и отправлять JSON
 * @returns {Promise}
 */
global.testPost = (uri, body = '', headers = {}, json = false) => {
	return new Promise((resolve, reject) => {
		let options = {
				uri: uri,
				method: 'POST',
				headers: headers
			};
		if (json) {
			options.json = body;
		}
		else {
			options.body = body;
		}
		options.headers = headers;
		request(
			options,
			(err, res, body) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(body);
				}
			}
		);
	});
};

/**
 * Функция для тестирования PUT-запросов
 * @param {string} uri Входящий URI
 * @param {string} [body] Тело запроса
 * @param {object} [headers] Хедеры запроса
 * @param {boolean} [json] Отправлять JSON
 * @returns {Promise}
 */
global.testPut = (uri, body = '', headers = {}, json = false) => {
	return new Promise((resolve, reject) => {
		let options = {
			uri: uri,
			method: 'PUT',
			headers: headers
		};
		if (json) {
			options.json = body;
		}
		else {
			options.body = body;
		}
		request(
			options,
			(err, res, body) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(body);
				}
			}
		);
	});
};

/**
 * Функция для тестирования GET-запросов
 * @param {string} uri Входящий URI
 * @param {boolean} [json] Принимать JSON
 * @returns {Promise}
 */
global.testGet = (uri, json = false) => {
	return new Promise((resolve, reject) => {
		request(
			{
				uri: uri,
				method: 'GET'
			},
			(err, res, body) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(json ? JSON.parse(body) : body);
				}
			}
		);
	});
};

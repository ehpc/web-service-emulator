'use strict';

/**
 * Класс, представляющий собой событие конечного автомата
 */
class Event {

	/**
	 * Конструктор
	 * @param {string} [endpoint] Точка входа (URI)
	 * @param {string} [input] Входящие данные
	 */
	constructor(endpoint = '/', input = '') {
		this.endpoint = endpoint;
		this.input = input;
	}

	/**
	 * Возвращает строковое представление события
	 * @returns {string}
	 */
	toString() {
		return `${this.endpoint}:${this.input}`;
	}

}

module.exports = Event;

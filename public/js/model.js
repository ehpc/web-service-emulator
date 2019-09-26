'use strict';

(function () {


	/**
	 * Основная модель данных
	 * @constructor
	 */
	function Model() {
		this.data = {};
	}

	/**
	 * Возвращает сервис по идентификатору
	 * @param {number} id Идентификатор
	 * @returns {Object}
	 */
	Model.prototype.getService = function (id) {
		return this.data.services.filter(function (val) {
			return val.id === id;
		})[0];
	};

	/**
	 * Возвращает данные модели
	 * @returns {object}
	 */
	Model.prototype.getData = function () {
		return this.data;
	};

	/**
	 * Получает данные модели по названию поля
	 * @param {number} id Идентификатор сервиса
	 * @param {string} fieldName Название поля
	 * @returns {*}
	 */
	Model.prototype.getFieldValue = function (id, fieldName) {
		return crawlPath(this.getService(id), fieldName);
	};

	/**
	 * Устанавливает данные модели по названию поля
	 * @param {string} id Идентификатор сервиса
	 * @param {string} fieldName Название поля
	 * @param {*} fieldValue Значение
	 * @returns {this}
	 */
	Model.prototype.setFieldValue = function (id, fieldName, fieldValue) {
		var service = this.getService(id), match, i, j,
			oldValue = crawlPath(service, fieldName, fieldValue);
		// Если изменяем название состояния, то изменяем его везде
		if (/^states\[\d+\]$/.test(fieldName)) {
			if (service.initialState === oldValue) {
				service.initialState = fieldValue;
			}
			for (i = 0; i < service.stateTransitionTable.length; i++) {
				for (j = 0; j < service.stateTransitionTable[i].transitions.length; j++) {
					if (service.stateTransitionTable[i].transitions[j].next === oldValue) {
						service.stateTransitionTable[i].transitions[j].next = fieldValue;
					}
				}
			}
		}
		return this;
	};

	/**
	 * Удалет веб-сервис
	 * @param {string} id Идентификатор сервиса
	 * @returns {this}
	 */
	Model.prototype.deleteService = function (id) {
		this.data.services = this.data.services.filter(function (val) {
			return val.id !== id;
		});
		return this;
	};

	/**
	 * Удаляет данные по указанному пути
	 * @param {string} id Идентификатор сервиса
	 * @param {string} path Путь
	 * @returns {this}
	 */
	Model.prototype.delete = function (id, path) {
		crawlPath(this.getService(id), path, undefined, true);
		return this;
	};

	/**
	 * Добавляет новый сервис
	 * @returns {this}
	 */
	Model.prototype.addService = function () {
		var template = this.getService(0),
			clone = JSON.parse(JSON.stringify(template)),
			maxId = this.data.services.reduce(function (max, service) {
				return max < service.id ? service.id : max;
			}, 0),
			maxPort = this.data.services.reduce(function (max, service) {
				return max < service.port ? service.port : max;
			}, 0);
		clone.id = maxId + 1;
		clone.port = maxPort + 1;
		clone.name += ' ' + clone.id;
		clone.visible = true;
		this.data.services.unshift(clone);
		return this;
	};

	/**
	 * Добавляет событие
	 * @param {string} id Идентификатор сервиса
	 * @returns {this}
	 */
	Model.prototype.addEvent = function (id) {
		var template = this.getService(0),
			service = this.getService(id),
			row = {
				event: {
					endpoint: template.stateTransitionTable[0].event.endpoint,
					input: template.stateTransitionTable[0].event.input
				},
				transitions: []
			},
			clone, i;
		for (i = 0; i < service.states.length; i++) {
			clone = JSON.parse(JSON.stringify(template.stateTransitionTable[0].transitions[0]));
			// Копируем next из предыдущей строки
			if (service.stateTransitionTable.length > 0) {
				clone.next = service.stateTransitionTable[service.stateTransitionTable.length - 1].transitions[i].next;
			}
			row.transitions.push(clone);
		}
		service.stateTransitionTable.push(row);
		return this;
	};

	/**
	 * Добавляет состояние
	 * @param {string} id Идентификатор сервиса
	 * @returns {this}
	 */
	Model.prototype.addState = function (id) {
		var template = this.getService(0),
			service = this.getService(id),
			clone = JSON.parse(JSON.stringify(template.stateTransitionTable[0].transitions[0])),
			i;
		clone.next += '-' + id;
		service.states.push(template.states[0] + '-' + id);
		for (i = 0; i < service.stateTransitionTable.length; i++) {
			service.stateTransitionTable[i].transitions.push(clone);
		}
		return this;
	};

	/**
	 * Загрузка данных модели
	 */
	Model.prototype.load = function () {
		var that = this;
		return new Promise(function (resolve, reject) {
			$.ajax(
				'/settings',
				{
					method: 'GET',
					dataType: 'json'
				}
			).then(function (data) {
				that.data = data;
				resolve(data);
			}).fail(function (err) {
				reject(err);
			});
		});
	};

	/**
	 * Сохранение данных модели
	 * @returns {Promise}
	 */
	Model.prototype.save = function () {
		var that = this;
		return new Promise(function (resolve, reject) {
			$.ajax(
				'/settings',
				{
					method: 'PUT',
					dataType: 'json',
					contentType: 'application/json; charset=utf-8',
					data: JSON.stringify(that.data)
				}
			).then(function (data) {
				that.data = data;
				resolve(data);
			}).fail(function (err) {
				reject(err.responseJSON.message);
			});
		});
	};

	/**
	 * Проходит объект по указанному пути и выставляет значение, если оно указано
	 * @param {object} obj Объект
	 * @param {string} path Путь
	 * @param {*} newValue Новое значение
	 * @param {boolean} deleteMode Режим удаления
	 */
	function crawlPath(obj, path, newValue, deleteMode) {
		var parts = path.split('.'),
			part, i, j, match, tmp;
		for (i = 0; i < parts.length; i++) {
			// Если требуется изменить значение
			if (typeof newValue !== 'undefined' && i === parts.length - 1) {
				match = /^(.+)\[(\d+)\]$/.exec(parts[i]);
				if (match) {
					obj = obj[match[1]];
					tmp = obj[match[2]];
					obj[match[2]] = newValue;
					return tmp;
				}
				else {
					tmp = obj[parts[i]];
					obj[parts[i]] = newValue;
					return tmp;
				}
			}
			// Если мы просто ищем значение
			else {
				part = parts[i];
				match = /^(.+)\[(\d+)\]$/.exec(part);
				if (match) {
					part = match[1];
					if (deleteMode && i === parts.length - 1) {
						obj[part].splice(match[2], 1);
					}
					else {
						obj = obj[part][match[2]];
					}
				}
				else if (deleteMode && i === parts.length - 1) {
					delete obj[part];
				}
				else {
					obj = obj[part];
				}
			}
			// Если получили массив
			if (typeof obj === 'object' && obj.length) {
				for (j = 0; j < obj.length; j++) {
					crawlPath(obj[j], parts.slice(i + 1).join('.'), newValue, deleteMode);
				}
				break;
			}
		}
		return obj;
	}

	window.Model = Model;

})();

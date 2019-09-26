'use strict';

const Server = req('classes/server'),
	Event = req('classes/event'),
	common = req('modules/common');

/**
 * Класс, представляющий собой экземпляр сервиса
 */
class Service extends Server {

	/**
	 * Конструктор
	 * @param {Object} description Описание сервиса
	 */
	constructor(description) {
		super(description && description.port);
		this.description = description;
		// Инициализируем конечный автомат
		this.initializeFSM();
		// Инициализируем сервер
		this.initializeServer();
		// Создаём маршруты
		this.createRoutes();
		// Инициализируем сессии
		this.initializeSessions();
	}

	/**
	 * Устанавливает текущее состояние сервиса
	 * @param stateName Имя нового состояния
	 * @param {string} sessionId Идентификатор сессии
	 * @returns {Service} this
	 */
	setCurrentState(stateName, sessionId = Service.defaultSessionId) {
		this.getSession(sessionId).set('state', stateName);
		return this;
	}

	/**
	 * Возвращает текущее состояние сервиса
	 * @param {string} sessionId Идентификатор сессии
	 * @returns {string}
	 */
	getCurrentState(sessionId = Service.defaultSessionId) {
		return this.getSession(sessionId).get('state');
	}

	/**
	 * Сброс текущего состояния в начальное
	 * @param {string} [sessionId] Идентификатор сессии
	 * @returns {Service} this
	 */
	resetState(sessionId = null) {
		// Сброс для конкретной сессии
		if (sessionId && sessionId !== Service.defaultSessionId) {
			this.getSession(sessionId).set('state', this.description.initialState);
		}
		// Сброс для всех сессий
		else {
			for (let session of this.sessions.values()) {
				session.set('state', this.description.initialState);
			}
		}
		return this;
	}

	/**
	 * Выполняет переход согласно таблице переходов
	 * @param {Event} [event] Входящее событие перехода
	 * @param {string} [sessionId] Идентификатор сессии
	 * @returns {string|null} Выход перехода или null, если переход не найден
	 */
	transition(event = new Event(), sessionId = Service.defaultSessionId) {
		let transitions = this.findTransitionsByEvent(event),
			currentState = this.getCurrentState(sessionId),
			currentStateIndex = this.description.states.indexOf(currentState);
		if (transitions && currentStateIndex !== -1) {
			this.setCurrentState(transitions[currentStateIndex].next, sessionId);
			return transitions[currentStateIndex].output;
		}
		else {
			return null;
		}
	}

	/**
	 * Находит возможные переходы из таблицы переходов по событию
	 * @param {Event} event Событие
	 * @returns {Object} Переходы (stateTransitionTable.transitions)
	 */
	findTransitionsByEvent(event) {
		let plausibleEvents = this.endpointsMap.get(event.endpoint);
		for (const plausibleEvent of plausibleEvents) {
			let inputRegex = plausibleEvent.event.input
					.split('__*__')
					.map(x => common.escapeRegex(x))
					.join('__*__')
					.replace(/__\*__/, '[^]*'),
				rx = new RegExp(`^${inputRegex}$`, 'g');
			if (rx.test(event.input)) {
				return plausibleEvent.transitions;
			}
		}
		return null;
	}

	/**
	 * Создаём маршруты сервера для обработки входящих запросов
	 */
	createRoutes() {
		let routes = new Map();
		// Для каждой точки входа
		for (const endpoint of this.endpointsMap.keys()) {
			routes.set(
				endpoint,
				[
					(req, res) => {
						let sessionId = getSessionId(req),
							event = new Event(endpoint, req.text),
							output = this.transition(event, sessionId);
						if (output !== null) {
							// Постобработка выхода и отправка его клиенту
							res.send(processOutput(output, {
								sessionId: sessionId
							}));
						}
						else {
							res.json({
								error: true,
								message: 'Не найден переход для события.',
								event: event,
								availableEvents: this.getEvents().map(x => x.toString()),
								currentState: this.getCurrentState(sessionId),
								sessionId: sessionId
							});
						}
					}
				]
			);
			for (const handler of routes.get(endpoint)) {
				this.addRoute(endpoint, handler);
			}
		}
		// Маршрут, сбрасывающий состояние сервиса
		this.addRoute('/reset', (req, res) => {
			let sessionId = getSessionId(req);
			this.resetState(sessionId);
			res.json({
				error: false,
				message: 'Состояние сброшено для всех сессий.',
				currentState: this.getCurrentState(sessionId),
				sessionId: sessionId
			});
		});
		// Маршрут, возвращающий описание сервиса
		this.addRoute('/man', (req, res) => {
			let sessionId = getSessionId(req);
			res.json(Object.assign({
				currentState: this.getCurrentState(sessionId),
				sessionId: sessionId
			}, this.description));
		});
		// Если маршрут не найден
		this.addRoute(null, (req, res) => {
			res.json({
				error: true,
				message: 'Не найдена указанная точка входа.',
				endpoint: req.originalUrl,
				availableEndpoints: this.getEndpoints(),
				currentState: this.getCurrentState(),
				sessionId: getSessionId(req)
			});
		});
		return routes;
	}

	/**
	 * Получение списка точек входа сервиса
	 * @returns {string[]}
	 */
	getEndpoints() {
		return Array.from(this.endpointsMap.keys());
	}

	/**
	 * Получение списка событий конечного автомата
	 * @returns {Array}
	 */
	getEvents() {
		return Array.from(this.eventsMap.keys());
	}

	/**
	 * Инициализирует конечный автомат
	 */
	initializeFSM() {
		// Создаём хеш-таблицы для быстрого доступа к строкам таблицы переходов
		[this.eventsMap, this.endpointsMap] = generateEventTransitionMaps(this.description);
	}

	/**
	 * Инициализирует сессии
	 */
	initializeSessions() {
		this.sessions = new Map();
		Service.defaultSessionId = 'default-session';
	}

	/**
	 * Возвращает сессию по идентификатору, если сессии нет, создаёт её
	 * @param {string} id Идентификатор сессии
	 * @returns {Map}
	 */
	getSession(id) {
		if (this.sessions.has(id)) {
			return this.sessions.get(id);
		}
		else {
			const data = new Map([
				['state', this.description.initialState]
			]);
			this.sessions.set(id, data);
			return data;
		}
	}

}

/**
 * Возвращает идентификатор сессии для указанного запроса
 * @param {object} req Запрос
 * @returns {string}
 */
function getSessionId(req) {
	return req.query['session-id'] || req.get('session-id') || Service.defaultSessionId;
}

/**
 * Раскрывает шаблоны подстановки
 * @param {string} output Выход автомата
 * @param {string} sessionId Входящий запрос
 * @returns {string} Выход автомата без шаблонов подстановки
 */
function processOutput(output, {sessionId}) {
	const templates = new Map([
		[
			new RegExp('__SESSION_ID__', 'g'),
			sessionId
		]
	]);
	for (const [regex, value] of templates) {
		output = output.replace(regex, value);
	}
	return output;
}

/**
 * Создаёт маппинги таблицы переходов
 * @param description
 */
function generateEventTransitionMaps(description) {
	let endpointsMap = new Map(),
		eventsMap = new Map();
	for (const stateTransition of description.stateTransitionTable) {
		// Может быть много событий с одной точкой входа
		if (endpointsMap.has(stateTransition.event.endpoint)) {
			endpointsMap.get(stateTransition.event.endpoint).push(stateTransition);
		}
		else {
			endpointsMap.set(stateTransition.event.endpoint, [stateTransition]);
		}
		eventsMap.set(new Event(stateTransition.event.endpoint, stateTransition.event.input).toString(), stateTransition);
	}
	return [eventsMap, endpointsMap];
}

module.exports = Service;

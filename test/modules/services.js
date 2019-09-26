'use strict';

const servicesModule = req('modules/services');

describe('Модуль управления сервисами', function () {

	const helloWorldUri = 'http://localhost:7000',
		helloWorldName = 'Hello, world!',
		pingPongUri = 'http://localhost:7001',
		pingPongName = 'Ping, pong',
		multipleEndpointsUri = 'http://localhost:7002',
		multipleEndpointsName = 'Multiple endpoints',
		cycledStepsUri = 'http://localhost:7003',
		cycledStepsName = 'Cycled steps',
		sessionTestUri = 'http://localhost:7004',
		sessionTestName = 'Session check',
		okToAnythingUri = 'http://localhost:7005',
		okToAnythingName = 'Ok to anything';

	this.timeout(30000);

	before(done => {
		servicesModule.start().then(() => done()).catch(done);
	});

	after(done => {
		servicesModule.stop().then(() => done()).catch(done);
	});

	it('может вернуть список доступных сервисов', () => {
		servicesModule.list().should.include(helloWorldName);
	});

	it('может вернуть список всех запущенных сервисов', () => {
		servicesModule.get().should.contain.all.keys('Hello, world!');
	});

	it('может вернуть конкретный запущенный сервис', () => {
		servicesModule.get(helloWorldName).should.have.property('getEndpoints').which.is.a('function');
	});

	describe('Сервис "Hello, world!"', () => {

		it('имеет одну точку входа', () => {
			servicesModule.get(helloWorldName).getEndpoints().should.eql(['/']);
		});

		it('имеет начальное состояние "begin"', () => {
			servicesModule.get(helloWorldName).getCurrentState().should.equal('begin');
		});

		it('после сброса текущего состояния имеет текущее состояние "begin"', () => {
			servicesModule.get(helloWorldName).resetState().getCurrentState().should.equal('begin');
		});

		it('после холостого перехода имеет текущее состояние "begin"', () => {
			servicesModule.get(helloWorldName).transition();
			servicesModule.get(helloWorldName).getCurrentState().should.equal('begin');
		});

		it('располагается по верному порту', () => {
			servicesModule.get('Hello, world!').getPort().should.equal(7000);
		});

		it('отвечает клиенту правильно', () => {
			return testPost(helloWorldUri).then((body) => body.should.equal('Hello, world!'));
		});

		it('возвращает ошибку точки входа на событие "/undefined:"', () => {
			return testPost(`${helloWorldUri}/undefined`).then(
				(body) => body.should.include('error').and.include('availableEndpoints')
			);
		});

		it('возвращает ошибку события на событие "/:undefined"', () => {
			return testPost(helloWorldUri, 'undefined').then(
				(body) => body.should.include('error').and.include('availableEvents')
			);
		});

	});

	describe('Сервис "Ping, pong"', () => {

		it('имеет два события', () => {
			servicesModule.get(pingPongName).getEvents().should.have.lengthOf(2);
		});

		it('отвечает "pong" на событие "/:ping"', () => {
			return testPost(pingPongUri, 'ping').then((body) => body.should.equal('pong'));
		});

		it('отвечает "ping" на событие "/:pong"', () => {
			return testPost(pingPongUri, 'pong').then((body) => body.should.equal('ping'));
		});

	});

	describe('Сервис "Multiple endpoints"', () => {

		it('имеет две точки входа', () => {
			servicesModule.get(multipleEndpointsName).getEndpoints().should.have.lengthOf(2);
		});

		it('отвечает "Endpoint 1" на событие "/endpoint1:"', () => {
			return testPost(`${multipleEndpointsUri}/endpoint1`).then((body) => body.should.equal('Endpoint 1'));
		});

		it('отвечает "Endpoint 2" на событие "/endpoint2:"', () => {
			return testPost(`${multipleEndpointsUri}/endpoint2`).then((body) => body.should.equal('Endpoint 2'));
		});

	});

	describe('Сервис "Cycled steps"', () => {

		it('отвечает "step 1" после первого обращения', () => {
			return testPost(cycledStepsUri).then((body) => body.should.equal('step 1'));
		});

		it('отвечает "step 2" после второго обращения', () => {
			return testPost(cycledStepsUri).then((body) => body.should.equal('step 2'));
		});

		it('отвечает "step 1" после третьего обращения', () => {
			return testPost(cycledStepsUri).then((body) => body.should.equal('step 1'));
		});

		it('возвращает описание самого себя на событие "/man:"', () => {
			return testPost(`${cycledStepsUri}/man`).then(
				(body) => body.should.include('stateTransitionTable').and.include('description').and.include('name')
			);
		});

	});

	describe('Сервис "Session test"', () => {

		describe('когда запущено два клиента одновременно', () => {

			describe('и каждый клиент отправляет уникальный header или get-параметр "session-id"', () => {

				it('возвращает session-id каждого клиента после первого обращения', () => {
					return Promise.all([
						testPost(
							sessionTestUri,
							'',
							{
								'session-id': 1
							}
						).then((body) => body.should.equal('1')),
						testPost(
							`${sessionTestUri}/?session-id=2`
						).then((body) => body.should.equal('2')),
					]);
				});

				it('возвращает "step 2" каждому клиенту после второго обращения', () => {
					return Promise.all([
						testPost(
							`${sessionTestUri}/?session-id=1`
						).then((body) => body.should.equal('step 2')),
						testPost(
							sessionTestUri,
							'',
							{
								'session-id': 2
							}
						).then((body) => body.should.equal('step 2')),
					]);
				});

				it('возвращает session-id каждому клиенту после третьего обращения', () => {
					return Promise.all([
						testPost(
							sessionTestUri,
							'',
							{
								'session-id': 1
							}
						).then((body) => body.should.equal('1')),
						testPost(
							sessionTestUri,
							'',
							{
								'session-id': 2
							}
						).then((body) => body.should.equal('2')),
					]);
				});

				it('позволяет сбросить текущее состояние у одного из клиентов', () => {
					return testPost(
							`${sessionTestUri}/reset`,
							'',
							{
								'session-id': 1
							}
						)
						.then((body) => JSON.parse(body).should.deep.contain({
							currentState: 'first',
							sessionId: '1'
						}))
						.then(() => {
							return testPost(
								sessionTestUri,
								'',
								{
									'session-id': 2
								}
							);
						})
						.then((body) => body.should.equal('step 2'));
				});

			});

		});

	});

	describe('Сервис "Ok to anything"', () => {

		it('отвечает "ok" на событие "/:"', () => {
			return testPost(okToAnythingUri).then((body) => body.should.equal('ok'));
		});

		it('отвечает "ok" на событие "/endpoint:"', () => {
			return testPost(okToAnythingUri).then((body) => body.should.equal('ok'));
		});

		it('отвечает "ok" на любое событие с endpoint "/"', () => {
			return testPost(okToAnythingUri, 'something').then((body) => body.should.equal('ok'));
		});

		it('отвечает "ok" на любое событие с endpoint "/endpoint"', () => {
			return testPost(`${okToAnythingUri}/endpoint`, 'something').then((body) => body.should.equal('ok'));
		});

		it('отвечает "ok!" на событие "/:ok?"', () => {
			return testPost(okToAnythingUri, 'ok?').then((body) => body.should.equal('ok!'));
		});

	});

});

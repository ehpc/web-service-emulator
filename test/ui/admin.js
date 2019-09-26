'use strict';

const adminModule = req('modules/admin');

describe('Модуль системы администрирования', function () {

	const uiUri = 'http://localhost:8081';

	this.timeout(30000);

	before(done => {
		adminModule.start().then(() => done()).catch(done);
	});

	after(done => {
		adminModule.stop().then(() => done()).catch(done);
	});

	describe('Страница администрирования', () => {

		it('содержит сведения о тестовых конечных автоматах', () => {
			return testGet(uiUri).then((data) => {
				data.should.include('Hello, world!')
					.and.include('Ping, pong')
					.and.include('Multiple endpoints')
					.and.include('Cycled steps')
					.and.include('Session test');
			});
		});

		it('позволяет получить настройки через API', () => {
			return testGet(`${uiUri}/settings`, true).then(
				(body) => {
					body.should.have.property('settings');
					body.should.have.property('services');
				}
			);
		});

		it('позволяет сохранить настройки через API', () => {
			return testGet(`${uiUri}/settings`, true)
				.then((data) => {
					return testPut(`${uiUri}/settings`, data, undefined, true).then(
						(body) => {
							body.should.have.property('settings');
							body.should.have.property('services');
						}
					);
				});
		});

		it('позволяет сгенерировать своё содержимое через API', () => {
			return testGet(`${uiUri}/settings`, true).then(
				(body) => {
					return testPost(`${uiUri}/render/admin`, body, undefined, true).then((html) => {
						html.should.include('data-id="1003"');
					});
				}
			);
		});

	});

});

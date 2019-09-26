'use strict';

const settingsModule = req('modules/settings');

describe('Модуль настроек', () => {

	it('позволяет загрузить все настройки сразу', () => {
		let settings = settingsModule.load();
		settings.should.have.nested.property('services[0].name');
		settings.should.have.nested.property('application.port');
	});

	it('позволяет сохранить все настройки сразу', () => {
		let settings = settingsModule.load();
		settingsModule.save(settings);
		settings = settingsModule.load();
		settings.should.have.nested.property('services[0].name');
		settings.should.have.nested.property('application.port');
	});

	it('позволяет загрузить конкретные настройки', () => {
		let settings = settingsModule.load('application');
		settings.should.contain.keys('port');
	});

	it('позволяет сохранить конкретные настройки', () => {
		let settings = settingsModule.load('application');
		settingsModule.save(settings, 'application');
		settings = settingsModule.load('application');
		settings.should.contain.keys('port');
	});

});

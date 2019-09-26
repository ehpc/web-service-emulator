'use strict';

const Event = req('classes/event');

describe('Класс для представления события конечного автомата', () => {

	let eventA = new Event('/', 'SomeInputA');

	it('имеет строковое представление', () => {
		eventA.toString().should.equal('/:SomeInputA');
	});

});

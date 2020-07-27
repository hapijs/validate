'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const Joi = require('..');
const Common = require('../lib/common');
const Template = require('../lib/template');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Common', () => {

    describe('assertOptions', () => {

        it('validates null', () => {

            expect(() => Common.assertOptions()).to.throw('Options must be of type object');
        });
    });

    describe('validateArg', () => {

        it('returns nothing if valid', () => {

            const value = 1234;
            const assert = Joi.number();

            expect(Common.validateArg(value, null, { assert })).to.not.exist();
        });

        it('returns error message if invalid', () => {

            const value = 1234.5;
            const assert = Joi.number().integer();

            expect(Common.validateArg(value, null, { assert })).to.equal('"value" must be an integer');
        });
    });

    describe('preferences', () => {

        it('uses the provided messages value', () => {

            const { messages } = Common.preferences({}, { messages: 'custom value' });
            expect(messages.source).to.equal('custom value');
        });

        it('uses the provided messages template value', () => {

            const messageTemplate = new Template('custom template value');
            const { messages } = Common.preferences({}, { messages: messageTemplate });
            expect(messages.source).to.equal('custom template value');
        });

        it('uses the provided messages value by language', () => {

            const messageByLanguage = { english: { 'number.min': 'custom message for number.min' } };
            const defaultMessagesByLanguage = { english: { 'number.min': 'default message for number.min' } };
            const { messages } = Common.preferences({ messages: defaultMessagesByLanguage }, { messages: messageByLanguage });
            expect(messages.english['number.min'].source).to.equal('custom message for number.min');

        });

        it('throws with an invalid messages value', () => {

            expect(() => Common.preferences({ messages: [] }, { messages: 'single string error' })).to.throw('Cannot set single message string');
        });

        it('throws with an invalid messages template value', () => {

            const messageTemplate = new Template('custom template value');
            expect(() => Common.preferences({ messages: [] }, { messages: messageTemplate })).to.throw('Cannot set single message template');
        });

        it('throws with invalid messages options', () => {

            expect(() => Common.preferences({ messages: [] }, { messages: true })).to.throw('Invalid message options');
            expect(() => Common.preferences({ messages: [] }, { messages: { code: true } })).to.throw('Invalid message for code');
        });
    });
});

'use strict';

const Code = require('@hapi/code');
const Joi = require('..');
const Lab = require('@hapi/lab');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('cast', () => {

    describe('schema()', () => {

        it('compiles null schema', () => {

            Helper.validate(Joi.compile(null), [
                ['a', false, {
                    message: '"value" must be one of [null]',
                    path: [],
                    type: 'any.only',
                    context: { value: 'a', valids: [null], label: 'value' }
                }],
                [null, true]
            ]);
        });

        it('compiles number literal', () => {

            Helper.validate(Joi.compile(5), [
                [6, false, {
                    message: '"value" must be one of [5]',
                    path: [],
                    type: 'any.only',
                    context: { value: 6, valids: [5], label: 'value' }
                }],
                [5, true]
            ]);
        });

        it('compiles string literal', () => {

            Helper.validate(Joi.compile('5'), [
                ['6', false, {
                    message: '"value" must be one of [5]',
                    path: [],
                    type: 'any.only',
                    context: { value: '6', valids: ['5'], label: 'value' }
                }],
                ['5', true]
            ]);
        });

        it('compiles boolean literal', () => {

            Helper.validate(Joi.compile(true), [
                [false, false, {
                    message: '"value" must be one of [true]',
                    path: [],
                    type: 'any.only',
                    context: { value: false, valids: [true], label: 'value' }
                }],
                [true, true]
            ]);
        });

        it('compiles date literal', () => {

            const now = Date.now();
            const dnow = new Date(now);
            Helper.validate(Joi.compile(dnow), [
                [new Date(now), true],
                [now, true, new Date(now)],
                [now * 2, false, {
                    message: `"value" must be one of [${dnow.toISOString()}]`,
                    path: [],
                    type: 'any.only',
                    context: { value: new Date(now * 2), valids: [dnow], label: 'value' }
                }]
            ]);
        });

        it('compile [null]', () => {

            const schema = Joi.compile([null]);
            Helper.equal(schema, Joi.valid(Joi.override, null));
        });

        it('compile [1]', () => {

            const schema = Joi.compile([1]);
            Helper.equal(schema, Joi.valid(Joi.override, 1));
        });

        it('compile ["a"]', () => {

            const schema = Joi.compile(['a']);
            Helper.equal(schema, Joi.valid(Joi.override, 'a'));
        });

        it('compile [null, null, null]', () => {

            const schema = Joi.compile([null]);
            Helper.equal(schema, Joi.valid(Joi.override, null));
        });

        it('compile [1, 2, 3]', () => {

            const schema = Joi.compile([1, 2, 3]);
            Helper.equal(schema, Joi.valid(Joi.override, 1, 2, 3));
        });

        it('compile ["a", "b", "c"]', () => {

            const schema = Joi.compile(['a', 'b', 'c']);
            Helper.equal(schema, Joi.valid(Joi.override, 'a', 'b', 'c'));
        });

        it('compile [null, "a", 1, true]', () => {

            const schema = Joi.compile([null, 'a', 1, true]);
            Helper.equal(schema, Joi.valid(Joi.override, null, 'a', 1, true));
        });
    });

    describe('compile()', () => {

        it('compiles object with plain keys', () => {

            const schema = {
                a: 1
            };

            expect(Joi.isSchema(schema)).to.be.false();

            const compiled = Joi.compile(schema);
            expect(Joi.isSchema(compiled)).to.be.true();
        });

        it('compiles object with schema keys', () => {

            const schema = {
                a: Joi.number()
            };

            expect(Joi.isSchema(schema)).to.be.false();

            const compiled = Joi.compile(schema);
            expect(Joi.isSchema(compiled)).to.be.true();
        });
    });
});

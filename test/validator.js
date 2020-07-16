'use strict';

const Code = require('@hapi/code');
const Joi = require('..');
const Lab = require('@hapi/lab');

const Helper = require('./helper');

const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Validator', () => {

    describe('finalize()', () => {

        it('applies raw after validation', () => {

            const schema = Joi.object({
                a: Joi.number().raw(),
                b: Joi.ref('a')
            });

            expect(schema.validate({ a: '5', b: 5 }).value).to.equal({ a: '5', b: 5 });
        });
    });

    describe('Shadow', () => {

        it('ignores result flags on root values', () => {

            const schema = Joi.string().strip();
            Helper.validate(schema, [['xyz', true, undefined]]);
        });

        it('reaches deep into shadow', () => {

            const schema = Joi.object({
                a: {
                    b: {
                        c: {
                            d: {
                                e: Joi.number().raw()
                            },
                            g: Joi.boolean().raw()
                        }
                    }
                },
                f: Joi.ref('a.b.c.d.e'),
                h: Joi.ref('a.b.c.g')
            });

            const value = { a: { b: { c: { d: { e: '100' }, g: 'TRUE' } } }, f: 100, h: true };

            expect(schema.validate(value).value).to.equal(value);
        });
    });
});

'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');
const Modify = require('../lib/modify');
const Extend = require('../lib/extend');
const Ref = require('../lib/ref');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Modify', () => {

    describe('id()', () => {

        it('unsets id', () => {

            const schema = Joi.any().id('x');
            Helper.equal(schema.id(), Joi.any());
        });

        it('errors on invalid id', () => {

            expect(() => Joi.any().id('a.b')).to.throw('id cannot contain period character');
        });

        it('overrides id', () => {

            const schema = Joi.any().id('x');
            Helper.equal(schema.id('y'), Joi.any().id('y'));
        });
    });

    describe('schema()', () => {

        it('returns undefined when schema is not modified', () => {

            const schema = Joi.string();

            expect(Modify.schema(schema, { each: (x) => x })).to.not.exist();
            expect(Modify.schema(schema, { each: () => undefined })).to.not.exist();
        });

        it('modifies schema with flags, terms, and rules', () => {

            const schema1 = Joi.object().keys({
                a: Joi.string(),
                b: Joi.string()
            })
                .pattern(/c/, Joi.number());

            const modified1 = Modify.schema(schema1, {
                each: () => Joi.any()
            });

            Helper.validate(modified1, [
                [{ a: null, b: null }, true],
                [{ c: 'x' }, true]
            ]);

            const schema2 = Joi.object()
                .assert(Joi.ref('.a'), Joi.valid(Joi.ref('b')).id('assertion'))
                .pattern(/a|b|c/, Joi.number().min(3));

            const modified2 = Modify.schema(schema2, {
                each: (x) => {

                    if (Ref.isRef(x)) {
                        return Joi.ref('.b');
                    }

                    if (x._flags.id === 'assertion') {
                        return Joi.valid(Joi.ref('c'));
                    }

                    return Joi.any();
                }
            });

            Helper.validate(modified2, [
                [{ a: 2, c: 3 }, true],
                [{ b: 'x', c: 'x' }, true],
                [{ b: 'x', c: 'y' }, false, {
                    message: '"value" is invalid because it failed to pass the assertion test',
                    path: [],
                    type: 'object.assert',
                    context: {
                        label: 'value',
                        message: undefined,
                        subject: Joi.ref('.b'),
                        value: {
                            b: 'x',
                            c: 'y'
                        }
                    }
                }]
            ]);

            const schema3 = Joi.object({
                a: Joi.string()
            })
                .unknown()
                .assert('a', 'x');

            const modified3 = Modify.schema(schema3, {
                each: (x) => {

                    return Ref.isRef(x) ? Joi.ref('.c') : Joi.any();
                }
            });

            Helper.validate(modified3, [
                [{ a: 'x' }, true],
                [{ c: 'x' }, true]
            ]);

            const schema4 = Joi.object({
                a: Joi.string()
            })
                .empty(Joi.string());

            const modified4 = Modify.schema(schema4, {
                each: (x) => x.min(2)
            });

            Helper.validate(modified4, [
                [{ a: 'xx' }, true],
                [{ a: 'x' }, false, {
                    context: {
                        encoding: undefined,
                        key: 'a',
                        label: 'a',
                        limit: 2,
                        value: 'x'
                    },
                    message: '"a" length must be at least 2 characters long',
                    path: ['a'],
                    type: 'string.min'
                }],
                ['y', false, {
                    context: {
                        label: 'value',
                        type: 'object',
                        value: 'y'
                    },
                    message: '"value" must be of type object',
                    path: [],
                    type: 'object.base'
                }]
            ]);

            expect(modified4.validate('yy').value).to.not.exist();
        });

        it('changes multiple schemas in different sources', () => {

            const schema = Extend.type(Joi.any(), {
                coerce(value, helpers) {

                    const swap = helpers.schema.$_getFlag('swap');
                    if (swap &&
                        swap.$_match(value, helpers.state.nest(swap), helpers.prefs)) {

                        return { value: ['swapped'] };
                    }
                },
                terms: {
                    x: { init: [] }
                },
                rules: {
                    swap: {
                        method(schemaInput) {

                            return this.$_setFlag('swap', this.$_compile(schemaInput));
                        }
                    },
                    pattern: {
                        method(schemaInput) {

                            return this.$_addRule({ name: 'pattern', args: { schema: this.$_compile(schemaInput) } });
                        },
                        validate() { }
                    },
                    term: {
                        method(schemaInput) {

                            this.$_terms.x.push(schemaInput);
                            return this;
                        }
                    }
                }
            })
                .swap(Joi.number())
                .empty(Joi.object())
                .pattern(Joi.binary())
                .term(Joi.number());

            const each = (item) => item.min(10);

            expect(schema.$_modify({ each, ref: false, schema: false })).to.equal(schema);

            const modified = schema.$_modify({ each, ref: false });

            // This test originates from joi and originally confirmed the
            // schema using describe(), which is not supported by this module.

            expect(modified).to.part.contain({
                _flags: {
                    empty: {
                        type: 'object',
                        _rules: [{ args: { limit: 10 }, name: 'min' }]
                    },
                    swap: {
                        type: 'number',
                        _rules: [{ args: { limit: 10 }, name: 'min' }]
                    }
                },
                _rules: [{
                    name: 'pattern',
                    args: {
                        schema: {
                            type: 'binary',
                            _rules: [{ args: { limit: 10 }, name: 'min' }]
                        }
                    }
                }],
                _terms: {
                    x: [
                        {
                            type: 'number',
                            _rules: [{ args: { limit: 10 }, name: 'min' }]
                        }
                    ]
                }
            });
        });
    });
});

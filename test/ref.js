'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('ref', () => {

    it('detects references', () => {

        expect(Joi.isRef(Joi.ref('a.b'))).to.be.true();
    });

    it('throws when reference reaches beyond the schema root', () => {

        const schema = Joi.object({
            a: Joi.any(),
            b: Joi.ref('...c')
        });

        expect(() => schema.validate({ a: 1, b: 2 })).to.throw('Invalid reference exceeds the schema root: ref:...c');
    });

    it('reaches own property', () => {

        const schema = Joi.object({
            x: Joi.alternatives([
                Joi.number(),
                Joi.object({
                    a: Joi.boolean().required()
                })
                    .when('.a', {
                        is: true,
                        then: {
                            b: Joi.string().required()
                        }
                    })
            ])
        });

        Helper.validate(schema, [
            [{ x: 1 }, true],
            [{ x: { a: true, b: 'x' } }, true]
        ]);
    });

    it('reaches parent', () => {

        const schema = Joi.object({
            a: Joi.any(),
            a1: Joi.ref('a'),
            a2: Joi.ref('..a')
        });

        Helper.validate(schema, [
            [
                {
                    a: 1,
                    a1: 1,
                    a2: 1
                }, true
            ]
        ]);
    });

    it('reaches grandparent', () => {

        const schema = Joi.object({
            a: Joi.any(),
            b: {
                a1: Joi.ref('...a'),
                a2: Joi.ref('...a')
            }
        });

        Helper.validate(schema, [
            [
                {
                    a: 1,
                    b: {
                        a1: 1,
                        a2: 1
                    }
                }, true
            ]
        ]);
    });

    it('reaches literal', () => {

        const schema = Joi.object({
            a: Joi.any(),
            b: {
                '...a': Joi.any(),
                c: Joi.ref('...a', { separator: false })
            }
        });

        Helper.validate(schema, [
            [
                {
                    a: 1,
                    b: {
                        '...a': 2,
                        c: 2
                    }
                }, true
            ]
        ]);
    });

    it('reaches ancestor literal', () => {

        const schema = Joi.object({
            a: Joi.any(),
            '...a': Joi.any(),
            b: {
                '...a': Joi.any(),
                c: Joi.ref('...a', { separator: false, ancestor: 2 })
            }
        });

        Helper.validate(schema, [
            [
                {
                    a: 1,
                    '...a': 3,
                    b: {
                        '...a': 2,
                        c: 3
                    }
                }, true
            ]
        ]);
    });

    it('reaches any level of the relative value structure', () => {

        const ix = Joi.ref('...i');

        const schema = Joi.object({
            a: {
                b: {
                    c: {
                        d: Joi.any()
                    },
                    e: 2,
                    dx: Joi.ref('c.d'),
                    ex: Joi.ref('..e'),
                    ix,
                    gx: Joi.ref('....f.g'),
                    hx: Joi.ref('....h')
                },
                i: Joi.any()
            },
            f: {
                g: Joi.any()
            },
            h: Joi.any()
        });

        Helper.validate(schema, [
            [
                {
                    a: {
                        b: {
                            c: {
                                d: 1
                            },
                            e: 2,
                            dx: 1,
                            ex: 2,
                            gx: 3,
                            hx: 4,
                            ix: 5
                        },
                        i: 5
                    },
                    f: {
                        g: 3
                    },
                    h: 4
                }, true
            ],
            [
                {
                    a: {
                        b: {
                            c: {
                                d: 1
                            },
                            e: 2,
                            dx: 1,
                            ex: 2,
                            gx: 3,
                            hx: 4,
                            ix: 5
                        },
                        i: 10
                    },
                    f: {
                        g: 3
                    },
                    h: 4
                }, false, {
                    message: '"a.b.ix" must be one of [ref:...i]',
                    path: ['a', 'b', 'ix'],
                    type: 'any.only',
                    context: {
                        value: 5,
                        valids: [ix],
                        key: 'ix',
                        label: 'a.b.ix'
                    }
                }
            ]
        ]);
    });

    it('reaches any level of the relative value structure (ancestor option)', () => {

        const ix = Joi.ref('i', { ancestor: 2 });

        const schema = Joi.object({
            a: {
                b: {
                    c: {
                        d: Joi.any()
                    },
                    e: 2,
                    dx: Joi.ref('c.d', { ancestor: 1 }),
                    ex: Joi.ref('e', { ancestor: 1 }),
                    ix,
                    gx: Joi.ref('f.g', { ancestor: 3 }),
                    hx: Joi.ref('h', { ancestor: 3 })
                },
                i: Joi.any()
            },
            f: {
                g: Joi.any()
            },
            h: Joi.any()
        });

        Helper.validate(schema, [
            [
                {
                    a: {
                        b: {
                            c: {
                                d: 1
                            },
                            e: 2,
                            dx: 1,
                            ex: 2,
                            gx: 3,
                            hx: 4,
                            ix: 5
                        },
                        i: 5
                    },
                    f: {
                        g: 3
                    },
                    h: 4
                }, true
            ],
            [
                {
                    a: {
                        b: {
                            c: {
                                d: 1
                            },
                            e: 2,
                            dx: 1,
                            ex: 2,
                            gx: 3,
                            hx: 4,
                            ix: 5
                        },
                        i: 10
                    },
                    f: {
                        g: 3
                    },
                    h: 4
                }, false, {
                    message: '"a.b.ix" must be one of [ref:...i]',
                    path: ['a', 'b', 'ix'],
                    type: 'any.only',
                    context: {
                        value: 5,
                        valids: [ix],
                        key: 'ix',
                        label: 'a.b.ix'
                    }
                }
            ]
        ]);
    });

    it('reaches own key value', () => {

        const object = Joi.object().schema('object');
        const schema = Joi.object({
            key: Joi.object().when('.', {
                is: Joi.object().schema(),
                then: object,
                otherwise: Joi.object().pattern(/.*/, object)
            })
                .required()
        });

        Helper.validate(schema, [
            [{ key: object }, true],
            [{ key: 1 }, false, {
                message: '"key" must be of type object',
                type: 'object.base',
                path: ['key'],
                context: {
                    key: 'key',
                    label: 'key',
                    value: 1,
                    type: 'object'
                }
            }],
            [{ key: Joi.number() }, false, {
                message: '"key" must be a Joi schema of object type',
                type: 'object.schema',
                path: ['key'],
                context: {
                    key: 'key',
                    label: 'key',
                    type: 'object',
                    value: Joi.number()
                }
            }],
            [{ key: { a: 1 } }, false, {
                message: '"key.a" must be of type object',
                type: 'object.base',
                path: ['key', 'a'],
                context: {
                    key: 'a',
                    label: 'key.a',
                    value: 1,
                    type: 'object'
                }
            }],
            [{ key: { a: {} } }, false, {
                message: '"key.a" must be a Joi schema of object type',
                type: 'object.schema',
                path: ['key', 'a'],
                context: {
                    key: 'a',
                    label: 'key.a',
                    type: 'object',
                    value: {}
                }
            }]
        ]);
    });

    it('reaches into set and map', () => {

        const schema = Joi.object({
            a: {
                b: Joi.array()
                    .items({
                        x: Joi.number(),
                        y: Joi.object().cast('map')
                    })
                    .cast('set')
            },
            d: Joi.ref('a.b.2.y.w', { iterables: true })
        });

        const value = {
            a: {
                b: [
                    { x: 1 },
                    { x: 2 },
                    {
                        y: {
                            v: 4,
                            w: 5
                        }
                    }
                ]
            },
            d: 5
        };

        Helper.validate(schema, [[value, true, {
            a: {
                b: new Set([
                    { x: 1 },
                    { x: 2 },
                    {
                        y: new Map([
                            ['v', 4],
                            ['w', 5]
                        ])
                    }
                ])
            },
            d: 5
        }]]);

        value.d = 6;
        Helper.validate(schema, [[value, false, '"d" must be one of [ref:a.b.2.y.w]']]);
    });

    it('reaches root', () => {

        const schema = Joi.object({
            a: Joi.any(),
            b: {
                c: Joi.ref('/a'),
                d: Joi.ref('@a', { prefix: { root: '@' } })
            }
        });

        Helper.validate(schema, [
            [{ a: 1, b: { c: 1, d: 1 } }, true]
        ]);
    });

    it('errors on missing iterables flag when reaching into set and map', () => {

        const schema = Joi.object({
            a: {
                b: Joi.array()
                    .items({
                        x: Joi.number(),
                        y: Joi.object().cast('map')
                    })
                    .cast('set')
            },
            d: Joi.ref('a.b.2.y.w')
        });

        const value = {
            a: {
                b: [
                    { x: 1 },
                    { x: 2 },
                    {
                        y: {
                            v: 4,
                            w: 5
                        }
                    }
                ]
            },
            d: 5
        };

        Helper.validate(schema, [[value, false, '"d" must be one of [ref:a.b.2.y.w]']]);
    });

    it('errors on invalid separator)', () => {

        expect(() => Joi.ref('x', { separator: 0 })).to.throw('Invalid separator');
        expect(() => Joi.ref('x', { separator: '' })).to.throw('Invalid separator');
        expect(() => Joi.ref('x', { separator: '$$' })).to.throw('Invalid separator');
    });

    it('errors on prefix + ancestor option)', () => {

        expect(() => Joi.ref('..x', { ancestor: 0 })).to.throw('Cannot combine prefix with ancestor option');
    });

    it('errors on root with ancestor prefix', () => {

        expect(() => Joi.ref('/.x')).to.throw('Cannot specify relative path with root prefix');
        expect(() => Joi.ref('/.x', { separator: false })).to.not.throw();
    });

    it('errors on ancestor circular dependency', () => {

        const schema = {
            a: {
                x: Joi.any(),
                b: {
                    c: {
                        d: Joi.ref('....b.x')
                    }
                }
            },
            b: {
                x: Joi.any(),
                y: {
                    z: {
                        o: Joi.ref('....a.x')
                    }
                }
            }
        };

        expect(() => Joi.compile(schema)).to.throw('Item cannot come after itself: b (a.b)');
    });

    it('references array length', () => {

        const ref = Joi.ref('length');
        const schema = Joi.object({
            x: Joi.array().items(Joi.number().valid(ref))
        });

        Helper.validate(schema, [
            [{ x: [1] }, true],
            [{ x: [2, 2] }, true],
            [{ x: [2, 2, 2] }, false, {
                message: '"x[0]" must be one of [ref:length]',
                path: ['x', 0],
                type: 'any.only',
                context: {
                    value: 2,
                    valids: [ref],
                    key: 0,
                    label: 'x[0]'
                }
            }]
        ]);
    });

    it('splits when based on own array length', () => {

        const pair = Joi.array().items(2);
        const lucky = Joi.array().items(7);

        const schema = Joi.object({
            x: Joi.array().when('.length', { is: 2, then: pair, otherwise: lucky })
        });

        Helper.validate(schema, [
            [{ x: [7] }, true],
            [{ x: [7, 7, 7] }, true],
            [{ x: [2, 2] }, true],
            [{ x: [2, 2, 2] }, false, {
                message: '"x[0]" must be one of [7]',
                path: ['x', 0],
                type: 'any.only',
                context: { value: 2, valids: [7], key: 0, label: 'x[0]' }
            }]
        ]);
    });

    it('references array item', () => {

        const ref = Joi.ref('0');
        const schema = Joi.array().ordered(Joi.number(), Joi.number().min(ref));

        Helper.validate(schema, [
            [[1, 2], true],
            [[10, 20], true],
            [[10, 5], false, {
                message: '"[1]" must be greater than or equal to ref:0',
                path: [1],
                type: 'number.min',
                context: { limit: ref, value: 5, key: 1, label: '[1]' }
            }]
        ]);
    });

    it('references object own child', () => {

        const ref = Joi.ref('.length');
        const schema = Joi.object({
            length: Joi.number().required()
        })
            .length(ref)
            .unknown();

        expect(schema._refs.refs).to.equal([]);     // Does not register reference to itself

        Helper.validate(schema, [
            [{ length: 1 }, true],
            [{ length: 2, x: 3 }, true],
            [{ length: 2, x: 3, y: 4 }, false, {
                message: '"value" must have ref:.length keys',
                path: [],
                type: 'object.length',
                context: {
                    value: { length: 2, x: 3, y: 4 },
                    limit: ref,
                    label: 'value'
                }
            }]
        ]);
    });

    it('uses ref as a valid value', () => {

        const ref = Joi.ref('b');
        const schema = Joi.object({
            a: ref,
            b: Joi.any()
        });

        Helper.validate(schema, [[{ a: 5, b: 6 }, false, {
            message: '"a" must be one of [ref:b]',
            path: ['a'],
            type: 'any.only',
            context: { value: 5, valids: [ref], label: 'a', key: 'a' }
        }]]);

        Helper.validate(schema, [
            [{ a: 5 }, false, {
                message: '"a" must be one of [ref:b]',
                path: ['a'],
                type: 'any.only',
                context: { value: 5, valids: [ref], label: 'a', key: 'a' }
            }],
            [{ b: 5 }, true],
            [{ a: 5, b: 5 }, true],
            [{ a: '5', b: '5' }, true]
        ]);
    });

    it('sets adjust function', () => {

        const adjust = (v) => 2 * v;
        const ref = Joi.ref('b', { adjust });
        const schema = Joi.object({
            a: ref,
            b: Joi.number()
        });

        Helper.validate(schema, [
            [{ b: 5 }, true],
            [{ a: 10, b: 5 }, true],
            [{ a: 10, b: '5' }, true, { a: 10, b: 5 }],
            [{ a: 5 }, false, {
                message: '"a" must be one of [ref:b]',
                path: ['a'],
                type: 'any.only',
                context: { value: 5, valids: [ref], label: 'a', key: 'a' }
            }],
            [{ a: 5, b: 5 }, false, {
                message: '"a" must be one of [ref:b]',
                path: ['a'],
                type: 'any.only',
                context: { value: 5, valids: [ref], label: 'a', key: 'a' }
            }]
        ]);
    });

    it('sets map', () => {

        const map = [[5, 10]];
        const ref = Joi.ref('b', { map });
        const schema = Joi.object({
            a: ref,
            b: Joi.number()
        });

        Helper.validate(schema, [
            [{ b: 5 }, true],
            [{ a: 10, b: 5 }, true],
            [{ a: 10, b: '5' }, true, { a: 10, b: 5 }],
            [{ a: 5 }, false, {
                message: '"a" must be one of [ref:b]',
                path: ['a'],
                type: 'any.only',
                context: { value: 5, valids: [ref], label: 'a', key: 'a' }
            }],
            [{ a: 5, b: 5 }, false, {
                message: '"a" must be one of [ref:b]',
                path: ['a'],
                type: 'any.only',
                context: { value: 5, valids: [ref], label: 'a', key: 'a' }
            }]
        ]);
    });

    it('uses ref as a valid value (empty key)', () => {

        const ref = Joi.ref('');
        const schema = Joi.object({
            a: ref,
            '': Joi.any()
        });

        Helper.validate(schema, [
            [{ a: 5, '': 6 }, false, {
                message: '"a" must be one of [ref:..]',
                path: ['a'],
                type: 'any.only',
                context: { value: 5, valids: [ref], label: 'a', key: 'a' }
            }],
            [{ a: 5 }, false, {
                message: '"a" must be one of [ref:..]',
                path: ['a'],
                type: 'any.only',
                context: { value: 5, valids: [ref], label: 'a', key: 'a' }
            }],
            [{ '': 5 }, true],
            [{ a: 5, '': 5 }, true],
            [{ a: '5', '': '5' }, true]
        ]);
    });

    it('uses ref with nested keys as a valid value', () => {

        const ref = Joi.ref('b.c');
        const schema = Joi.object({
            a: ref,
            b: {
                c: Joi.any()
            }
        });

        const err = schema.validate({ a: 5, b: { c: 6 } }).error;

        expect(err).to.be.an.error('"a" must be one of [ref:b.c]');
        expect(err.details).to.equal([{
            message: '"a" must be one of [ref:b.c]',
            path: ['a'],
            type: 'any.only',
            context: { value: 5, valids: [ref], label: 'a', key: 'a' }
        }]);

        Helper.validate(schema, [
            [{ a: 5 }, false, {
                message: '"a" must be one of [ref:b.c]',
                path: ['a'],
                type: 'any.only',
                context: { value: 5, valids: [ref], label: 'a', key: 'a' }
            }],
            [{ b: { c: 5 } }, true],
            [{ a: 5, b: 5 }, false, {
                message: '"b" must be of type object',
                path: ['b'],
                type: 'object.base',
                context: { label: 'b', key: 'b', value: 5, type: 'object' }
            }],
            [{ a: '5', b: { c: '5' } }, true]
        ]);
    });

    it('uses ref with combined nested keys in sub child', () => {

        const ref = Joi.ref('b.c');
        expect(ref.root).to.equal('b');

        const schema = Joi.object({
            a: ref,
            b: {
                c: Joi.any()
            }
        });

        const input = { a: 5, b: { c: 5 } };
        Helper.validate(schema, [[input, true]]);

        const parent = Joi.object({
            e: schema
        });

        Helper.validate(parent, [[{ e: input }, true]]);
    });

    it('uses ref reach options', () => {

        const ref = Joi.ref('b/c', { separator: '/' });
        expect(ref.root).to.equal('b');

        const schema = Joi.object({
            a: ref,
            b: {
                c: Joi.any()
            }
        });

        Helper.validate(schema, [[{ a: 5, b: { c: 5 } }, true]]);
    });

    it('ignores the order in which keys are defined', () => {

        const ab = Joi.object({
            a: {
                c: Joi.number()
            },
            b: Joi.ref('a.c')
        });

        Helper.validate(ab, [[{ a: { c: '5' }, b: 5 }, true, { a: { c: 5 }, b: 5 }]]);

        const ba = Joi.object({
            b: Joi.ref('a.c'),
            a: {
                c: Joi.number()
            }
        });

        Helper.validate(ba, [[{ a: { c: '5' }, b: 5 }, true, { a: { c: 5 }, b: 5 }]]);
    });

    it('uses ref as default value', () => {

        const schema = Joi.object({
            a: Joi.any().default(Joi.ref('b')),
            b: Joi.any()
        });

        const value = schema.validate({ b: 6 }).value;
        expect(value).to.equal({ a: 6, b: 6 });
    });

    it('uses ref mixed with normal values', () => {

        const schema = Joi.object({
            a: Joi.number().valid(1, Joi.ref('b')),
            b: Joi.any()
        });

        expect(schema.validate({ a: 6, b: 6 }).value).to.equal({ a: 6, b: 6 });
        expect(schema.validate({ a: 1, b: 6 }).value).to.equal({ a: 1, b: 6 });
        Helper.validate(schema, [[{ a: 6, b: 1 }, false, '"a" must be one of [1, ref:b]']]);
    });

    it('uses ref as default value regardless of order', () => {

        const ab = Joi.object({
            a: Joi.any().default(Joi.ref('b')),
            b: Joi.number()
        });

        const value = ab.validate({ b: '6' }).value;
        expect(value).to.equal({ a: 6, b: 6 });

        const ba = Joi.object({
            b: Joi.number(),
            a: Joi.any().default(Joi.ref('b'))
        });

        const value2 = ba.validate({ b: '6' }).value;
        expect(value2).to.equal({ a: 6, b: 6 });
    });

    it('ignores the order in which keys are defined with alternatives', () => {

        const ref1 = Joi.ref('a.c');
        const ref2 = Joi.ref('c');
        const a = Joi.object({ c: Joi.number() });
        const b = Joi.alternatives([ref1, ref2]);
        const c = Joi.number();

        for (const schema of [{ a, b, c }, { b, a, c }, { b, c, a }, { a, c, b }, { c, a, b }, { c, b, a }]) {
            Helper.validate(Joi.object().keys(schema), [
                [{ a: {} }, true],
                [{ a: { c: '5' }, b: 5 }, true, { a: { c: 5 }, b: 5 }],
                [{ a: { c: '5' }, b: 6, c: '6' }, true, { a: { c: 5 }, b: 6, c: 6 }],
                [{ a: { c: '5' }, b: 7, c: '6' }, false, {
                    message: '"b" must be one of [ref:a.c, ref:c]',
                    type: 'alternatives.types',
                    path: ['b'],
                    context: {
                        key: 'b',
                        label: 'b',
                        value: 7,
                        types: [ref1, ref2]
                    }
                }]
            ]);
        }
    });

    it('uses context as default value', () => {

        const schema = Joi.object({
            a: Joi.any().default(Joi.ref('$x')),
            b: Joi.any()
        });

        const value = schema.validate({ b: 6 }, { context: { x: 22 } }).value;
        expect(value).to.equal({ a: 22, b: 6 });
    });

    it('uses context as default value with custom prefix', () => {

        const schema = Joi.object({
            a: Joi.any().default(Joi.ref('@x', { prefix: { global: '@' } })),
            b: Joi.any()
        });

        const value = schema.validate({ b: 6 }, { context: { x: 22 } }).value;
        expect(value).to.equal({ a: 22, b: 6 });
    });

    it('uses context as a valid value', () => {

        const ref = Joi.ref('$x');
        const schema = Joi.object({
            a: ref,
            b: Joi.any()
        });

        Helper.validate(schema, { context: { x: 22 } }, [
            [{ a: 5, b: 6 }, false, {
                message: '"a" must be one of [ref:global:x]',
                path: ['a'],
                type: 'any.only',
                context: { value: 5, valids: [ref], label: 'a', key: 'a' }
            }],
            [{ a: 5 }, false, {
                message: '"a" must be one of [ref:global:x]',
                path: ['a'],
                type: 'any.only',
                context: { value: 5, valids: [ref], label: 'a', key: 'a' }
            }],
            [{ a: 22 }, true],
            [{ b: 5 }, true],
            [{ a: 22, b: 5 }, true],
            [{ a: '22', b: '5' }, false, {
                message: '"a" must be one of [ref:global:x]',
                path: ['a'],
                type: 'any.only',
                context: { value: '22', valids: [ref], label: 'a', key: 'a' }
            }]
        ]);
    });

    it('uses context in when condition', () => {

        const schema = Joi.object({
            a: Joi.boolean().when('$x', { is: Joi.exist(), otherwise: Joi.forbidden() })
        });

        Helper.validate(schema, [
            [{}, true],
            [{ a: 'x' }, false, {
                message: '"a" is not allowed',
                path: ['a'],
                type: 'any.unknown',
                context: { label: 'a', key: 'a', value: 'x' }
            }],
            [{ a: true }, false, {
                message: '"a" is not allowed',
                path: ['a'],
                type: 'any.unknown',
                context: { label: 'a', key: 'a', value: true }
            }]
        ]);

        Helper.validate(schema, { context: {} }, [
            [{}, true],
            [{ a: 'x' }, false, {
                message: '"a" is not allowed',
                path: ['a'],
                type: 'any.unknown',
                context: { label: 'a', key: 'a', value: 'x' }
            }],
            [{ a: true }, false, {
                message: '"a" is not allowed',
                path: ['a'],
                type: 'any.unknown',
                context: { label: 'a', key: 'a', value: true }
            }]
        ]);

        Helper.validate(schema, { context: { x: 1 } }, [
            [{}, true],
            [{ a: 'x' }, false, {
                message: '"a" must be a boolean',
                path: ['a'],
                type: 'boolean.base',
                context: { label: 'a', key: 'a', value: 'x' }
            }],
            [{ a: true }, true]
        ]);
    });

    it('uses nested context in when condition', () => {

        const schema = Joi.object({
            a: Joi.boolean().when('$x.y', { is: Joi.exist(), otherwise: Joi.forbidden() })
        });

        Helper.validate(schema, [
            [{}, true],
            [{ a: 'x' }, false, {
                message: '"a" is not allowed',
                path: ['a'],
                type: 'any.unknown',
                context: { label: 'a', key: 'a', value: 'x' }
            }],
            [{ a: true }, false, {
                message: '"a" is not allowed',
                path: ['a'],
                type: 'any.unknown',
                context: { label: 'a', key: 'a', value: true }
            }]
        ]);

        Helper.validate(schema, { context: {} }, [
            [{}, true],
            [{ a: 'x' }, false, {
                message: '"a" is not allowed',
                path: ['a'],
                type: 'any.unknown',
                context: { label: 'a', key: 'a', value: 'x' }
            }],
            [{ a: true }, false, {
                message: '"a" is not allowed',
                path: ['a'],
                type: 'any.unknown',
                context: { label: 'a', key: 'a', value: true }
            }]
        ]);

        Helper.validate(schema, { context: { x: 1 } }, [
            [{}, true],
            [{ a: 'x' }, false, {
                message: '"a" is not allowed',
                path: ['a'],
                type: 'any.unknown',
                context: { label: 'a', key: 'a', value: 'x' }
            }],
            [{ a: true }, false, {
                message: '"a" is not allowed',
                path: ['a'],
                type: 'any.unknown',
                context: { label: 'a', key: 'a', value: true }
            }]
        ]);

        Helper.validate(schema, { context: { x: {} } }, [
            [{}, true],
            [{ a: 'x' }, false, {
                message: '"a" is not allowed',
                path: ['a'],
                type: 'any.unknown',
                context: { label: 'a', key: 'a', value: 'x' }
            }],
            [{ a: true }, false, {
                message: '"a" is not allowed',
                path: ['a'],
                type: 'any.unknown',
                context: { label: 'a', key: 'a', value: true }
            }]
        ]);

        Helper.validate(schema, { context: { x: { y: 1 } } }, [
            [{}, true],
            [{ a: 'x' }, false, {
                message: '"a" must be a boolean',
                path: ['a'],
                type: 'boolean.base',
                context: { label: 'a', key: 'a', value: 'x' }
            }],
            [{ a: true }, true]
        ]);
    });

    describe('clone()', () => {

        it('clones reference', () => {

            const ref = Joi.ref('a.b.c');
            const clone = ref.clone();
            expect(ref).to.equal(clone);
            expect(ref).to.not.shallow.equal(clone);
        });
    });

    describe('context()', () => {

        it('ignores global prefix when conflicts with separator', () => {

            expect(Joi.ref('$a$b', { separator: '$' })).to.equal({
                adjust: null,
                in: false,
                iterables: null,
                map: null,
                separator: '$',
                type: 'value',
                ancestor: 0,
                path: ['a', 'b'],
                depth: 2,
                key: 'a$b',
                root: 'a',
                display: 'ref:$a$b'
            });
        });

        it('ignores local prefix when conflicts with separator', () => {

            expect(Joi.ref('#a#b', { separator: '#' })).to.equal({
                adjust: null,
                in: false,
                iterables: null,
                map: null,
                separator: '#',
                type: 'value',
                ancestor: 0,
                path: ['a', 'b'],
                depth: 2,
                key: 'a#b',
                root: 'a',
                display: 'ref:#a#b'
            });
        });
    });

    describe('create()', () => {

        it('throws when key is missing', () => {

            expect(() => Joi.ref(5)).to.throw('Invalid reference key: 5');
        });

        it('finds root with default separator', () => {

            expect(Joi.ref('a.b.c').root).to.equal('a');
        });

        it('finds root with default separator and options', () => {

            expect(Joi.ref('a.b.c', {}).root).to.equal('a');
        });

        it('finds root with custom separator', () => {

            expect(Joi.ref('a+b+c', { separator: '+' }).root).to.equal('a');
        });

        it('respects custom local prefix', () => {

            expect(Joi.ref('+a.b.c', { prefix: { local: '+' } })).to.contain({
                type: 'local',
                key: 'a.b.c',
                root: 'a',
                path: ['a', 'b', 'c'],
                separator: '.'
            });
        });
    });
});

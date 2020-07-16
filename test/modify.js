'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');

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
});

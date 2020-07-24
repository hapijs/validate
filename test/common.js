'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const Joi = require('..');
const Common = require('../lib/common');


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
});

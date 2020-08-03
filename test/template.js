'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const Template = require('../lib/template');


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('template', () => {

    it('constructor throws with null character in source', () => {

        const fn = () => {

            new Template('\u0000');
        };

        expect(fn).to.throw();
    });

    it('isTemplate returns false when not a template', () => {

        expect(Template.isTemplate(null)).to.be.false();
    });

    it('_parse will parse {} templates', () => {

        const template = new Template('foo {raw} \\{esc\\}{');
        const parsed = template._template;

        expect(parsed[0]).to.equal('foo ');
        expect(parsed[1].raw).to.be.true();
        expect(parsed[1].ref.key).to.equal('raw');
        expect(parsed[2]).to.equal(' {esc}');
    });

    it('render will stringify a parsed template', () => {

        const template = new Template('foo {raw} \\{esc\\}{');
        const state = {
            path: 'test/',
            ancestors: ['test'],
            mainstay: {}
        };

        const rendered = template.render('test', state, null, null, { errors: { escapeHtml: true } });

        expect(rendered).to.equal('foo  {esc}');
    });

    it('render will stringify a parsed template and use error options', () => {

        const template = new Template('foo <html/> {raw} \\{esc\\}{');
        const state = {
            path: 'test/',
            ancestors: ['test'],
            mainstay: {}
        };

        // required for code coverage to test handing of errors option
        template._template[1].raw = false;
        let rendered = template.render('test', state, null, null, { errors: { escapeHtml: true } });
        expect(rendered).to.equal('foo <html/>  {esc}');
        rendered = template.render('test', state, null, null, {});
        expect(rendered).to.equal('foo <html/>  {esc}');
    });
});

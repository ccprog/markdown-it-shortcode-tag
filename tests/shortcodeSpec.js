var fs = require('fs');
var MarkdownIt = require('markdown-it');
var shortcode = require('../index.js');

describe("plugin usage", function () {
    var md;
    var standard = {
        render: function (params, env) {
            var out = '<pre>\nParams:\n';
            for (var entry in params) {
                out += entry + ': ' + params[entry] + ' (' + (typeof params[entry]) + ')\n';
            }
            out += 'Env:\n';
            for (var entry in env) {
                out += entry + ': ' + env[entry] + ' (' + (typeof env[entry]) + ')\n';
            }
            out += '</pre>';
            return out;
        }
    };

    beforeEach(function() {
        md = MarkdownIt({html: true});
    });

    describe("shortcode tag as block", function () {
        var source = fs.readFileSync('tests/fixtures/block.md', {encoding: 'utf8'});

        beforeEach(function () {
            md.use(shortcode, {standard: standard});
        });

        it("identifies tag", function () {
            var result = md.render(source);
            expect(result).toContain('<h1>Hello Shortcode</h1>');
            expect(result).not.toContain('<standard');
            expect(result).toContain('<pre>');
        });

        it("understands attributes", function () {
            var result = md.render(source, { 
                local: "test" 
            });
            expect(result).toContain('<pre>');
            expect(result).toContain('first: true (boolean)');
            expect(result).toContain('second: string (string)');
            expect(result).toContain('third: other (string)');
            expect(result).toContain('fourth: 3.7 (number)');
            expect(result).toContain('fifth: test (string)');
        });

        it("passes enviroment", function () {
            var result = md.render(source, {
                local: 'test'
            });
            expect(result).toContain('<pre>');
            expect(result).toContain('local: test (string)');
        });

        it("ignores closing tags", function () {
            var result = md.render(source);
            expect(result).toContain('</standard>');
        });
    });

    describe("options", function () {
        var source = fs.readFileSync('tests/fixtures/block.md', {encoding: 'utf8'});
            
        beforeEach(function() {
            var interpolator = function (expr, env) { 
                return "interpolated("+ env[expr] + ")"; 
            }
            md.use(shortcode, {standard: standard}, { interpolator });
        });

        it("should use the interpolator option to process {expression} values", function () {
            var result = md.render(source, {
                local: "test"
            });
            
            expect(result).toContain("fifth: interpolated(test) (string)");
        });
    });

    describe("shortcode tag as inline", function () {
        var source = fs.readFileSync('tests/fixtures/inline.md', {encoding: 'utf8'});

        beforeEach(function () {
            md.use(shortcode, {standard: standard});
        });

        it("identifies tag", function () {
            var result = md.render(source);
            expect(result).toContain('<h1>Hello Shortcode</h1>');
            expect(result).not.toContain('<standard');
            expect(result).toContain('<p>It is <pre>');
        });

        it("understands attributes", function () {
            var result = md.render(source);
            expect(result).toContain('<pre>');
            expect(result).toContain('first: true (boolean)');
            expect(result).toContain('second: string (string)');
            expect(result).toContain('third: other (string)');
            expect(result).toContain('fourth: 3.7 (number)');
        });

        it("passes enviroment", function () {
            var result = md.render(source, {
                local: 'test'
            });
            expect(result).toContain('<pre>');
            expect(result).toContain('local: test (string)');
        });
    });

    describe("shortcode forced inline tag", function () {
        var source = fs.readFileSync('tests/fixtures/block.md', {encoding: 'utf8'});

        beforeEach(function () {
            md.use(shortcode, {standard: {inline: true, render: standard.render}});
        });

        it("identifies tag", function () {
            var result = md.render(source);
            expect(result).toContain('<h1>Hello Shortcode</h1>');
            expect(result).not.toContain('<standard');
            expect(result).toMatch(/<p>\s*<pre>/);
            expect(result).toMatch(/<\/pre>\s*<\/p>/);
        });

        it("understands attributes", function () {
            var result = md.render(source);
            expect(result).toContain('<pre>');
            expect(result).toContain('first: true (boolean)');
            expect(result).toContain('second: string (string)');
            expect(result).toContain('third: other (string)');
            expect(result).toContain('fourth: 3.7 (number)');
        });

        it("passes enviroment", function () {
            var result = md.render(source, {
                local: 'test'
            });
            expect(result).toContain('<pre>');
            expect(result).toContain('local: test (string)');
        });
    });

    it("ignores unknown or closing tags", function () {
        var source = fs.readFileSync('tests/fixtures/unknown.md', {encoding: 'utf8'});
        md.use(shortcode, {standard: standard});

        var result = md.render(source);
        expect(result).toContain('<h1>Hello Shortcode</h1>');
        expect(result).toContain('<careless thing>');
        expect(result).toContain('<unknown attr>ignore this</unknown>');
        expect(result).toContain('</standard>');
        expect(result).not.toContain('<pre>');
    });
});
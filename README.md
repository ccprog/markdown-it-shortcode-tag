# markdown-it-shortcode-tag

[![Build Status](https://travis-ci.org/ccprog/markdown-it-shortcode-tag.svg?branch=master)](https://travis-ci.org/ccprog/markdown-it-shortcode-tag)

With this plugin you can define shortcodes for arbitrary content to be rendered when parsing
markdown. The shortcodes take the form of _self-closing_ HTML5 tags:

```html
<custom first second="string" third=3.7>
```

You cannot write closing tags and consequently no inner content. Attributes are passed
to a rendering function you define for every tag to be interpreted:

```js
shortcodes.custom.render({
    first: true,
    second: "string",
    third: 3.7
}, env)
```

[html][1] must be enabled in markdown-it options. Otherwise, the tag will be rendered in
escaped form. With this option, unknown tags (or all, if the plugin is not active) are passed
through. This means that, as long as the tag is not defined in HTML5, it is ignored by browsers.

## Installation

```bash
$ npm install markdown-it-shortcode-tag --save
```


## API

```js
var shortcodes = {
    tag: {
        render: function (attrs, env) {...} [,
        inline: true ]
    } [,
    ...]
}

var md = require('markdown-it')({html: true})
        .use(require('markdown-it-shortcode-tag'), );


md.render(content, env);
```

- __tag__ - set a property name to identify shortcodes of the form `<tag ...>`. [HTML5 rules][2]
  for tag names apply.
- __render__ - function that returns the rendered shortcode
  - __attrs__ - Object with name-value pairs for all attributes listed in the tag.
    [HTML5 rules][3] for attribute syntax apply with one __caveat__: _unquoted_ attribute values
    are converted to numbers using `parseFloat()`.  
    Attributes without values are represented as boolean `true`, quoted attribute values as strings.
  - __env__ - the enviroment variable passed to markdown-it in a `md.render(content, env)` call.
- __inline__ - optional, if true the shortcode is always rendered inline (surrounded by
  `<p></p>` tags), even if stands on its own separated line

## Examples

### Style subcontent layout

```js
var supported = ['img', 'video', 'iframe'];

var shortcodes = {
    media: {
        render: function (attrs, env) {
            if (supported.indexOf(attrs.method) < 0) {
                throw new Error('unsupported medium');
            }
            var out = '<' + attrs.method;
            out += ' src="' + (attrs.src || '') + '"';
            out += ' alt="' + (attrs.alt || '') + '"';
            if (attrs.width) out += ' width="' + attrs.width + '"';
            if (attrs.side) out += ' style="float:' + attrs.side + '"';
            return out + '>';
        }
    }
}

var md = require('markdown-it')({html: true})
        .use(require('markdown-it-shortcode-tag'), shortcodes);

console.log(md.render('<media method="img" src="assets/picture.jpg" width=400 side="left">'));
```

Output:

```html
<img src="assets/picture.jpg" alt="" width="400" style="float:left">
```

### Render an enviroment variable

```js
var shortcodes = {
    variable: {
        render: function (attrs, env) {
            var name = Object.getOwnPropertyNames(attrs)[0];
            return env[name];
        }
    }
}

var md = require('markdown-it')({html: true})
        .use(require('markdown-it-shortcode-tag'), shortcodes);

console.log(md.render('# <variable title>', { title: "Hello World" }));
```

Output:

```html
<h1>Hello World</h1>
```

## License

see [LICENSE](https://github.com/ccprog/markdown-it-shortcode-tag/blob/master/LICENSE)

[1]: https://github.com/markdown-it/markdown-it#init-with-presets-and-options
[2]: https://html.spec.whatwg.org/multipage/syntax.html#start-tags
[3]: https://html.spec.whatwg.org/multipage/syntax.html#syntax-attributes
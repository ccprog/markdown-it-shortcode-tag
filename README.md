# markdown-it-shortcode-tag

[![Build Status](https://travis-ci.org/ccprog/markdown-it-shortcode-tag.svg?branch=master)](https://travis-ci.org/ccprog/markdown-it-shortcode-tag)

With this plugin you can define shortcodes for arbitrary content to be rendered when parsing
markdown. The shortcodes take the form of _self-closing_ HTML5 tags:

```html
<custom first second="string" third=3.7 fourth=#{myvar} >
```

You cannot write closing tags and consequently no inner content. Attributes are either
interpolated using a marker `#{ }` or passed directly to a rendering function you define
for every tag to be interpreted:

```js
const indirect = shortcodes.custom.interpolator("myvar", env)

shortcodes.custom.render({
    first: true,
    second: "string",
    third: 3.7
    fourth: indirect
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

var options = {
    interpolator: function(expr, env) { ... }
}

var md = require('markdown-it')({html: true})
        .use(require('markdown-it-shortcode-tag'), shortcodes, options);


md.render(content, env);
```

__shortcodes__
- __tag__ - set a property name to identify shortcodes of the form `<tag ...>`. [HTML5 rules][2]
  for tag names apply.
- __render__ - function that returns the rendered shortcode
  - __attrs__ - Object with name-value pairs for all attributes listed in the tag.
    [HTML5 rules][3] for attribute syntax apply. See below for the relation between tag attributes and
    object property values.
  - __env__ - the enviroment variable passed to markdown-it in a `md.render(content, env)`.
- __inline__ - optional, if true the shortcode is always rendered inline (surrounded by
  `<p></p>` tags), even if stands on its own separated line

__options__
- __interpolator__ - optional, function that interpolates an attribute value given **unquoted**
  and surrounded by an  interpolation marker `#{ }`.  
  Defaults to looking up the enviroment value: `(expr, env) => env[expr]`.
  - __expr__ - string content of the curly braces.
  - __env__ - the enviroment variable passed to markdown-it in a `md.render(content, env)`.

### Translation from tag attributes to `attrs` object properties

__name__  
Attributes without values are represented as boolean `true`:

    attrs.name = true

__name=3.7__  
Unquoted values are converted to numbers using `parseFloat()`:

    attrs.name = 3.7

__name=#{expr}__  
Values surrounded by the interpolation marker are passed to the `options.interpolator` function:
 
    attrs.name = options.interpolator("expr", env)

or, if missing, to its default:
 
    attrs.name = env["expr"]

Note that for this syntax whitespace inside the curly braces is not allowed, as per HTML attribute
syntax rules.

__name="value"__  
strings are copied to the property:
 
    attrs.name = "value"

__name="val1#{expr}val2"__  
In strings that contain an interpolation marker `#{ }`, the marker is exchanged for the string
value of the contained enviroment variable:
 
    attrs.name = "val1" + env["expr"] + "val2"

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

console.log(md.render('<media method="img" src={picture} width=400 side="left">', {
    picture: "assets/picture.jpg"
}));
```

Output:

```html
<img src="assets/picture.jpg" alt="" width="400" style="float:left">
```

### Render an enviroment variable using shortcodes

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

### Render an environment variable using interpolation

```js
var shortcodes = {
    footer: {
        render: function (attrs) {
            return '<footer><p>' + attrs[meta] + '</p></footer>';
        }
    }
}

var options = {
    interpolator: function (expr, env) {
        return 'Authored by ' + env[expr].author + ' on ' +
               Date(env[expr].date).toLocaleDateString(env.locale) + '.';
    }
}

var md = require('markdown-it')({html: true})
        .use(require('markdown-it-shortcode-tag'), shortcodes, options);

console.log(md.render('<footer meta=#{lastpost} >', {
    lastpost: {
        author: "Janet",
        date: "2018-01-03"
    },
    locale: "en_US"
}));
```

Output:

```html
<footer><p>Authored by Janet on 2018/3/1</p></footer>
```

## License

see [LICENSE](https://github.com/ccprog/markdown-it-shortcode-tag/blob/master/LICENSE)

[1]: https://github.com/markdown-it/markdown-it#init-with-presets-and-options
[2]: https://html.spec.whatwg.org/multipage/syntax.html#start-tags
[3]: https://html.spec.whatwg.org/multipage/syntax.html#syntax-attributes
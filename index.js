"use strict";

module.exports = function shortcode_plugin (md, shortcodes, options) {
    options = options || {};
    const interpolator = options.interpolator || function (expr, env) { return env[expr]; };
    const defaultRuleIndex = md.block.ruler.__find__('html_block');
    if (defaultRuleIndex < 0 || !shortcodes) return;

    const tags = Object.getOwnPropertyNames(shortcodes);
    const inlineTags = [];

    if (tags.length < 1) return;
    for (const tag of tags) {
        if (typeof shortcodes[tag].render !== 'function') {
            throw new Error('missing render function for shortcode tag: ' + tag);
        }
        if (shortcodes[tag].inline) inlineTags.push(tag);
    }
    
    const reName = '([a-zA-Z_:][a-zA-Z0-9:._-]*)';
    const reNumber = '(-?(?:\\d*\\.\\d+|\\d+)(?:[eE]-?\\d+)?)';
    const reString = '(\'[^\']*\'|"[^"]*")';
    const reExpr = '(#\\{[^}]*\\})';
  
    const reAttrs = new RegExp(
        '\\s+' + reName + 
        '(?:\\s*=\\s*(?:' + reNumber + '|' + reString + '|' + reExpr + '))?',
        'g'
    );
    const reStrExpr = new RegExp(reExpr);

    const reTag = /^<(\w+)/;

    function testTag (content, tagList) {
        const blockTag = reTag.exec(content);
        return blockTag && tagList.find(tag => tag === blockTag[1]);
    }

    function rule (state) {
        let tokens = state.tokens;

        if (!state.md.options.html) return;

        for (let i = tokens.length - 1; i >= 0; i--) {
            const currentToken = tokens[i];

            if (currentToken.type !== 'html_block') continue;

            if(!testTag(currentToken.content, inlineTags)) continue;

            let token, level = currentToken.level;
            const nodes = [];

            token = new state.Token('paragraph_open', 'p', 1);
            token.level = level++;
            nodes.push(token);

            token = new state.Token('inline', '', 0);
            token.content = currentToken.content;
            token.level = level;
            token.children = [];
            nodes.push(token);

            token = new state.Token('paragraph_close', 'p', -1);
            token.level = --level;
            nodes.push(token);

            state.tokens = tokens = md.utils.arrayReplaceAt(tokens, i, nodes);
        }
    }

    if (inlineTags.length > 0) md.core.ruler.after('block', 'shortcode', rule);

    const fallback = function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

    const defaultRender = {
        html_block: md.renderer.rules.html_block || fallback,
        html_inline: md.renderer.rules.html_inline || fallback
    };

    function render (tokens, idx, options, env, self) {
        const content = tokens[idx].content;
        
        let parameters = {}, attr;
        while (attr = reAttrs.exec(content)) {
            if (attr[4]) { //interpolated
                let expr = attr[4].slice(2, -1).trim();
                parameters[attr[1]] = interpolator(expr, env);
            } else if (attr[3]) { //quoted
                const raw = attr[3].slice(1, -1)
                parameters[attr[1]] = raw.replace(reStrExpr, (match) => {
                    const expr = match.slice(2, -1);
                    return env[expr];
                });
            } else if (attr[2]) { //number
                parameters[attr[1]] = parseFloat(attr[2]);
            } else {
                parameters[attr[1]] = true;
            }
        }

        const tag = testTag(content, tags);
        if (tag)  {
            return shortcodes[tag].render(parameters, env);
        }
 
        return defaultRender[tokens[idx].type](tokens, idx, options, env, self);
    }

    md.renderer.rules.html_block = md.renderer.rules.html_inline = render;
};
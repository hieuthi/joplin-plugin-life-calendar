const YAML = require('yaml');

module.exports = {
  default: function(context) {
    return {
      plugin: function (markdownIt, _options) {
        const defaultRender = markdownIt.renderer.rules.fence || function(tokens, idx, options, env, self) {
          return self.renderToken(tokens, idx, options, env, self);
        };
        markdownIt.renderer.rules.fence = function(tokens, idx, options, env, self) {
          const token = tokens[idx];
          if (token.info !== 'life') return defaultRender(tokens, idx, options, env, self);
          try {
            var contentHtml = JSON.stringify(YAML.parse(markdownIt.utils.escapeHtml(token.content)));
          } catch (e) {
            var contentHtml = {};
          }
          return `
            <div class="joplin-editable">
              <div class="life-calendar">${contentHtml}</div>
            </div>
          `;
        };
      },
      assets: function () {
        return [
          { name: 'life-calendar.js' },
          { name: 'life-calendar.css'},]
      }
    }
  }
}
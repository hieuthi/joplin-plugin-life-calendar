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
          const contentHtml = markdownIt.utils.escapeHtml(token.content);
          return `
            <div class="joplin-editable">
              <pre class="life-calendar">${contentHtml}</pre>
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
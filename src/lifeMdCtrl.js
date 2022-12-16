function plugin(CodeMirror) {
  CodeMirror.defineMode("life", function(conf) {
    var lifeMode = {
      token: function(stream, state) { while (stream.next() != null ) {}; return null; }
    }
    return CodeMirror.overlayMode(CodeMirror.getMode(conf, "text/x-yaml"), lifeMode);
  });
}
module.exports = {
  default: function(_context) {
    return {
      plugin: plugin,
      codeMirrorResources: [ 'addon/mode/overlay' ],
      codeMirrorOptions: {}
    }
  }
}
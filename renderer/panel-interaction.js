(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PanelInteraction = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function shouldTogglePanelForSpace(event) {
    if (!event || (event.key !== ' ' && event.key !== 'Spacebar' && event.code !== 'Space')) return false;
    return !event.repeat
      && !event.isComposing
      && !event.editable
      && !event.metaKey
      && !event.ctrlKey
      && !event.altKey;
  }

  // Keep at most one pending repaint per view. A newer motion owns the queue;
  // an older completion callback must not flush work into a newer animation.
  function createMotionWorkQueue() {
    let generation = 0, active = false;
    const pending = new Map();
    return {
      begin() { active = true; return ++generation; },
      end(token) {
        if (token !== generation) return;
        active = false;
        const work = [...pending.values()]; pending.clear();
        for (const action of work) action();
      },
      run(key, action) { if (active) pending.set(key, action); else action(); },
      isActive() { return active; },
    };
  }
  return { shouldTogglePanelForSpace, createMotionWorkQueue };
});

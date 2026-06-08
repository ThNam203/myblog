/**
 * Builds the inline "no flash of unstyled content" script that applies the
 * persisted theme before first paint. It runs synchronously inside <head>, so
 * it must only touch elements that already exist at that point.
 */
export function buildNoFoucScript(storageKey: string): string {
    return `(() => {
  const SYSTEM = "system";
  const DARK = "dark";
  const LIGHT = "light";
  const storageKey = "${storageKey}";

  const modifyTransition = () => {
    const css = document.createElement("style");
    css.textContent = "*,*:after,*:before{transition:none !important;}";
    document.head.appendChild(css);
    return () => {
      // Force a reflow so the transition-blocking style is flushed before it is
      // removed. This runs in <head>, where <body> may not exist yet, so read
      // documentElement (always present, and the element the theme is applied to).
      getComputedStyle(document.documentElement);
      setTimeout(() => document.head.removeChild(css), 1);
    };
  };

  const media = matchMedia("(prefers-color-scheme: dark)");
  window.updateDOM = () => {
    const restoreTransitions = modifyTransition();
    const mode = localStorage.getItem(storageKey) ?? SYSTEM;
    const systemMode = media.matches ? DARK : LIGHT;
    const resolvedMode = mode === SYSTEM ? systemMode : mode;
    const classList = document.documentElement.classList;
    if (resolvedMode === DARK) classList.add(DARK);
    else classList.remove(DARK);
    document.documentElement.setAttribute("data-mode", mode);
    restoreTransitions();
  };
  window.updateDOM();
  media.addEventListener("change", window.updateDOM);
})();`;
}

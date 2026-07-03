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
  const COLOR_THEMES = ["blue", "magenta", "pink"];
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
    const root = document.documentElement;
    if (resolvedMode === DARK) root.classList.add(DARK);
    else root.classList.remove(DARK);
    if (COLOR_THEMES.indexOf(mode) !== -1) root.setAttribute("data-theme", mode);
    else root.removeAttribute("data-theme");
    root.setAttribute("data-mode", mode);
    restoreTransitions();
  };
  window.updateDOM();
  media.addEventListener("change", window.updateDOM);
})();`;
}

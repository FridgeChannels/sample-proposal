// A same-origin frame can size itself to the stacked mobile story without trapping page scroll.
class LivingHome extends HTMLElement {
  connectedCallback() {
    this.refresh = () => {
      this.observer?.disconnect();
      const frame = this.querySelector('iframe');
      const main = frame?.contentDocument?.querySelector('main');
      if (!main) return;
      const resize = () => {
        if (frame.clientWidth > 720) {
          frame.style.removeProperty('height');
          return;
        }
        const height = Math.ceil(main.getBoundingClientRect().height);
        if (height && frame.style.height !== height + 'px') frame.style.height = height + 'px';
      };
      this.observer = new ResizeObserver(resize);
      this.observer.observe(main);
      this.observer.observe(frame);
      resize();
    };
    this.addEventListener('load', this.refresh, true);
    this.refresh();
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    this.removeEventListener('load', this.refresh, true);
  }
}
if (!customElements.get('hommio-living-home')) customElements.define('hommio-living-home', LivingHome);

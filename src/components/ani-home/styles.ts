import { css } from 'lit';

export default css`
  :host {
    display: block;
  }

  kemet-tabs::part(divider) {
    opacity: 0.75;
  }

  kemet-fab {
    position: fixed;
    bottom: var(--kemet-spacer-xl);
    right: var(--kemet-spacer-xl);
  }
`;

import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import modalsStore, { IModalsStore } from '../../store/modals';
import userStore, { IUserStore } from '../../store/user';
import appStore, { IAppStore } from '../../store/app';
import quoteStore, { IQuoteStore } from '../../store/quote';
import { IQuote } from '../../shared/interfaces';
import styles from './styles';

import '../ani-feed/feed';



const API_URL = import.meta.env.VITE_API_URL;

@customElement('ani-home')
export default class AniHome extends LitElement {
  static styles = [styles];

  @state()
  searchQuery: string = '';

  @state()
  myQuotes: IQuote[] = [];

  @state()
  modalsState: IModalsStore = modalsStore.getInitialState();

  @state()
  userState: IUserStore = userStore.getInitialState();

  @state()
  appState: IAppStore = appStore.getInitialState();

  @state()
  quoteState: IQuoteStore = quoteStore.getInitialState();

  constructor() {
    super();

    appStore.subscribe((state) => {
      this.appState = state;
    });

    quoteStore.subscribe((state) => {
      this.quoteState = state;
      this.searchQuery = state.searchQuery;
      this.myQuotes = state.quotes.filter(quote => quote.user.id === this.userState.user.user.id);
    })
  }

  firstUpdated() {
    this.getQuotes();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('searchQuery')) {
      this.getQuotes();
    }
  }

  render() {
    return html`
      <kemet-tabs divider>
        <kemet-tab slot="tab">All</kemet-tab>
        <kemet-tab slot="tab">Following</kemet-tab>
        <kemet-tab slot="tab">Mine</kemet-tab>
        <kemet-tab-panel slot="panel">
          <br />
          <ani-feed .quotes=${this.quoteState.quotes}></ani-feed>
        </kemet-tab-panel>
        <kemet-tab-panel slot="panel">Following</kemet-tab-panel>
        <kemet-tab-panel slot="panel">
          <br />
          ${this.myQuotes.length > 0
            ? html`<ani-feed .quotes=${this.myQuotes}></ani-feed>`
            : html`<p>Looks like you haven't added any quotes yet.</p>`
          }
        </kemet-tab-panel>
      </kemet-tabs>

      ${this.userState.isLoggedIn ? html`
        <kemet-fab pill @click=${() => this.modalsState.setNewQuoteOpened(true)}>
          <kemet-icon slot="icon" icon="pencil-square" size="24"></kemet-icon>
          New Quote
        </kemet-fab>` : null
      }
    `
  }

  async getQuotes() {
    // search by whether or not the user, book, or quote contain the search query
    const searchParams = this.quoteState.searchQuery ?`&filters[$or][0][quote][$contains]=${this.quoteState.searchQuery}&filters[$or][1][book][title][$contains]=${this.quoteState.searchQuery}&filters[$or][2][user][username][$contains]=${this.quoteState.searchQuery}` : '';
    const response = await fetch(`${API_URL}/api/quotes?sort[0]=createdAt:desc&populate=user.avatar&populate=book${searchParams}&pagination[pageSize]=10&pagination[page]=1`);
    const { data } = await response.json();
    this.quoteState.addInitialQuotes(data);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ani-home': AniHome
  }
}

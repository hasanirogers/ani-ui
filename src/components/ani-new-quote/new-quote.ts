import { LitElement, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import modalsStore,{ IModalsStore } from '../../store/modals';
import styles from './styles';
import sharedStyles from '../../shared/styles';
import { IBook } from '../../shared/interfaces';
import userStore,{ IUserStore } from '../../store/user';
import KemetSelect from 'kemet-ui/dist/components/kemet-select/kemet-select';


const API_URL = import.meta.env.VITE_API_URL;

@customElement('ani-new-quote')
export default class AniNewQuote extends LitElement {
  static styles = [styles, sharedStyles];

  @state()
  modalsState: IModalsStore = modalsStore.getInitialState();

  @state()
  userState: IUserStore = userStore.getInitialState();

  @query('kemet-select')
  userBook!: KemetSelect;

  render() {
    return html`
      <form @submit=${(event: SubmitEvent) => this.addQuote(event)}>
        <kemet-field slug="quote" label="The quote">
          <kemet-textarea slot="input" name="quote" filled rounded required></kemet-textarea>
          <kemet-count slot="component" message="characters remaining." limit="300"></kemet-count>
        </kemet-field>
        <div>
          <kemet-field slug="book" label="Book">
            <kemet-select slot="input" name="book" required filled rounded>
              ${this.makeBookOptions()}
            </kemet-select>
          </kemet-field>
          <kemet-field slug="page" label="Page">
            <kemet-input slot="input" name="page" rounded filled></kemet-input>
          </kemet-field>
        </div>
        <kemet-field slug="note" label="Enter any notes you may have about this quote">
          <kemet-textarea slot="input" name="note" filled rounded></kemet-textarea>
          <kemet-count slot="component" message="characters remaining." limit="300"></kemet-count>
        </kemet-field>
        <footer>
          <kemet-button type="submit" variant="rounded" @click=${() => this.modalsState.setNewQuoteOpened(false)}>
            Cancel
          </kemet-button>
          <kemet-button variant="circle">
            <kemet-icon icon="send" size="24"></kemet-icon>
          </kemet-button>
        </footer>
      </form>
    `;
  }

  async addQuote(event: SubmitEvent) {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const userData = Object.fromEntries(formData);

    userData.book = this.userBook ? this.userBook.shadowRoot!.querySelector('select')?.value as string : '';

    const { data } = await fetch(`${API_URL}/api/books?filters[identifier][$eq]=${userData.book}`).then(response => response.json());
    const book = data[0];
    const user = this.userState.profile;

    const payload = {
      quote: userData.quote,
      requote: '',
      requotes: [],
      user: user.id,
      book: book.id,
      page: userData.page,
      note: userData.note,
      private: false,
      likes: []
    }

    fetch(`${API_URL}/api/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.userState.user.jwt}`
      },
      body: JSON.stringify({ data: payload })
    });
  }

  makeBookOptions() {
    return this.userState.profile.books.map((book: IBook) => html`<kemet-option label="${book.title}" value="${book.identifier}"></kemet-option>`)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ani-new-quote': AniNewQuote
  }
}

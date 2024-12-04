import { createStore } from 'zustand/vanilla';
import { IQuote } from '../shared/interfaces';

export interface IModalsStore {
  signInOpened: boolean;
  setSignInOpened: (opened: boolean) => void;
  commentOpened: boolean;
  setCommentOpened: (opened: boolean) => void;
  currentQuote: IQuote | null;
  setCurrentQuote: (currentQuote: IQuote) => void;
  newQuoteOpened: boolean;
  setNewQuoteOpened: (opened: boolean) => void;
}

const store = createStore<IModalsStore>(set => ({
  signInOpened: false,
  setSignInOpened: (signInOpened: boolean) => set(() => { return { signInOpened } }),
  commentOpened: false,
  setCommentOpened: (commentOpened: boolean) => set(() => { return { commentOpened } }),
  currentQuote: null,
  setCurrentQuote: (currentQuote: IQuote) => set(() => { return { currentQuote }}),
  newQuoteOpened: false,
  setNewQuoteOpened: (newQuoteOpened: boolean) => set(() => { return { newQuoteOpened } }),
}));

export default store;
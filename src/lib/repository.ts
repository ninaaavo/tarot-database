import { fallbackCards, fallbackNotes, fallbackReadingCards, fallbackReadings, noteCategories } from "@/lib/fallback-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  Card,
  CardNote,
  CardReadingHistoryItem,
  CardWithNotes,
  Reading,
  ReadingCard,
  ReadingCardWithCard,
  ReadingWithCards,
} from "@/types/database";

type CardInput = Omit<Card, "id"> & { id?: string };
type ReadingInput = Omit<Reading, "id" | "created_at">;
type ReadingCardInput = Omit<ReadingCard, "id" | "reading_id">;

const storageKey = "tarot-database-mvp";
const rankWords: Record<number, string> = {
  1: "ace",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "page",
  12: "knight",
  13: "queen",
  14: "king",
};

type LocalStore = {
  cards: Card[];
  card_notes: CardNote[];
  readings: Reading[];
  reading_cards: ReadingCard[];
};

function getLocalStore(): LocalStore {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return {
      cards: fallbackCards,
      card_notes: fallbackNotes,
      readings: fallbackReadings,
      reading_cards: fallbackReadingCards,
    };
  }

  return JSON.parse(raw) as LocalStore;
}

function saveLocalStore(store: LocalStore) {
  window.localStorage.setItem(storageKey, JSON.stringify(store));
}

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function cardSlug(card: Card) {
  return normalizeSearchText(card.name).replace(/\s+/g, "-");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function cardSearchText(card: Card) {
  return normalizeSearchText(cardSearchPhrases(card).join(" "));
}

function cardSearchPhrases(card: Card) {
  const phrases = [card.name, card.arcana, card.suit ?? ""];

  if (card.number !== null) {
    phrases.push(String(card.number), card.number.toString().padStart(2, "0"));
  }

  if (card.suit && card.number !== null) {
    const rank = rankWords[card.number];
    if (rank) {
      phrases.push(
        `${rank} of ${card.suit}`,
        `${card.number} of ${card.suit}`,
        `${card.number.toString().padStart(2, "0")} of ${card.suit}`,
        `${rank} ${card.suit}`,
        `${card.number} ${card.suit}`,
      );
    }
  }

  return phrases;
}

function phraseMatchesSearch(phrase: string, term: string) {
  const phraseTokens = normalizeSearchText(phrase).split(" ").filter(Boolean);
  const termTokens = term.split(" ").filter(Boolean);

  return phraseTokens.some((_, startIndex) =>
    termTokens.every((termToken, termIndex) => {
      const phraseToken = phraseTokens[startIndex + termIndex];
      if (!phraseToken) return false;
      return /^\d+$/.test(termToken) ? phraseToken === termToken : phraseToken.startsWith(termToken);
    }),
  );
}

function cardMatchesSearch(card: Card, rawTerm: string) {
  const term = normalizeSearchText(rawTerm);
  if (!term) return true;

  const numericTerm = Number(term);
  if (Number.isInteger(numericTerm) && term === String(numericTerm)) {
    return card.number === numericTerm;
  }

  if (term.includes(" ")) {
    return cardSearchPhrases(card).some((phrase) => phraseMatchesSearch(phrase, term));
  }

  return cardSearchText(card).includes(term);
}

function sortCardNotes(notes: CardNote[]) {
  return [...notes].sort((a, b) => noteCategories.indexOf(a.category) - noteCategories.indexOf(b.category));
}

export function usesLocalFallback() {
  return !isSupabaseConfigured;
}

export async function listCards(search = ""): Promise<Card[]> {
  if (supabase) {
    const { data, error } = await supabase.from("cards").select("*").order("arcana").order("suit").order("number");
    if (error) throw error;
    return (data ?? []).filter((card) => cardMatchesSearch(card, search));
  }

  return getLocalStore().cards.filter((card) => cardMatchesSearch(card, search));
}

export async function listCardsWithNotes(search = ""): Promise<CardWithNotes[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("cards")
      .select("*, card_notes(*)")
      .order("arcana")
      .order("suit")
      .order("number");
    if (error) throw error;
    return (data ?? [])
      .filter((card) => cardMatchesSearch(card, search))
      .map((card) => ({ ...card, card_notes: sortCardNotes(card.card_notes ?? []) }));
  }

  const store = getLocalStore();
  return store.cards
    .filter((card) => cardMatchesSearch(card, search))
    .map((card) => ({
      ...card,
      card_notes: sortCardNotes(store.card_notes.filter((note) => note.card_id === card.id)),
    }));
}

export async function getCard(cardRef: string): Promise<CardWithNotes | null> {
  if (supabase) {
    if (!isUuid(cardRef)) {
      const cards = await listCardsWithNotes();
      return cards.find((card) => cardSlug(card) === cardRef) ?? null;
    }

    const { data, error } = await supabase
      .from("cards")
      .select("*, card_notes(*)")
      .eq("id", cardRef)
      .order("category", { referencedTable: "card_notes" })
      .single();
    if (error) throw error;
    return { ...data, card_notes: sortCardNotes(data.card_notes ?? []) };
  }

  const store = getLocalStore();
  const card = store.cards.find((item) => item.id === cardRef || cardSlug(item) === cardRef);
  if (!card) return null;
  return {
    ...card,
    card_notes: sortCardNotes(store.card_notes.filter((note) => note.card_id === card.id)),
  };
}

export async function upsertCard(input: CardInput): Promise<Card> {
  if (supabase) {
    const { data, error } = await supabase.from("cards").upsert(input).select().single();
    if (error) throw error;
    return data;
  }

  const store = getLocalStore();
  const card = { ...input, id: input.id ?? id("card") };
  const index = store.cards.findIndex((item) => item.id === card.id);
  if (index >= 0) store.cards[index] = card;
  else store.cards.push(card);
  saveLocalStore(store);
  return card;
}

export async function deleteCard(cardId: string) {
  if (supabase) {
    const { error } = await supabase.from("cards").delete().eq("id", cardId);
    if (error) throw error;
    return;
  }

  const store = getLocalStore();
  saveLocalStore({
    cards: store.cards.filter((card) => card.id !== cardId),
    card_notes: store.card_notes.filter((note) => note.card_id !== cardId),
    readings: store.readings,
    reading_cards: store.reading_cards.filter((item) => item.card_id !== cardId),
  });
}

export async function saveCardNotes(cardId: string, notesByCategory: Record<string, string>) {
  const notes = Object.entries(notesByCategory).map(([category, content]) => ({
    card_id: cardId,
    category,
    content,
  }));

  if (supabase) {
    const { error } = await supabase.from("card_notes").upsert(notes, { onConflict: "card_id,category" });
    if (error) throw error;
    return;
  }

  const store = getLocalStore();
  const retained = store.card_notes.filter((note) => note.card_id !== cardId);
  const next = Object.entries(notesByCategory).map(([category, content]) => ({
    id: id("note"),
    card_id: cardId,
    category,
    content,
  }));
  saveLocalStore({ ...store, card_notes: [...retained, ...next] });
}

export async function getCardReadingHistory(cardId: string): Promise<CardReadingHistoryItem[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("reading_cards")
      .select("*, readings(*)")
      .eq("card_id", cardId)
      .order("position_order");
    if (error) throw error;
    return data ?? [];
  }

  const store = getLocalStore();
  return store.reading_cards
    .filter((item) => item.card_id === cardId)
    .map((item) => ({ ...item, readings: store.readings.find((reading) => reading.id === item.reading_id)! }))
    .filter((item) => item.readings);
}

export async function listReadings(): Promise<Array<Reading & { card_count: number }>> {
  if (supabase) {
    const { data, error } = await supabase
      .from("readings")
      .select("*, reading_cards(id)")
      .order("date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((reading) => ({
      ...reading,
      card_count: reading.reading_cards.length,
    }));
  }

  const store = getLocalStore();
  return store.readings
    .map((reading) => ({
      ...reading,
      card_count: store.reading_cards.filter((item) => item.reading_id === reading.id).length,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getReading(id: string): Promise<ReadingWithCards | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from("readings")
      .select("*, reading_cards(*, cards(*))")
      .eq("id", id)
      .single();
    if (error) throw error;
    return {
      ...data,
      reading_cards: [...data.reading_cards].sort((a, b) => a.position_order - b.position_order),
    };
  }

  const store = getLocalStore();
  const reading = store.readings.find((item) => item.id === id);
  if (!reading) return null;
  const readingCards: ReadingCardWithCard[] = store.reading_cards
    .filter((item) => item.reading_id === id)
    .map((item) => ({ ...item, cards: store.cards.find((card) => card.id === item.card_id)! }))
    .filter((item) => item.cards)
    .sort((a, b) => a.position_order - b.position_order);

  return { ...reading, reading_cards: readingCards };
}

export async function saveReading(input: ReadingInput, cards: ReadingCardInput[], readingId?: string): Promise<Reading> {
  if (supabase) {
    const { data, error } = readingId
      ? await supabase.from("readings").update(input).eq("id", readingId).select().single()
      : await supabase.from("readings").insert(input).select().single();
    if (error) throw error;

    const { error: deleteError } = await supabase.from("reading_cards").delete().eq("reading_id", data.id);
    if (deleteError) throw deleteError;

    if (cards.length) {
      const { error: cardsError } = await supabase.from("reading_cards").insert(
        cards.map((card, index) => ({
          ...card,
          reading_id: data.id,
          position_order: index + 1,
        })),
      );
      if (cardsError) throw cardsError;
    }

    return data;
  }

  const store = getLocalStore();
  const existingReading = readingId ? store.readings.find((item) => item.id === readingId) : null;
  const reading: Reading = {
    ...input,
    id: readingId ?? id("reading"),
    created_at: existingReading?.created_at ?? new Date().toISOString(),
  };
  const retainedReadings = store.readings.filter((item) => item.id !== reading.id);
  const retainedCards = store.reading_cards.filter((item) => item.reading_id !== reading.id);
  const nextCards = cards.map((card, index) => ({
    ...card,
    id: id("reading-card"),
    reading_id: reading.id,
    position_order: index + 1,
  }));
  saveLocalStore({
    ...store,
    readings: [...retainedReadings, reading],
    reading_cards: [...retainedCards, ...nextCards],
  });
  return reading;
}

export async function deleteReading(readingId: string) {
  if (supabase) {
    const { error } = await supabase.from("readings").delete().eq("id", readingId);
    if (error) throw error;
    return;
  }

  const store = getLocalStore();
  saveLocalStore({
    ...store,
    readings: store.readings.filter((reading) => reading.id !== readingId),
    reading_cards: store.reading_cards.filter((card) => card.reading_id !== readingId),
  });
}

export { noteCategories };

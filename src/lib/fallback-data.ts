import type { Card, CardNote, Reading, ReadingCard } from "@/types/database";

const majorArcana = [
  "The Fool",
  "The Magician",
  "The High Priestess",
  "The Empress",
  "The Emperor",
  "The Hierophant",
  "The Lovers",
  "The Chariot",
  "Strength",
  "The Hermit",
  "Wheel of Fortune",
  "Justice",
  "The Hanged Man",
  "Death",
  "Temperance",
  "The Devil",
  "The Tower",
  "The Star",
  "The Moon",
  "The Sun",
  "Judgement",
  "The World",
];

const suits = ["Wands", "Cups", "Swords", "Pentacles"];
const ranks = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
const suitCodes: Record<string, string> = {
  Wands: "W",
  Cups: "C",
  Swords: "S",
  Pentacles: "P",
};
const rankCodes = ["0A", "02", "03", "04", "05", "06", "07", "08", "09", "10", "J1", "J2", "QU", "KI"];

function majorImageUrl(number: number) {
  return `https://steve-p.org/cards/pix/RWSa-T-${number.toString().padStart(2, "0")}.png`;
}

function minorImageUrl(suit: string, rankIndex: number) {
  return `https://steve-p.org/cards/pix/RWSa-${suitCodes[suit]}-${rankCodes[rankIndex]}.png`;
}

export const noteCategories = [
  "Meaning",
  "Action",
  "Strength",
  "Weakness",
  "Outcome",
  "Reversed Meaning",
  "Reversed Action",
  "Reversed Strength",
  "Reversed Weakness",
  "Reversed Outcome",
  "Personal Notes",
];

export const fallbackCards: Card[] = [
  ...majorArcana.map((name, index) => ({
    id: `major-${index}`,
    name,
    arcana: "Major Arcana",
    suit: null,
    number: index,
    image_url: majorImageUrl(index),
  })),
  ...suits.flatMap((suit) =>
    ranks.map((rank, index) => ({
      id: `${suit.toLowerCase()}-${index + 1}`,
      name: `${rank} of ${suit}`,
      arcana: "Minor Arcana",
      suit,
      number: index + 1,
      image_url: minorImageUrl(suit, index),
    })),
  ),
];

export const fallbackNotes: CardNote[] = fallbackCards.flatMap((card) =>
  noteCategories.map((category) => ({
    id: `${card.id}-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    card_id: card.id,
    category,
    content: "",
  })),
);

export const fallbackReadings: Reading[] = [];
export const fallbackReadingCards: ReadingCard[] = [];

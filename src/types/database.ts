export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      cards: {
        Row: Card;
        Insert: Omit<Card, "id"> & { id?: string };
        Update: Partial<Omit<Card, "id">>;
        Relationships: [];
      };
      card_notes: {
        Row: CardNote;
        Insert: Omit<CardNote, "id"> & { id?: string };
        Update: Partial<Omit<CardNote, "id">>;
        Relationships: [
          {
            foreignKeyName: "card_notes_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
        ];
      };
      readings: {
        Row: Reading;
        Insert: Omit<Reading, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Reading, "id" | "created_at">>;
        Relationships: [];
      };
      reading_cards: {
        Row: ReadingCard;
        Insert: Omit<ReadingCard, "id"> & { id?: string };
        Update: Partial<Omit<ReadingCard, "id">>;
        Relationships: [
          {
            foreignKeyName: "reading_cards_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_cards_reading_id_fkey";
            columns: ["reading_id"];
            isOneToOne: false;
            referencedRelation: "readings";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Card = {
  id: string;
  name: string;
  arcana: string;
  suit: string | null;
  number: number | null;
  image_url: string | null;
};

export type CardNote = {
  id: string;
  card_id: string;
  category: string;
  content: string;
};

export type Reading = {
  id: string;
  title: string;
  date: string;
  question: string | null;
  overall_notes: string | null;
  created_at: string;
};

export type Orientation = "upright" | "reversed";

export type ReadingCard = {
  id: string;
  reading_id: string;
  card_id: string;
  position_name: string;
  position_order: number;
  orientation: Orientation;
  interpretation: string | null;
};

export type ReadingCardWithCard = ReadingCard & {
  cards: Card;
};

export type ReadingWithCards = Reading & {
  reading_cards: ReadingCardWithCard[];
};

export type CardWithNotes = Card & {
  card_notes: CardNote[];
};

export type CardReadingHistoryItem = ReadingCard & {
  readings: Reading;
};

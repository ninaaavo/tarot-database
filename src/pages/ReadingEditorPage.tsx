import { Plus, Save, Search, Trash2 } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cardMatchesSearch, getReading, listCardsWithNotes, saveReading } from "@/lib/repository";
import type { CardWithNotes, Orientation } from "@/types/database";

type SpreadCardForm = {
  position_name: string;
  card_id: string;
  card_search: string;
  orientation: Orientation;
  interpretation: string;
};

const today = new Date().toISOString().slice(0, 10);
const meaningFallbackCategories = ["Meaning", "Reversed Meaning", "Action", "Reversed Action", "Outcome", "Reversed Outcome"];

function blankSpreadCard(cardId = "", cardSearch = ""): SpreadCardForm {
  return {
    position_name: "",
    card_id: cardId,
    card_search: cardSearch,
    orientation: "upright",
    interpretation: "",
  };
}

export function ReadingEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState<CardWithNotes[]>([]);
  const [form, setForm] = useState({ title: "", date: today, question: "", overall_notes: "" });
  const [spreadCards, setSpreadCards] = useState<SpreadCardForm[]>([blankSpreadCard()]);
  const [activeCardSearchIndex, setActiveCardSearchIndex] = useState<number | null>(null);
  const [highlightedCardOptionIndex, setHighlightedCardOptionIndex] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void listCardsWithNotes().then(setCards);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void getReading(id).then((reading) => {
      if (!reading) return;
      setForm({
        title: reading.title,
        date: reading.date,
        question: reading.question ?? "",
        overall_notes: reading.overall_notes ?? "",
      });
      setSpreadCards(
        reading.reading_cards.map((item) => ({
          position_name: item.position_name,
          card_id: item.card_id,
          card_search: item.cards.name,
          orientation: item.orientation,
          interpretation: item.interpretation ?? "",
        })),
      );
    });
  }, [id]);

  function updateSpreadCard(index: number, value: Partial<SpreadCardForm>) {
    setSpreadCards((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...value } : item)));
  }

  function addSpreadCard() {
    setSpreadCards((current) => [...current, blankSpreadCard()]);
  }

  function removeSpreadCard(index: number) {
    setSpreadCards((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function getCardOptions(item: SpreadCardForm) {
    return cards.filter((card) => cardMatchesSearch(card, item.card_search));
  }

  function updateCardSearch(index: number, value: string) {
    const exactMatch = cards.find((card) => card.name.toLowerCase() === value.trim().toLowerCase());
    updateSpreadCard(index, { card_search: value, card_id: exactMatch?.id ?? "" });
    setActiveCardSearchIndex(index);
    setHighlightedCardOptionIndex(0);
  }

  function selectCard(index: number, card: CardWithNotes) {
    updateSpreadCard(index, { card_id: card.id, card_search: card.name });
    setActiveCardSearchIndex(null);
    setHighlightedCardOptionIndex(0);
  }

  function handleCardSearchKeyDown(index: number, options: CardWithNotes[], event: KeyboardEvent<HTMLInputElement>) {
    if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) return;

    if (event.key === "Escape") {
      setActiveCardSearchIndex(null);
      setHighlightedCardOptionIndex(0);
      return;
    }

    if (!options.length) {
      if (event.key === "Enter") event.preventDefault();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveCardSearchIndex(index);
      setHighlightedCardOptionIndex((current) => (current + 1) % options.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveCardSearchIndex(index);
      setHighlightedCardOptionIndex((current) => (current - 1 + options.length) % options.length);
      return;
    }

    if (event.key === "Enter" && activeCardSearchIndex === index) {
      event.preventDefault();
      selectCard(index, options[highlightedCardOptionIndex] ?? options[0]);
    }
  }

  function getSelectedCard(item: SpreadCardForm) {
    return cards.find((card) => card.id === item.card_id) ?? null;
  }

  function getMeaningNote(card: CardWithNotes, orientation: Orientation) {
    const preferredCategory = orientation === "reversed" ? "Reversed Meaning" : "Meaning";
    const preferredNote = card.card_notes.find((note) => note.category === preferredCategory && note.content.trim());
    if (preferredNote) return preferredNote;

    return meaningFallbackCategories
      .map((category) => card.card_notes.find((note) => note.category === category && note.content.trim()))
      .find((note) => Boolean(note));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const hasUnselectedCard = spreadCards.some((item) => item.position_name.trim() && !item.card_id);
    if (hasUnselectedCard) {
      setStatus("Choose a card from the search results before saving.");
      return;
    }

    const reading = await saveReading(
      {
        title: form.title,
        date: form.date,
        question: form.question || null,
        overall_notes: form.overall_notes || null,
      },
      spreadCards
        .filter((item) => item.card_id && item.position_name)
        .map((item, index) => ({
          card_id: item.card_id,
          position_name: item.position_name,
          position_order: index + 1,
          orientation: item.orientation,
          interpretation: item.interpretation || null,
        })),
      id,
    );
    setStatus("Saved");
    navigate(`/readings/${reading.id}`);
  }

  return (
    <main className="page-shell space-y-6">
      <section>
        <h2 className="text-2xl font-semibold">{id ? "Edit Reading" : "New Reading"}</h2>
        <p className="text-sm text-muted-foreground">Record the spread, the cards, and your reading-specific interpretations.</p>
      </section>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Reading</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 block">
              <span className="field-label">Title</span>
              <Input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>
            <label className="space-y-2 block">
              <span className="field-label">Date</span>
              <Input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </label>
            <label className="space-y-2 block md:col-span-2">
              <span className="field-label">Question</span>
              <Textarea value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} />
            </label>
            <label className="space-y-2 block md:col-span-2">
              <span className="field-label">Overall Notes</span>
              <Textarea value={form.overall_notes} onChange={(event) => setForm({ ...form, overall_notes: event.target.value })} />
            </label>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold">Cards</h3>

          <div className="space-y-3">
            {spreadCards.map((item, index) => {
              const selectedCard = getSelectedCard(item);
              const meaningNote = selectedCard ? getMeaningNote(selectedCard, item.orientation) : null;
              const cardOptions = getCardOptions(item);
              const activeOptionId = `card-option-${index}-${highlightedCardOptionIndex}`;

              return (
                <Card key={index}>
                  <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr_160px_auto]">
                    <label className="space-y-2 block">
                      <span className="field-label">Position</span>
                      <Input
                        placeholder="Past, Present, Future..."
                        required
                        value={item.position_name}
                        onChange={(event) => updateSpreadCard(index, { position_name: event.target.value })}
                      />
                    </label>
                    <label className="space-y-2 block">
                      <span className="field-label">Card</span>
                      <div className="group relative">
                        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="Pick a card..."
                          required
                          role="combobox"
                          aria-expanded={activeCardSearchIndex === index}
                          aria-controls={`card-options-${index}`}
                          aria-activedescendant={activeCardSearchIndex === index && cardOptions.length ? activeOptionId : undefined}
                          value={item.card_search}
                          onChange={(event) => updateCardSearch(index, event.target.value)}
                          onFocus={() => {
                            setActiveCardSearchIndex(index);
                            setHighlightedCardOptionIndex(0);
                          }}
                          onBlur={() => setActiveCardSearchIndex(null)}
                          onKeyDown={(event) => handleCardSearchKeyDown(index, cardOptions, event)}
                        />
                        {activeCardSearchIndex === index && (
                          <div
                            id={`card-options-${index}`}
                            role="listbox"
                            className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-md border bg-card py-1 shadow-lg"
                          >
                            {cardOptions.length ? (
                              cardOptions.map((card, optionIndex) => (
                                <button
                                  key={card.id}
                                  id={`card-option-${index}-${optionIndex}`}
                                  type="button"
                                  role="option"
                                  aria-selected={optionIndex === highlightedCardOptionIndex}
                                  className={`flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none ${
                                    optionIndex === highlightedCardOptionIndex ? "bg-accent" : ""
                                  }`}
                                  onMouseEnter={() => setHighlightedCardOptionIndex(optionIndex)}
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => selectCard(index, card)}
                                >
                                  <span className="font-medium">{card.name}</span>
                                  <span className="text-xs text-muted-foreground">{card.suit ?? card.arcana}</span>
                                </button>
                              ))
                            ) : (
                              <p className="px-3 py-2 text-sm text-muted-foreground">No cards found.</p>
                            )}
                          </div>
                        )}
                        {selectedCard && activeCardSearchIndex !== index && (
                          <div className="pointer-events-none absolute left-0 right-0 top-full z-20 mt-2 hidden rounded-lg border bg-card p-4 text-left shadow-xl group-hover:block group-focus-within:block">
                            <p className="text-sm font-semibold">{selectedCard.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{selectedCard.suit ?? selectedCard.arcana}</p>
                            {meaningNote ? (
                              <div className="mt-3">
                                <p className="text-xs font-semibold uppercase text-muted-foreground">{meaningNote.category}</p>
                                <p className="mt-1 line-clamp-6 text-sm leading-5">{meaningNote.content}</p>
                              </div>
                            ) : (
                              <p className="mt-3 text-sm text-muted-foreground">No meaning saved yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                    <label className="space-y-2 block">
                      <span className="field-label">Orientation</span>
                      <Select value={item.orientation} onChange={(event) => updateSpreadCard(index, { orientation: event.target.value as Orientation })}>
                        <option value="upright">Upright</option>
                        <option value="reversed">Reversed</option>
                      </Select>
                    </label>
                    <div className="flex items-end">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeSpreadCard(index)} aria-label="Remove card">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <label className="space-y-2 block lg:col-span-4">
                      <span className="field-label">Interpretation</span>
                      <Textarea value={item.interpretation} onChange={(event) => updateSpreadCard(index, { interpretation: event.target.value })} />
                    </label>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={addSpreadCard}>
              <Plus className="h-4 w-4" />
              Add Card
            </Button>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit">
            <Save className="h-4 w-4" />
            Save Reading
          </Button>
          {status && <span className="text-sm text-muted-foreground">{status}</span>}
        </div>
      </form>
    </main>
  );
}

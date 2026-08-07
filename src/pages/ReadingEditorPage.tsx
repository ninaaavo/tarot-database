import { Plus, Save, Search, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cardMatchesSearch, getReading, listCards, saveReading } from "@/lib/repository";
import type { Card as TarotCard, Orientation } from "@/types/database";

type SpreadCardForm = {
  position_name: string;
  card_id: string;
  card_search: string;
  orientation: Orientation;
  interpretation: string;
};

const today = new Date().toISOString().slice(0, 10);

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
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [form, setForm] = useState({ title: "", date: today, question: "", overall_notes: "" });
  const [spreadCards, setSpreadCards] = useState<SpreadCardForm[]>([blankSpreadCard()]);
  const [activeCardSearchIndex, setActiveCardSearchIndex] = useState<number | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void listCards().then((result) => {
      setCards(result);
      if (!id && result[0]) setSpreadCards([blankSpreadCard(result[0].id, result[0].name)]);
    });
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
    setSpreadCards((current) => [...current, blankSpreadCard(cards[0]?.id ?? "", cards[0]?.name ?? "")]);
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
  }

  function selectCard(index: number, card: TarotCard) {
    updateSpreadCard(index, { card_id: card.id, card_search: card.name });
    setActiveCardSearchIndex(null);
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
            {spreadCards.map((item, index) => (
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
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search cards"
                        required
                        value={item.card_search}
                        onChange={(event) => updateCardSearch(index, event.target.value)}
                        onFocus={() => setActiveCardSearchIndex(index)}
                        onBlur={() => setActiveCardSearchIndex(null)}
                      />
                      {activeCardSearchIndex === index && (
                        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-md border bg-card py-1 shadow-lg">
                          {getCardOptions(item).length ? (
                            getCardOptions(item).map((card) => (
                              <button
                                key={card.id}
                                type="button"
                                className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
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
            ))}
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

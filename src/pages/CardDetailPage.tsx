import { Edit, Save, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCard, getCardReadingHistory, noteCategories, saveCardNotes, upsertCard } from "@/lib/repository";
import { formatDate } from "@/lib/utils";
import type { CardReadingHistoryItem, CardWithNotes } from "@/types/database";

export function CardDetailPage() {
  const { id } = useParams();
  const [card, setCard] = useState<CardWithNotes | null>(null);
  const [history, setHistory] = useState<CardReadingHistoryItem[]>([]);
  const [form, setForm] = useState({ name: "", arcana: "", suit: "", number: "", image_url: "" });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!id) return;
    void loadCard(id);
  }, [id]);

  async function loadCard(cardId: string) {
    const result = await getCard(cardId);
    if (!result) return;
    setCard(result);
    setForm({
      name: result.name,
      arcana: result.arcana,
      suit: result.suit ?? "",
      number: result.number?.toString() ?? "",
      image_url: result.image_url ?? "",
    });
    setNotes(
      Object.fromEntries(
        noteCategories.map((category) => [
          category,
          result.card_notes.find((note) => note.category === category)?.content ?? "",
        ]),
      ),
    );
    setHistory(await getCardReadingHistory(result.id));
  }

  function resetForm(nextCard = card) {
    if (!nextCard) return;
    setForm({
      name: nextCard.name,
      arcana: nextCard.arcana,
      suit: nextCard.suit ?? "",
      number: nextCard.number?.toString() ?? "",
      image_url: nextCard.image_url ?? "",
    });
    setNotes(
      Object.fromEntries(
        noteCategories.map((category) => [
          category,
          nextCard.card_notes.find((note) => note.category === category)?.content ?? "",
        ]),
      ),
    );
  }

  function handleEdit() {
    resetForm();
    setStatus("");
    setIsEditing(true);
  }

  function handleCancel() {
    resetForm();
    setStatus("");
    setIsEditing(false);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!card) return;
    await upsertCard({
      id: card.id,
      name: form.name,
      arcana: form.arcana,
      suit: form.suit || null,
      number: form.number ? Number(form.number) : null,
      image_url: form.image_url || null,
    });
    await saveCardNotes(card.id, notes);
    setStatus("Saved");
    await loadCard(card.id);
    setIsEditing(false);
  }

  const title = useMemo(() => card?.name ?? "Card", [card]);
  const readOnlyNotes = useMemo(
    () =>
      Object.fromEntries(
        noteCategories.map((category) => [
          category,
          card?.card_notes.find((note) => note.category === category)?.content ?? "",
        ]),
      ),
    [card],
  );

  if (!card) {
    return (
      <main className="page-shell">
        <p className="text-sm text-muted-foreground">Loading card...</p>
      </main>
    );
  }

  return (
    <main className="page-shell space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/" className="text-sm font-medium text-primary">Back to deck</Link>
          <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{card.arcana}{card.suit ? ` / ${card.suit}` : ""}</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <Button type="button" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <form className="grid gap-6 lg:grid-cols-[280px_1fr]" onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Card Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex min-h-72 items-center justify-center rounded-md bg-muted text-center text-sm font-medium text-muted-foreground">
              {(isEditing ? form.image_url : card.image_url) ? (
                <img src={isEditing ? form.image_url : card.image_url ?? ""} alt="" className="w-full rounded-md object-contain" />
              ) : (
                card.name
              )}
            </div>
            {isEditing ? (
              <>
                <label className="space-y-2 block">
                  <span className="field-label">Name</span>
                  <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label className="space-y-2 block">
                  <span className="field-label">Arcana</span>
                  <Input value={form.arcana} onChange={(event) => setForm({ ...form, arcana: event.target.value })} />
                </label>
                <label className="space-y-2 block">
                  <span className="field-label">Suit</span>
                  <Input value={form.suit} onChange={(event) => setForm({ ...form, suit: event.target.value })} />
                </label>
                <label className="space-y-2 block">
                  <span className="field-label">Number</span>
                  <Input type="number" value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} />
                </label>
                <label className="space-y-2 block">
                  <span className="field-label">Image URL</span>
                  <Input value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} />
                </label>
              </>
            ) : (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="field-label">Name</dt>
                  <dd className="mt-1 font-medium">{card.name}</dd>
                </div>
                <div>
                  <dt className="field-label">Arcana</dt>
                  <dd className="mt-1">{card.arcana}</dd>
                </div>
                <div>
                  <dt className="field-label">Suit</dt>
                  <dd className="mt-1">{card.suit || "None"}</dd>
                </div>
                <div>
                  <dt className="field-label">Number</dt>
                  <dd className="mt-1">{card.number ?? "None"}</dd>
                </div>
                <div>
                  <dt className="field-label">Image URL</dt>
                  <dd className="mt-1 break-words text-muted-foreground">{card.image_url || "None"}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interpretations</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {isEditing
                ? noteCategories.map((category) => (
                    <label className="space-y-2 block" key={category}>
                      <span className="field-label">{category}</span>
                      <Textarea
                        value={notes[category] ?? ""}
                        onChange={(event) => setNotes({ ...notes, [category]: event.target.value })}
                      />
                    </label>
                  ))
                : noteCategories.map((category) => (
                    <section className="space-y-2" key={category}>
                      <h3 className="field-label">{category}</h3>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {readOnlyNotes[category] || "No notes yet."}
                      </p>
                    </section>
                  ))}
            </CardContent>
          </Card>
          {(isEditing || status) && (
            <div className="flex items-center gap-3">
              {isEditing && (
                <Button type="submit">
                  <Save className="h-4 w-4" />
                  Save Card
                </Button>
              )}
              {status && <span className="text-sm text-muted-foreground">{status}</span>}
            </div>
          )}
        </div>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Reading History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length ? (
            <div className="divide-y">
              {history.map((item) => (
                <Link key={item.id} to={`/readings/${item.reading_id}`} className="block py-3 hover:text-primary">
                  <p className="font-medium">{item.readings.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(item.readings.date)} / {item.position_name} / {item.orientation}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">This card has not appeared in a saved reading yet.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

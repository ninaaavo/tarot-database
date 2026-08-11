import { Search } from "lucide-react";
import { FocusEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { sanitizeRichTextHtml } from "@/components/ui/rich-text-editor";
import { cardSlug, listCardsWithNotes } from "@/lib/repository";
import { cn } from "@/lib/utils";
import type { CardWithNotes } from "@/types/database";

const previewCategories = ["Meaning", "Action", "Strength", "Weakness", "Outcome", "Reversed Meaning"];
const previewWidth = 288;
const previewGap = 12;

type PreviewPlacement = "left" | "right";

function getPreviewNotes(card: CardWithNotes) {
  return previewCategories
    .map((category) => card.card_notes.find((note) => note.category === category && note.content.trim()))
    .filter((note) => Boolean(note));
}

function hasHtml(value: string) {
  return /<[a-z][\s\S]*>/i.test(value);
}

export function DeckPage() {
  const [cards, setCards] = useState<CardWithNotes[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewPlacements, setPreviewPlacements] = useState<Record<string, PreviewPlacement>>({});

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCards(search);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [search]);

  async function loadCards(term = search) {
    try {
      setIsLoading(true);
      setCards(await listCardsWithNotes(term));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load cards.");
    } finally {
      setIsLoading(false);
    }
  }

  function updatePreviewPlacement(
    cardId: string,
    event: MouseEvent<HTMLAnchorElement> | FocusEvent<HTMLAnchorElement>,
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    const rightSpace = window.innerWidth - rect.right;
    const leftSpace = rect.left;
    const placement = rightSpace < previewWidth + previewGap && leftSpace > rightSpace ? "left" : "right";

    setPreviewPlacements((current) => ({ ...current, [cardId]: placement }));
  }

  const groupedCards = useMemo(() => {
    return cards.reduce<Record<string, CardWithNotes[]>>((groups, card) => {
      const key = card.arcana === "Minor Arcana" && card.suit ? card.suit : card.arcana;
      groups[key] = [...(groups[key] ?? []), card];
      return groups;
    }, {});
  }, [cards]);

  function renderCard(card: CardWithNotes) {
    const previewNotes = getPreviewNotes(card);
    const previewPlacement = previewPlacements[card.id] ?? "right";

    return (
      <Link
        key={card.id}
        to={`/cards/${cardSlug(card)}`}
        onFocus={(event) => updatePreviewPlacement(card.id, event)}
        onMouseEnter={(event) => updatePreviewPlacement(card.id, event)}
        className="group relative rounded-lg border bg-card p-3 shadow-sm transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="mb-3 flex min-h-40 items-center justify-center rounded-md bg-muted text-center text-sm font-medium text-muted-foreground">
          {card.image_url ? <img src={card.image_url} alt="" className="w-full rounded-md object-contain" /> : card.name}
        </div>
        <p className="line-clamp-2 min-h-10 text-sm font-semibold group-hover:text-primary">{card.name}</p>
        <p className="text-xs text-muted-foreground">{card.suit ?? card.arcana}</p>

        <div
          className={cn(
            "pointer-events-none absolute left-1/2 top-3 z-30 hidden w-72 -translate-x-1/2 rounded-lg border bg-card p-4 text-left shadow-xl group-hover:block group-focus-visible:block sm:left-auto sm:top-0 sm:translate-x-0",
            previewPlacement === "left" ? "sm:right-full sm:mr-3" : "sm:left-full sm:ml-3",
          )}
        >
          <p className="text-sm font-semibold">{card.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{card.suit ?? card.arcana}</p>
          <div className="mt-3 space-y-3">
            {previewNotes.length ? (
              previewNotes.map((note) => (
                <div key={note!.id}>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{note!.category}</p>
                  {hasHtml(note!.content) ? (
                    <div
                      className="rich-text-editor mt-1 line-clamp-4 text-sm leading-5"
                      dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(note!.content) }}
                    />
                  ) : (
                    <p className="mt-1 line-clamp-4 text-sm leading-5">{note!.content}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No interpretation saved yet.</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  const hasActiveSearch = search.trim().length > 0;

  return (
    <main className="page-shell space-y-6">
      <section>
        <div>
          <h2 className="text-2xl font-semibold">Deck</h2>
          <p className="text-sm text-muted-foreground">Browse, search, and maintain your tarot card encyclopedia.</p>
        </div>
      </section>

      <div className="relative">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search cards"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {error && <p className="rounded-md border border-destructive bg-card p-3 text-sm text-destructive">{error}</p>}

      {isLoading && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="font-medium">Loading cards...</p>
          <p className="text-sm text-muted-foreground">Fetching your deck from the database.</p>
        </div>
      )}

      {!isLoading && (
      <div className="space-y-8">
        {hasActiveSearch ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {cards.map(renderCard)}
          </div>
        ) : (
        Object.entries(groupedCards).map(([group, items]) => (
          <section key={group} className="space-y-3">
            <h3 className="text-lg font-semibold">{group}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {items.map(renderCard)}
            </div>
          </section>
        ))
        )}
      </div>
      )}

      {!isLoading && cards.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="font-medium">No cards found.</p>
          <p className="text-sm text-muted-foreground">Try a different search or add a custom card.</p>
        </div>
      )}
    </main>
  );
}

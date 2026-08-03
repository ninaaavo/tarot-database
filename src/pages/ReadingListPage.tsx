import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { listReadings } from "@/lib/repository";
import { formatDate } from "@/lib/utils";
import type { Reading } from "@/types/database";

export function ReadingListPage() {
  const [readings, setReadings] = useState<Array<Reading & { card_count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadReadings();
  }, []);

  async function loadReadings() {
    try {
      setIsLoading(true);
      setReadings(await listReadings());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load readings.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-shell space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Readings</h2>
          <p className="text-sm text-muted-foreground">Review your tarot reading journal.</p>
        </div>
        <Link
          to="/readings/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Reading
        </Link>
      </section>

      {error && <p className="rounded-md border border-destructive bg-card p-3 text-sm text-destructive">{error}</p>}

      {isLoading && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="font-medium">Loading readings...</p>
          <p className="text-sm text-muted-foreground">Fetching your journal from the database.</p>
        </div>
      )}

      {!isLoading && (
      <div className="space-y-3">
        {readings.map((reading) => (
          <Link key={reading.id} to={`/readings/${reading.id}`}>
            <Card className="transition-colors hover:border-primary">
              <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">{reading.title}</h3>
                  <p className="text-sm text-muted-foreground">{formatDate(reading.date)}</p>
                </div>
                <p className="text-sm text-muted-foreground">{reading.card_count} cards</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      )}

      {!isLoading && readings.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="font-medium">No readings yet.</p>
          <p className="text-sm text-muted-foreground">Create your first spread and attach cards to it.</p>
        </div>
      )}
    </main>
  );
}

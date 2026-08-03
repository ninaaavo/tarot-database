import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cardSlug, deleteReading, getReading } from "@/lib/repository";
import { formatDate } from "@/lib/utils";
import type { ReadingWithCards } from "@/types/database";

export function ReadingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reading, setReading] = useState<ReadingWithCards | null>(null);

  useEffect(() => {
    if (id) void getReading(id).then(setReading);
  }, [id]);

  async function handleDelete() {
    if (!id || !window.confirm("Delete this reading?")) return;
    await deleteReading(id);
    navigate("/readings");
  }

  if (!reading) {
    return (
      <main className="page-shell">
        <p className="text-sm text-muted-foreground">Loading reading...</p>
      </main>
    );
  }

  return (
    <main className="page-shell space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/readings" className="text-sm font-medium text-primary">Back to readings</Link>
          <h2 className="mt-2 text-3xl font-semibold">{reading.title}</h2>
          <p className="text-sm text-muted-foreground">{formatDate(reading.date)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/readings/${reading.id}/edit`)}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="field-label">Question</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{reading.question || "No question recorded."}</p>
          </div>
          <div>
            <p className="field-label">Overall Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{reading.overall_notes || "No notes recorded."}</p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Cards Used</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {reading.reading_cards.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-3">
                  <span>{item.position_name}</span>
                  <span className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">{item.orientation}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to={`/cards/${cardSlug(item.cards)}`} className="font-medium text-primary">{item.cards.name}</Link>
                <div>
                  <p className="field-label">Interpretation</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{item.interpretation || "No interpretation recorded."}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Plus,
  Save,
  Trash2,
  Underline,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  deleteGeneralNoteEntry,
  listGeneralNoteEntries,
  saveGeneralNoteEntry,
} from "@/lib/repository";
import { cn } from "@/lib/utils";
import type { GeneralNoteEntry } from "@/types/database";

const blankBody = "";

function formatSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "never";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function toPlainText(value: string) {
  const document = new DOMParser().parseFromString(value, "text/html");
  return document.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

export function GeneralNotesPage() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [entries, setEntries] = useState<GeneralNoteEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(blankBody);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const activeEntry = entries.find((entry) => entry.id === activeId) ?? null;

  useEffect(() => {
    void loadEntries();
  }, []);

  async function loadEntries(nextActiveId?: string) {
    setIsLoading(true);
    const result = await listGeneralNoteEntries();
    setEntries(result);

    const selectedEntry = result.find((entry) => entry.id === nextActiveId) ?? result[0] ?? null;
    selectEntry(selectedEntry);
    setIsLoading(false);
  }

  function selectEntry(entry: GeneralNoteEntry | null) {
    setActiveId(entry?.id ?? null);
    setTitle(entry?.title ?? "");
    setBody(entry?.body ?? blankBody);
    setStatus("");
    if (editorRef.current) {
      editorRef.current.innerHTML = entry?.body ?? blankBody;
    }
  }

  function startNewEntry() {
    selectEntry(null);
    window.setTimeout(() => editorRef.current?.focus(), 0);
  }

  function syncBodyFromEditor() {
    setBody(editorRef.current?.innerHTML ?? "");
    setStatus("");
  }

  function runFormat(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncBodyFromEditor();
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const usesShortcut = event.ctrlKey || event.metaKey;
    if (!usesShortcut) return;

    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      runFormat("bold");
    } else if (key === "i") {
      event.preventDefault();
      runFormat("italic");
    } else if (key === "u") {
      event.preventDefault();
      runFormat("underline");
    } else if (event.shiftKey && key === "7") {
      event.preventDefault();
      runFormat("insertOrderedList");
    } else if (event.shiftKey && key === "8") {
      event.preventDefault();
      runFormat("insertUnorderedList");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const savedEntry = await saveGeneralNoteEntry({
      id: activeEntry?.id,
      title: title.trim() || "Untitled Note",
      body,
    });
    setStatus("Saved");
    await loadEntries(savedEntry.id);
  }

  async function handleDelete() {
    if (!activeEntry || !window.confirm("Delete this note?")) return;
    await deleteGeneralNoteEntry(activeEntry.id);
    await loadEntries();
  }

  return (
    <main className="page-shell space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">General Notes</h2>
          <p className="text-sm text-muted-foreground">Blog-style notes for observations that are not tied to one card.</p>
        </div>
        <Button type="button" onClick={startNewEntry}>
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading notes...</p>
            ) : entries.length ? (
              <div className="space-y-2">
                {entries.map((entry) => {
                  const preview = toPlainText(entry.body);

                  return (
                    <button
                      className={cn(
                        "w-full rounded-md border p-3 text-left transition-colors hover:border-primary",
                        activeId === entry.id ? "border-primary bg-primary/10" : "bg-background",
                      )}
                      key={entry.id}
                      type="button"
                      onClick={() => selectEntry(entry)}
                    >
                      <p className="line-clamp-1 text-sm font-semibold">{entry.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatSavedAt(entry.updated_at)}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {preview || "No body text yet."}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
          </CardContent>
        </Card>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>{activeEntry ? "Edit Note" : "New Note"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="space-y-2 block">
                <span className="field-label">Title</span>
                <Input
                  placeholder="Note title"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setStatus("");
                  }}
                />
              </label>

              <div className="flex flex-wrap gap-2 rounded-md border bg-background p-2">
                <Button type="button" variant="ghost" size="icon" onClick={() => runFormat("bold")} aria-label="Bold" title="Bold (Ctrl+B)">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => runFormat("italic")} aria-label="Italic" title="Italic (Ctrl+I)">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => runFormat("underline")} aria-label="Underline" title="Underline (Ctrl+U)">
                  <Underline className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => runFormat("insertUnorderedList")} aria-label="Bulleted list" title="Bulleted list (Ctrl+Shift+8)">
                  <List className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => runFormat("insertOrderedList")} aria-label="Numbered list" title="Numbered list (Ctrl+Shift+7)">
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </div>

              <div
                className="rich-text-editor min-h-[480px] rounded-md border border-input bg-card px-4 py-3 text-base leading-7 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                contentEditable
                onInput={syncBodyFromEditor}
                onKeyDown={handleEditorKeyDown}
                ref={editorRef}
                role="textbox"
                suppressContentEditableWarning
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {activeEntry ? `Last saved ${formatSavedAt(activeEntry.updated_at)}` : "Unsaved note"}
                </p>
                <div className="flex items-center gap-3">
                  {status && <span className="text-sm text-muted-foreground">{status}</span>}
                  {activeEntry && (
                    <Button type="button" variant="destructive" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                  <Button type="submit">
                    <Save className="h-4 w-4" />
                    Save Note
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </main>
  );
}

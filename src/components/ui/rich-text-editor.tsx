import { KeyboardEvent, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  className?: string;
  value: string;
  onChange: (value: string) => void;
};

export function sanitizeRichTextHtml(value: string) {
  const template = document.createElement("template");
  template.innerHTML = value;

  const allowedTags = new Set(["B", "BR", "DIV", "EM", "I", "LI", "OL", "P", "SPAN", "STRONG", "U", "UL"]);
  const nodes = Array.from(template.content.querySelectorAll("*"));

  nodes.forEach((node) => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }

    Array.from(node.attributes).forEach((attribute) => node.removeAttribute(attribute.name));
  });

  return template.innerHTML;
}

function hasHtml(value: string) {
  return /<[a-z][\s\S]*>/i.test(value);
}

function plainTextToHtml(value: string) {
  const container = document.createElement("div");
  value.split("\n").forEach((line, index) => {
    if (index > 0) container.append(document.createElement("br"));
    container.append(document.createTextNode(line));
  });
  return container.innerHTML;
}

function toEditorHtml(value: string) {
  return hasHtml(value) ? sanitizeRichTextHtml(value) : plainTextToHtml(value);
}

export function RichTextEditor({ className, value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current || document.activeElement === editorRef.current) return;
    editorRef.current.innerHTML = toEditorHtml(value);
  }, [value]);

  function syncValue() {
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function runFormat(command: string) {
    editorRef.current?.focus();
    document.execCommand(command);
    syncValue();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
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
    } else if (event.shiftKey && event.code === "Digit7") {
      event.preventDefault();
      runFormat("insertOrderedList");
    } else if (event.shiftKey && event.code === "Digit8") {
      event.preventDefault();
      runFormat("insertUnorderedList");
    }
  }

  return (
    <div className="rounded-md border border-input bg-card focus-within:ring-2 focus-within:ring-ring">
      <div
        className={cn("rich-text-editor min-h-28 w-full px-3 py-2 text-sm outline-none", className)}
        contentEditable
        onInput={syncValue}
        onKeyDown={handleKeyDown}
        ref={editorRef}
        role="textbox"
        suppressContentEditableWarning
      />
    </div>
  );
}

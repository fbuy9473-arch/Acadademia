"use client";

import { useState, useTransition } from "react";
import { reorderSections } from "@/app/admin/(panel)/paginas/actions";

/** Lista reordenável por arrastar e largar, com botões ↑↓ para teclado/telemóvel. */
export default function SectionList({ pageId, items }: { pageId: string; items: { id: string; node: React.ReactNode }[] }) {
  const [order, setOrder] = useState(items.map((i) => i.id));
  const [drag, setDrag] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const byId = new Map(items.map((i) => [i.id, i.node]));
  const ids = order.filter((i) => byId.has(i));

  const commit = (next: string[]) => { setOrder(next); start(() => reorderSections(pageId, next)); };
  const move = (id: string, dir: number) => {
    const i = ids.indexOf(id), j = i + dir;
    if (j < 0 || j >= ids.length) return;
    const next = [...ids]; [next[i], next[j]] = [next[j], next[i]]; commit(next);
  };

  return (
    <ul className={`space-y-3 ${pending ? "opacity-70" : ""}`}>
      {ids.map((id) => (
        <li key={id} draggable onDragStart={() => setDrag(id)} onDragEnd={() => setDrag(null)} onDragOver={(e) => e.preventDefault()}
          onDrop={() => { if (!drag || drag === id) return; const next = ids.filter((x) => x !== drag); next.splice(next.indexOf(id), 0, drag); commit(next); }}
          className="flex gap-2 rounded-xl border border-line bg-paper p-3">
          <div className="flex flex-col items-center gap-1 text-muted">
            <span aria-hidden className="cursor-grab select-none">⋮⋮</span>
            <button type="button" onClick={() => move(id, -1)} aria-label="Subir secção" className="px-1">↑</button>
            <button type="button" onClick={() => move(id, 1)} aria-label="Descer secção" className="px-1">↓</button>
          </div>
          <div className="min-w-0 flex-1">{byId.get(id)}</div>
        </li>
      ))}
    </ul>
  );
}

import React, { useState, KeyboardEvent, useMemo, useRef, useEffect } from 'react';

type Props = {
  value?: string[];
  onChange?: (next: string[]) => void;
  placeholder?: string;
  id?: string;
  suggestions?: string[]; // optional list of suggestions to show
};

const TagInput: React.FC<Props> = ({ value = [], onChange, placeholder = '', id, suggestions = [] }) => {
  const [input, setInput] = useState('');
  const [highlight, setHighlight] = useState<number>(-1);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const liveRef = useRef<HTMLDivElement | null>(null);

  const filteredSuggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return suggestions.filter(s => !value.includes(s)).slice(0, 6);
    return suggestions
      .filter(s => s.toLowerCase().includes(q) && !value.includes(s))
      .slice(0, 6);
  }, [input, suggestions, value]);

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t) return;
    const next = Array.from(new Set([...value, t]));
    onChange?.(next);
    setInput('');
    setHighlight(-1);
    // remove chosen tag from popular options immediately
    setPopularLocal(prev => prev.filter(p => p !== t));
    announce(`${t} added`);
  };

  const removeTag = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    onChange?.(next);
    announce(`${value[idx]} removed`);
  };

  const announce = (msg: string) => {
    if (!liveRef.current) return;
    liveRef.current.textContent = msg;
    // clear after a moment
    setTimeout(() => { if (liveRef.current) liveRef.current.textContent = ''; }, 2000);
  };

  // drag handlers (basic HTML5 drag'n'drop for reordering)
  const dragIndex = useRef<number | null>(null);
  const onDragStart = (e: React.DragEvent, idx: number) => { dragIndex.current = idx; e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); };
  const onDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null) return;
    const next = Array.from(value);
    const [item] = next.splice(from, 1);
    next.splice(idx, 0, item);
    onChange?.(next);
    dragIndex.current = null;
    announce(`${item} moved`);
  };

  const startEdit = (idx: number) => { setEditingIndex(idx); setEditValue(value[idx]); };
  const commitEdit = (idx: number) => {
    const v = editValue.trim();
    if (!v) {
      // remove if emptied
      removeTag(idx);
    } else {
      const next = Array.from(value);
      next[idx] = v;
      onChange?.(Array.from(new Set(next)));
      announce(`${v} updated`);
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(h => Math.min(h + 1, filteredSuggestions.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, -1));
      return;
    }
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (highlight >= 0 && filteredSuggestions[highlight]) {
        addTag(filteredSuggestions[highlight]);
      } else if (input) addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length) {
      // remove last
      removeTag(value.length - 1);
    }
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Popular options: local state so clicks remove them immediately for better UX
  const [popularLocal, setPopularLocal] = useState<string[]>(() => suggestions.filter(s => !value.includes(s)).slice(0, 8));

  // Keep popularLocal in sync when suggestions or value change
  useEffect(() => {
    const fromProps = suggestions.filter(s => !value.includes(s));
    // If a popular list was already pruned locally, keep that pruning
    setPopularLocal(prev => {
      // keep items that are still present in fromProps and were not added to value
      const next = fromProps.filter(s => !value.includes(s));
      // preserve previous order but limit to 8
      const merged = prev.concat(next.filter(s => !prev.includes(s))).slice(0, 8);
      return merged;
    });
  }, [suggestions, value]);

  return (
    <div className="relative border rounded p-2 bg-white" ref={containerRef}>
      <div className="flex flex-wrap gap-2">
        {value.map((t, i) => (
          <span key={t + i} draggable onDragStart={(e) => onDragStart(e, i)} onDragOver={(e) => onDragOver(e, i)} onDrop={(e) => onDrop(e, i)} className="flex items-center gap-2 bg-muted px-2 py-1 rounded text-sm">
            {editingIndex === i ? (
              <input className="outline-none bg-transparent" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => commitEdit(i)} onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(i); }} autoFocus />
            ) : (
              <span onDoubleClick={() => startEdit(i)}>{t}</span>
            )}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => removeTag(i)} className="text-xs">✕</button>
          </span>
        ))}
        <input
          id={id}
          ref={inputRef}
          className="flex-1 outline-none min-w-[140px]"
          value={input}
          onChange={e => { setInput(e.target.value); setHighlight(-1); }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={filteredSuggestions.length > 0}
        />
      </div>
      {popularLocal.length > 0 && (
        <div className="mt-3 mb-2 flex flex-wrap gap-2">
          {popularLocal.map(p => (
            <button key={p} type="button" onClick={() => { addTag(p); setPopularLocal(pl => pl.filter(x => x !== p)); }} className="px-3 py-1 bg-slate-100 rounded text-sm">
              {p}
            </button>
          ))}
        </div>
      )}
      <div className="text-xs text-muted-foreground mt-1">Press Enter or comma to add</div>
      <div aria-live="polite" ref={liveRef} className="sr-only" />
    </div>
  );
};

export default TagInput;

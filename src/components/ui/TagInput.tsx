"use client";

import { useState, useRef, useEffect } from "react";

const SUGGESTED_TAGS = [
  // Romantic
  { label: "date", category: "Romantic", color: "bg-rose-100 text-rose-700" },
  { label: "romantic", category: "Romantic", color: "bg-rose-100 text-rose-700" },
  { label: "anniversary", category: "Romantic", color: "bg-rose-100 text-rose-700" },
  { label: "special", category: "Romantic", color: "bg-rose-100 text-rose-700" },

  // Food
  { label: "dinner", category: "Food", color: "bg-amber-100 text-amber-700" },
  { label: "lunch", category: "Food", color: "bg-amber-100 text-amber-700" },
  { label: "breakfast", category: "Food", color: "bg-amber-100 text-amber-700" },
  { label: "restaurant", category: "Food", color: "bg-amber-100 text-amber-700" },
  { label: "cooking", category: "Food", color: "bg-amber-100 text-amber-700" },

  // Outdoor
  { label: "outdoor", category: "Outdoor", color: "bg-emerald-100 text-emerald-700" },
  { label: "hiking", category: "Outdoor", color: "bg-emerald-100 text-emerald-700" },
  { label: "beach", category: "Outdoor", color: "bg-emerald-100 text-emerald-700" },
  { label: "picnic", category: "Outdoor", color: "bg-emerald-100 text-emerald-700" },
  { label: "nature", category: "Outdoor", color: "bg-emerald-100 text-emerald-700" },

  // Entertainment
  { label: "movie", category: "Entertainment", color: "bg-violet-100 text-violet-700" },
  { label: "concert", category: "Entertainment", color: "bg-violet-100 text-violet-700" },
  { label: "show", category: "Entertainment", color: "bg-violet-100 text-violet-700" },
  { label: "weekend", category: "Entertainment", color: "bg-violet-100 text-violet-700" },

  // Travel
  { label: "travel", category: "Travel", color: "bg-sky-100 text-sky-700" },
  { label: "trip", category: "Travel", color: "bg-sky-100 text-sky-700" },
  { label: "vacation", category: "Travel", color: "bg-sky-100 text-sky-700" },
  { label: "adventure", category: "Travel", color: "bg-sky-100 text-sky-700" },

  // Cozy
  { label: "cozy", category: "Cozy", color: "bg-orange-100 text-orange-700" },
  { label: "home", category: "Cozy", color: "bg-orange-100 text-orange-700" },
  { label: "chill", category: "Cozy", color: "bg-orange-100 text-orange-700" },
  { label: "relax", category: "Cozy", color: "bg-orange-100 text-orange-700" },
];

type TagInputProps = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
};

export default function TagInput({
  name,
  defaultValue = "",
  placeholder = "dinner, cozy, weekend",
}: TagInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected tags from the current value
  const selectedTags = value
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  // Filter suggestions based on input
  const filteredTags = SUGGESTED_TAGS.filter(
    (tag) =>
      !selectedTags.includes(tag.label) &&
      (filter === "" || tag.label.includes(filter.toLowerCase()))
  );

  // Group tags by category
  const groupedTags = filteredTags.reduce<
    Record<string, typeof SUGGESTED_TAGS>
  >((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {});

  const addTag = (tag: string) => {
    const currentTags = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!currentTags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())) {
      const newValue =
        currentTags.length > 0 ? `${currentTags.join(", ")}, ${tag}` : tag;
      setValue(newValue);
    }
    setFilter("");
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
    setValue(newTags.join(", "));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />

      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selectedTags.map((tag) => {
            const tagInfo = SUGGESTED_TAGS.find((t) => t.label === tag);
            return (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                  tagInfo?.color ?? "bg-slate-100 text-slate-700"
                }`}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:opacity-70"
                >
                  &times;
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        className="w-full rounded-xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-rose-300"
        placeholder={placeholder}
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && filter.trim()) {
            e.preventDefault();
            addTag(filter.trim());
          }
          if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
      />

      {/* Dropdown */}
      {isOpen && Object.keys(groupedTags).length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[var(--panel-border)] bg-white shadow-lg"
        >
          {Object.entries(groupedTags).map(([category, tags]) => (
            <div key={category}>
              <div className="sticky top-0 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                {category}
              </div>
              {tags.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => addTag(tag.label)}
                >
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${tag.color}`}
                  >
                    {tag.label}
                  </span>
                </button>
              ))}
            </div>
          ))}
          {filter && !SUGGESTED_TAGS.some((t) => t.label === filter.toLowerCase()) && (
            <button
              type="button"
              className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50"
              onClick={() => addTag(filter.trim())}
            >
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                + Add &quot;{filter}&quot;
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

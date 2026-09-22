"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

interface BlogSearchBarProps {
  locale: string;
  initialQuery?: string;
  placeholder?: string;
}

export default function BlogSearchBar({
  locale,
  initialQuery = "",
  placeholder,
}: BlogSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  const defaultPlaceholder = "Search blog posts...";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();

    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set("search", trimmed);
    } else {
      params.delete("search");
    }
    params.delete("page"); // reset to page 1 on new search

    startTransition(() => {
      const qs = params.toString();
      router.push(`/${locale}/blog${qs ? `?${qs}` : ""}`);
    });
  }

  function handleClear() {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("page");

    startTransition(() => {
      const qs = params.toString();
      router.push(`/${locale}/blog${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <form
      onSubmit={handleSearch}
      className="w-full relative bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100 hover:border-gray-200 transition-all p-2 flex items-center gap-3"
      dir="ltr"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || defaultPlaceholder}
        className="flex-1 bg-transparent px-4 py-2 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none font-medium"
      />

      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full transition-colors cursor-pointer"
          title="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl text-[#ed1c24] hover:bg-red-50 active:scale-95 transition-all cursor-pointer shrink-0"
        title="Search"
        aria-label="Search"
      >
        {isPending ? (
          <Loader2 className="w-5 h-5 animate-spin text-[#ed1c24]" />
        ) : (
          <Search className="w-5 h-5 sm:w-6 sm:h-6" />
        )}
      </button>
    </form>
  );
}

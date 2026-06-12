export default function BlogSearch({ value, onChange }) {
  return (
    <div className="relative max-w-xl">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search articles, stories, and posts..."
        className="w-full bg-paper border border-border-light px-4 py-3 pl-11 text-ink text-sm placeholder-ink-muted/50 focus:outline-none focus:border-gold/50"
      />
      <svg
        className="w-4 h-4 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  )
}

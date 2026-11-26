# Copy notes (2026-11-26)

Codex (gpt-6.2-sol) was asked for the meaning and wording variants with the same brief, but its usage limit was hit (resets 18:00), so this round has only Claude's variants. A Codex pass can be run later and compared against the picks below.

## Meanings (reader: a developer in long Claude Code sessions who steps away)

1. **The prompt cache lives one hour and expires silently.** Chosen: the core problem, invisible today.
2. **A cold cache makes the next prompt rewrite the whole context at full price** (1-hour cache write 2x base input vs cache read 0.1x). Chosen: why it matters.
3. **The band shows the hour at a glance**, colors change under 10 minutes and after expiry. Chosen.
4. **Auto-compact at 55 minutes turns the rewrite into a short summary**, once per idle period. Chosen.
5. **Keep warm for planned breaks**, one ping when the cache is 50 minutes old. Chosen.
6. Install is one line, nothing to configure. Chosen for the install section only.
7. Free and MIT. Footer only.
8. Works in the open chat, not the session list. Dropped: a limitation, not a reason to read.
9. TTL is a constant you can set to 5 minutes. Kept as a footnote in install.

## Hero headline variants

1. Your cache has one hour. **(winner)**
2. Know before the cache goes cold.
3. The hour you never see.
4. Watch the cache, not the bill.
5. A clock for the prompt cache.
6. Don't pay twice for the same context.
7. Sixty minutes, then full price.
8. Come back to a warm cache.
9. The prompt cache, on a timer.
10. Cold cache, hot bill.
11. Leave. Come back. Still warm.
12. One hour of cheap context.

Why 1 won: it states the fact the reader is missing (there is a deadline) in five words, and every section below explains what happens to that hour. 7 was close but leads with loss; 2 and 5 describe the tool, not the reader's situation.

Lead variants: (a) "cache-timer puts that hour above the Claude Code prompt, compacts an idle session before it runs out, and keeps the cache warm while you are away." **(winner: names all three functions in reader terms)**; (b) "See how much is left, compact before it ends, or keep it warm." (too terse, loses the subject); (c) "A band above the prompt counts down the prompt cache and acts before it expires." (misses keep warm).

## Section headlines (winner first)

- Clock: "Warm for an hour. Then full price." / "Sixty minutes of cheap reads." / "The hour, minute by minute."
- Band: "Three colors. One glance." / "One line above the prompt." / "Dim, amber, red."
- Auto-compact: "Compact while it is still warm." / "Five minutes before the cliff." / "A summary, not a rewrite."
- Keep warm: "Out for lunch. Cache stays warm." / "Away for hours, warm on return." / "One ping an hour."
- Install: "One line. Nothing to configure." / "Install and forget." / "One command."

Thesis: "Claude keeps your context in the prompt cache for one hour. Miss it, and the next prompt writes the whole conversation again at full price." Chosen over shorter variants because it carries both meanings 1 and 2 in one sentence.

Russian follows the same picks: "У кэша есть один час.", "Час в тепле. Потом полная цена.", "Три цвета. Один взгляд.", "Сжать, пока кэш теплый.", "Ушли на обед. Кэш остался теплым.", "Одна строка. Настраивать нечего."

## Audit fixes (2026-11-26)

Checked every claim against `hooks/register.tsx` and the Claude Code prompt caching docs (code.claude.com/docs/en/prompt-caching).

- The one-hour TTL is the default only on a Claude subscription within plan usage; API keys, usage credits and cloud providers get 5 minutes. Thesis now says "On a Claude subscription", and the install note explains `promptCacheTtl` / `TTL_MS`.
- "At full price" understated the cost: a 1-hour cache write is 2x base input. Thesis now says "at twice the base input price instead of a tenth". The headline "Then full price." stays as a figure of speech (the discount is gone).
- Auto-compact at 55 minutes resets the band (the plugin sets `lastAt` to the summary request). The clock's 60-minute step is now labelled "not compacted", and the hero band shows the real default path: 55 idle minutes, then "Auto-compacted at HH:MM".
- After a keep-warm window the next event is the auto-compact at last ping + 55 min, not expiry at + 60. The chart and the stat changed accordingly.
- Ping counts assume the button is pressed right after a reply (pressed later: 3-4, 7-8, 14-15 for 3h, 6h, 12h). The note says so, and that the ping has not yet run a full 50-minute cycle (as the plugin README states).
- Band mock: real button labels ("Keep warm 6h"), real `fmt` output ("1h 0m", "auto-compact in 55m 0s").

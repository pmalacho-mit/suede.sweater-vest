/**
 * Generated documentation inside a README the author also writes by hand.
 *
 * Each generated section is fenced by a pair of comments that name where it
 * comes from — the component's path (from the README's folder) and the
 * snippet — so a re-run rewrites those sections and nothing else:
 *
 *     <!-- sweater-vest:begin src/Counter.svelte > binds -->
 *     …generated…
 *     <!-- sweater-vest:end src/Counter.svelte > binds -->
 *
 * The path and the name are the identity. When either changes, `rename`
 * rewrites the fences (and only the fences) so the next run carries on.
 */

export type Id = { file: string; snippet: string };

export type Block = Id & {
  /** offsets of the whole block, fences included */
  start: number;
  end: number;
  /** offsets of what sits between the fences */
  bodyStart: number;
  bodyEnd: number;
};

const MARK = "sweater-vest:";

export const idText = ({ file, snippet }: Id) => `${file} > ${snippet}`;

export const begin = (id: Id) => `<!-- ${MARK}begin ${idText(id)} -->`;
export const endOf = (id: Id) => `<!-- ${MARK}end ${idText(id)} -->`;

const FENCE = new RegExp(
  `^<!-- ${MARK}(begin|end) (.+) > ([^\\s>]+) -->[ \\t]*$`,
  "gm",
);

/** The generated blocks of a README, in order. A begin without its matching end is an error: nothing may be guessed about what to overwrite. */
export function blocks(text: string): Block[] {
  const found: Block[] = [];
  let open: (Id & { start: number; bodyStart: number }) | null = null;
  for (const m of text.matchAll(FENCE)) {
    const [line = "", kind, file = "", snippet = ""] = m;
    const at = m.index!;
    if (kind === "begin") {
      if (open)
        throw new Error(
          `${idText(open)} is begun but never ended before ${idText({ file, snippet })} begins`,
        );
      open = {
        file,
        snippet,
        start: at,
        bodyStart: at + line.length + 1,
      };
    } else {
      if (!open || open.file !== file || open.snippet !== snippet)
        throw new Error(
          `${idText({ file, snippet })} is ended without being begun`,
        );
      found.push({
        ...open,
        end: at + line.length,
        bodyEnd: at,
      });
      open = null;
    }
  }
  if (open) throw new Error(`${idText(open)} is begun but never ended`);
  return found;
}

const section = (id: Id, markdown: string) =>
  `${begin(id)}\n${markdown.replace(/\s+$/, "")}\n${endOf(id)}`;

export type Entry = Id & { markdown: string };

export type Populated = {
  text: string;
  added: string[];
  updated: string[];
  unchanged: string[];
  /** blocks whose snippet is gone, left in place unless pruned */
  stale: string[];
  pruned: string[];
};

/**
 * Writes `entries` into `text`: a block already there is rewritten in place,
 * a new one goes after the last block of its component (else at the end).
 * `exists` says whether a block's snippet is still in the code; one that is
 * not is stale, and removed only when `prune`.
 */
export function populate(
  text: string,
  entries: Entry[],
  exists: (id: Id) => boolean,
  prune = false,
): Populated {
  const result: Populated = {
    text,
    added: [],
    updated: [],
    unchanged: [],
    stale: [],
    pruned: [],
  };
  const wanted = new Map(entries.map((e) => [idText(e), e]));
  const seen = new Set<string>();
  // edit from the end so earlier offsets stay true
  for (const b of [...blocks(text)].reverse()) {
    const key = idText(b);
    const entry = wanted.get(key);
    if (entry && !seen.has(key)) {
      seen.add(key);
      const next = section(b, entry.markdown);
      if (result.text.slice(b.start, b.end) === next)
        result.unchanged.push(key);
      else {
        result.text =
          result.text.slice(0, b.start) + next + result.text.slice(b.end);
        result.updated.push(key);
      }
    } else if (!entry && !exists(b)) {
      result.stale.push(key);
      if (prune) {
        // take the blank line that separated it, too
        const before = result.text.slice(0, b.start).replace(/\n*$/, "\n");
        const after = result.text.slice(b.end).replace(/^\n+/, "");
        result.text = after ? `${before}\n${after}` : before;
        result.pruned.push(key);
      }
    }
  }
  result.stale.reverse();
  result.updated.reverse();
  result.unchanged.reverse();
  result.pruned.reverse();
  if (prune)
    result.stale = result.stale.filter((k) => !result.pruned.includes(k));

  for (const entry of entries) {
    const key = idText(entry);
    if (seen.has(key)) continue;
    const next = section(entry, entry.markdown);
    const same = blocks(result.text).filter((b) => b.file === entry.file);
    const last = same[same.length - 1];
    if (last)
      result.text =
        result.text.slice(0, last.end) +
        `\n\n${next}` +
        result.text.slice(last.end);
    else
      result.text = `${result.text.replace(/\s*$/, "")}${result.text.trim() ? "\n\n" : ""}${next}\n`;
    result.added.push(key);
  }
  return result;
}

/** `file` or `file > snippet`: what a rename names. */
export const parseTarget = (
  target: string,
): { file: string; snippet?: string } => {
  const at = target.lastIndexOf(" > ");
  return at < 0
    ? { file: target.trim() }
    : {
        file: target.slice(0, at).trim(),
        snippet: target.slice(at + 3).trim(),
      };
};

/**
 * Renames what generated blocks come from, touching only their fences.
 * `from` and `to` are each a component path (every block of it) or
 * `path > snippet` (that one block). Returns the ids it moved.
 */
export function rename(text: string, from: string, to: string) {
  const a = parseTarget(from);
  const b = parseTarget(to);
  if (!!a.snippet !== !!b.snippet)
    throw new Error(
      `rename ${from} to ${to}: give the snippet on both sides, or neither`,
    );
  const moved: string[] = [];
  const taken = new Set(blocks(text).map(idText));
  let out = text;
  for (const blk of [...blocks(text)].reverse()) {
    if (blk.file !== a.file || (a.snippet && blk.snippet !== a.snippet))
      continue;
    const next: Id = {
      file: b.file,
      snippet: a.snippet ? (b.snippet ?? blk.snippet) : blk.snippet,
    };
    if (idText(next) === idText(blk)) continue;
    if (taken.has(idText(next)))
      throw new Error(`${idText(next)} already has a block`);
    const body = out.slice(blk.bodyStart, blk.bodyEnd);
    out =
      out.slice(0, blk.start) +
      `${begin(next)}\n${body}${endOf(next)}` +
      out.slice(blk.end);
    moved.push(`${idText(blk)} -> ${idText(next)}`);
  }
  if (!moved.length) throw new Error(`no generated block comes from ${from}`);
  return { text: out, moved: moved.reverse() };
}

/** For a stale block, where its snippet might have gone: same name elsewhere, or a snippet of its file with no block yet. */
export function suggest(
  stale: Id,
  all: Id[],
  hasBlock: (id: Id) => boolean,
): Id[] {
  const sameName = all.filter(
    (c) => c.snippet === stale.snippet && c.file !== stale.file,
  );
  const sameFile = all.filter((c) => c.file === stale.file && !hasBlock(c));
  return [...sameName, ...sameFile].filter((c) => idText(c) !== idText(stale));
}

import { FormEvent, useEffect, useState } from 'react';
import { charactersApi } from '../api/characters';
import { storiesApi, chaptersApi } from '../api/stories';
import { useSeriesStore } from '../stores/seriesStore';

// ── Types matching what the backend actually returns ─────────────────────────

interface CharacterEntry {
  id: string;
  name: string;
  series_id?: string | null;
  appearance?: string;
  personality?: string;
  backstory?: string;
  motivations?: string;
  flaws?: string;
}

interface StoryEntry {
  id: string;
  title: string;
  series_id?: string | null;
  book?: { title: string } | null;
}

interface ChapterEntry {
  id: string;
  title: string;
  chapter_number: number;
  content: string;
}

interface Candidate {
  name: string;
  count: number;
}

type CharacterForm = Omit<CharacterEntry, 'id'>;

const emptyForm = (): CharacterForm => ({
  name: '',
  series_id: '',
  appearance: '',
  personality: '',
  backstory: '',
  motivations: '',
  flaws: '',
});

// ── Name extraction heuristic ─────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'The','A','An','In','On','At','By','For','Of','To','And','But','Or','So','Yet',
  'It','He','She','They','His','Her','Their','Our','Your','My','Its','We','You','I',
  'That','This','These','Those','Which','Who','What','When','Where','Why','How',
  'Not','No','Yes','If','As','Be','Was','Were','Had','Has','Have','Is','Are',
  'Do','Did','Will','Would','Could','Should','May','Might','Must','Can','Shall',
  'Then','Than','With','From','Into','Out','Up','Down','Over','After','Before',
  'Chapter','Part','Scene','Elder','Lord','Lady','Sir','Master','Mistress',
  'North','South','East','West','Old','New','First','Last','One','Two','Three',
]);

function extractCandidates(chapters: ChapterEntry[]): Candidate[] {
  const counts = new Map<string, number>();

  for (const chapter of chapters) {
    // Tokenise by whitespace; track position after sentence-ending punctuation
    const tokens = chapter.content.split(/\s+/);
    let afterSentenceEnd = true;

    for (let i = 0; i < tokens.length; i++) {
      const raw = tokens[i];
      const word = raw.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '');

      // Mark next token as sentence-start if this one ends with . ! ?
      const isSentenceEnd = /[.!?]$/.test(raw);

      if (!afterSentenceEnd && word.length >= 2 && /^[A-Z][a-z]/.test(word)) {
        // Try to build a multi-word name (up to 3 tokens)
        let name = word;
        let j = i + 1;
        while (j < tokens.length && j <= i + 2) {
          const next = tokens[j].replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '');
          if (next.length >= 2 && /^[A-Z][a-z]/.test(next) && !STOP_WORDS.has(next)) {
            name += ' ' + next;
            j++;
          } else {
            break;
          }
        }

        // Only record the longest match starting at position i
        if (!STOP_WORDS.has(word)) {
          counts.set(name, (counts.get(name) ?? 0) + 1);
        }
      }

      afterSentenceEnd = isSentenceEnd;
    }
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= 2)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 60);
}

// ── Component ─────────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500';

export default function CharactersView() {
  const { series, fetchSeries } = useSeriesStore();

  const [characters, setCharacters] = useState<CharacterEntry[]>([]);
  const [stories, setStories] = useState<StoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [filterSeriesId, setFilterSeriesId] = useState('');

  // Add/Edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CharacterForm>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Scan panel
  const [showScan, setShowScan] = useState(false);
  const [scanStoryId, setScanStoryId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isAddingFromScan, setIsAddingFromScan] = useState(false);
  const [scanDone, setScanDone] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (series.length === 0) fetchSeries().catch(() => undefined);
  }, [series.length, fetchSeries]);

  useEffect(() => {
    Promise.all([
      charactersApi.getAll(),
      storiesApi.getAll(),
    ]).then(([charRes, storyRes]) => {
      if (charRes.success && Array.isArray(charRes.data)) {
        setCharacters(charRes.data as unknown as CharacterEntry[]);
      }
      if (storyRes.success && Array.isArray(storyRes.data)) {
        setStories(storyRes.data as unknown as StoryEntry[]);
      }
    }).catch(() => {
      setLoadError('Could not reach the backend.');
    }).finally(() => setIsLoading(false));
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = filterSeriesId
    ? characters.filter((c) => c.series_id === filterSeriesId)
    : characters;

  const storiesForScan = filterSeriesId
    ? stories.filter((s) => s.series_id === filterSeriesId)
    : stories;

  const getSeriesName = (id?: string | null) =>
    series.find((s) => s.id === id)?.name ?? null;

  // ── Scan ───────────────────────────────────────────────────────────────────

  const runScan = async () => {
    if (!scanStoryId) return;
    setIsScanning(true);
    setScanDone(false);
    setCandidates([]);
    setSelected(new Set());
    try {
      const res = await chaptersApi.getByStoryId(scanStoryId);
      if (res.success && Array.isArray(res.data)) {
        const chapters = res.data as unknown as ChapterEntry[];
        const found = extractCandidates(chapters);
        setCandidates(found);
        setScanDone(true);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const toggleCandidate = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () =>
    setSelected(new Set(candidates.map((c) => c.name)));
  const selectNone = () => setSelected(new Set());

  // Filter out candidates that are already characters in this context
  const existingNames = new Set(
    filtered.map((c) => c.name.toLowerCase())
  );
  const newCandidates = candidates.filter(
    (c) => !existingNames.has(c.name.toLowerCase())
  );

  // Determine series_id for newly added characters
  const scanSeries = stories.find((s) => s.id === scanStoryId)?.series_id ?? filterSeriesId ?? null;

  const addFromScan = async () => {
    if (selected.size === 0) return;
    setIsAddingFromScan(true);
    const created: CharacterEntry[] = [];
    for (const name of Array.from(selected)) {
      try {
        const res = await charactersApi.create({
          name,
          series_id: scanSeries,
        } as never);
        if (res.success && res.data) {
          created.push(res.data as unknown as CharacterEntry);
        }
      } catch {
        // skip failures
      }
    }
    setCharacters((prev) => [...prev, ...created]);
    setSelected(new Set());
    setCandidates((prev) => prev.filter((c) => !Array.from(selected).includes(c.name)));
    setIsAddingFromScan(false);
  };

  // ── Form handlers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), series_id: filterSeriesId || '' });
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (char: CharacterEntry) => {
    setEditingId(char.id);
    setForm({
      name: char.name,
      series_id: char.series_id ?? '',
      appearance: char.appearance ?? '',
      personality: char.personality ?? '',
      backstory: char.backstory ?? '',
      motivations: char.motivations ?? '',
      flaws: char.flaws ?? '',
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    setIsSaving(true);
    setFormError(null);
    try {
      const payload = { ...form, series_id: form.series_id || null };
      if (editingId) {
        const res = await charactersApi.update(editingId, payload as never);
        if (res.success && res.data) {
          setCharacters((prev) =>
            prev.map((c) => (c.id === editingId ? (res.data as unknown as CharacterEntry) : c))
          );
        }
      } else {
        const res = await charactersApi.create(payload as never);
        if (res.success && res.data) {
          setCharacters((prev) => [...prev, res.data as unknown as CharacterEntry]);
        }
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this character?')) return;
    try {
      await charactersApi.delete(id);
      setCharacters((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ }
  };

  const field = (key: keyof CharacterForm) => ({
    value: form[key] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Characters</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Track the people in your story — appearances, traits, and motivations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {series.length > 0 && (
              <select
                value={filterSeriesId}
                onChange={(e) => { setFilterSeriesId(e.target.value); setScanDone(false); setCandidates([]); }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="">All Series</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowScan((v) => !v)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                showScan
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              🔍 Scan Draft for Names
            </button>
            <button
              onClick={openCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              + Add Character
            </button>
          </div>
        </div>

        {/* ── Scan Panel ── */}
        {showScan && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-900/10 p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Scan Draft for Character Names</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Picks up capitalised names that appear multiple times in the selected draft. Review and add the ones that are real characters.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Story / Draft</label>
                <select
                  value={scanStoryId}
                  onChange={(e) => { setScanStoryId(e.target.value); setScanDone(false); setCandidates([]); }}
                  className={inputCls}
                >
                  <option value="">— choose a story —</option>
                  {storiesForScan.map((s) => {
                    const sName = getSeriesName(s.series_id);
                    const label = sName ? `${sName} › ${s.title}` : s.title;
                    return <option key={s.id} value={s.id}>{label}</option>;
                  })}
                </select>
              </div>
              <button
                onClick={runScan}
                disabled={!scanStoryId || isScanning}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isScanning && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isScanning ? 'Scanning…' : 'Scan Chapters'}
              </button>
            </div>

            {scanDone && newCandidates.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No new names found (or all are already added).</p>
            )}

            {newCandidates.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {newCandidates.length} candidate names found — check the ones that are characters:
                  </p>
                  <div className="flex gap-3 text-xs text-blue-600 dark:text-blue-400">
                    <button onClick={selectAll} className="hover:underline">Select all</button>
                    <button onClick={selectNone} className="hover:underline">Clear</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {newCandidates.map(({ name, count }) => (
                    <label
                      key={name}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 cursor-pointer text-sm transition-colors ${
                        selected.has(name)
                          ? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600"
                        checked={selected.has(name)}
                        onChange={() => toggleCandidate(name)}
                      />
                      <span className="flex-1 truncate font-medium">{name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">×{count}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={addFromScan}
                    disabled={selected.size === 0 || isAddingFromScan}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingFromScan
                      ? 'Adding…'
                      : `Add ${selected.size > 0 ? selected.size : ''} Character${selected.size !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Loading / Error ── */}
        {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}
        {loadError && !isLoading && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {loadError}
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && !loadError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-14 text-center px-6">
            <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {filterSeriesId ? 'No characters in this series yet' : 'No characters yet'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 max-w-sm">
              Use <strong>Scan Draft for Names</strong> to extract candidates from your imported chapters, or add characters manually.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowScan(true)} className="rounded-lg border border-blue-300 dark:border-blue-700 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                Scan Draft for Names
              </button>
              <button onClick={openCreate} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Add Manually
              </button>
            </div>
          </div>
        )}

        {/* ── Character Grid ── */}
        {filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((char) => {
              const sName = getSeriesName(char.series_id);
              return (
                <div key={char.id} className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{char.name}</p>
                      {sName && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sName}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(char)} className="rounded px-2 py-1 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700">Edit</button>
                      <button onClick={() => handleDelete(char.id)} className="rounded px-2 py-1 text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">Delete</button>
                    </div>
                  </div>
                  {char.appearance && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{char.appearance}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {char.personality && (
                      <span className="rounded-full bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 text-xs text-purple-700 dark:text-purple-300">
                        {char.personality.slice(0, 40)}{char.personality.length > 40 ? '…' : ''}
                      </span>
                    )}
                    {char.motivations && (
                      <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-300">
                        ↗ {char.motivations.slice(0, 35)}{char.motivations.length > 35 ? '…' : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Edit Character' : 'Add Character'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Name <span className="text-red-500">*</span>
                <input type="text" className={`mt-1 ${inputCls}`} placeholder="e.g. Elara" {...field('name')} autoFocus />
              </label>
              {series.length > 0 && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Series
                  <select className={`mt-1 ${inputCls}`} {...field('series_id')}>
                    <option value="">— not linked —</option>
                    {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
              )}
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Appearance
                <textarea rows={2} className={`mt-1 ${inputCls}`} placeholder="What they look like" {...field('appearance')} />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Personality
                <textarea rows={2} className={`mt-1 ${inputCls}`} placeholder="How they act, speak, present themselves" {...field('personality')} />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Backstory
                <textarea rows={3} className={`mt-1 ${inputCls}`} placeholder="History and context relevant to the story" {...field('backstory')} />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Motivations
                <textarea rows={2} className={`mt-1 ${inputCls}`} placeholder="What they want and why" {...field('motivations')} />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Flaws / Fears
                <textarea rows={2} className={`mt-1 ${inputCls}`} placeholder="Weaknesses, blind spots, fears" {...field('flaws')} />
              </label>
              {formError && <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={isSaving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                  {isSaving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Character'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


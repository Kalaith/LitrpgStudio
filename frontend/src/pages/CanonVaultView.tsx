import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  canonVaultApi,
  type CanonCustomType,
  type CanonEntry,
  type CanonEntryType,
} from '../api/canonVault';
import { useSeriesStore } from '../stores/seriesStore';
import { navigateToView } from '../utils/appNavigation';

interface EntryCustomFieldForm {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select';
  value: string;
  options: string;
}

interface EntryRelationshipForm {
  id: string;
  target_entry_id: string;
  type: string;
  notes: string;
}

const entryTypeOptions: Array<{ value: CanonEntryType; label: string }> = [
  { value: 'character', label: 'Character' },
  { value: 'location', label: 'Location' },
  { value: 'faction', label: 'Faction' },
  { value: 'item', label: 'Item' },
  { value: 'rule', label: 'Rule' },
  { value: 'system', label: 'System' },
  { value: 'custom', label: 'Custom' },
];

const createFieldForm = (): EntryCustomFieldForm => ({
  id: crypto.randomUUID(),
  name: '',
  type: 'text',
  value: '',
  options: '',
});

const createRelationshipForm = (): EntryRelationshipForm => ({
  id: crypto.randomUUID(),
  target_entry_id: '',
  type: 'related_to',
  notes: '',
});

const parseCsv = (value: string): string[] =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');

export default function CanonVaultView() {
  const { series, currentSeries, fetchSeries } = useSeriesStore();
  const [selectedSeriesId, setSelectedSeriesId] = useState(currentSeries?.id ?? '');
  const [entries, setEntries] = useState<CanonEntry[]>([]);
  const [customTypes, setCustomTypes] = useState<CanonCustomType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<CanonEntryType | ''>('');
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customTypeName, setCustomTypeName] = useState('');
  const [customTypeDescription, setCustomTypeDescription] = useState('');

  const [name, setName] = useState('');
  const [entryType, setEntryType] = useState<CanonEntryType>('character');
  const [entrySummary, setEntrySummary] = useState('');
  const [entryTags, setEntryTags] = useState('');
  const [entryAliases, setEntryAliases] = useState('');
  const [entryCustomTypeName, setEntryCustomTypeName] = useState('');
  const [customFields, setCustomFields] = useState<EntryCustomFieldForm[]>([]);
  const [relationships, setRelationships] = useState<EntryRelationshipForm[]>([]);

  useEffect(() => {
    if (series.length === 0) {
      fetchSeries().catch(() => undefined);
    }
  }, [series.length, fetchSeries]);

  useEffect(() => {
    if (!selectedSeriesId && currentSeries?.id) {
      setSelectedSeriesId(currentSeries.id);
    }
  }, [selectedSeriesId, currentSeries?.id]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) ?? null,
    [entries, selectedEntryId]
  );

  const loadEntries = async (seriesId: string, query: string, type: CanonEntryType | '') => {
    if (!seriesId) {
      setEntries([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [entriesResponse, customTypesResponse] = await Promise.all([
        canonVaultApi.getEntries(seriesId, {
          q: query || undefined,
          type,
          includeBacklinks: true,
        }),
        canonVaultApi.getCustomTypes(seriesId),
      ]);

      if (!entriesResponse.success || !entriesResponse.data) {
        throw new Error(entriesResponse.error || 'Failed to load canon entries.');
      }

      setEntries(entriesResponse.data.entries);
      setCustomTypes(customTypesResponse.success && customTypesResponse.data ? customTypesResponse.data : []);
      if (entriesResponse.data.entries.length > 0 && !entriesResponse.data.entries.some((entry) => entry.id === selectedEntryId)) {
        setSelectedEntryId(entriesResponse.data.entries[0].id);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load canon entries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntries(selectedSeriesId, searchQuery, filterType).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeriesId, searchQuery, filterType]);

  const resetForm = () => {
    setName('');
    setEntryType('character');
    setEntrySummary('');
    setEntryTags('');
    setEntryAliases('');
    setEntryCustomTypeName('');
    setCustomFields([]);
    setRelationships([]);
  };

  const handleCreateEntry = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSeriesId) {
      setErrorMessage('Select a series before creating canon entries.');
      return;
    }

    if (name.trim() === '') {
      setErrorMessage('Entry name is required.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const response = await canonVaultApi.createEntry(selectedSeriesId, {
        name: name.trim(),
        type: entryType,
        custom_type_name: entryType === 'custom' ? entryCustomTypeName.trim() : '',
        summary: entrySummary.trim(),
        tags: parseCsv(entryTags),
        aliases: parseCsv(entryAliases),
        custom_fields: customFields
          .filter((field) => field.name.trim() !== '')
          .map((field) => ({
            name: field.name.trim(),
            type: field.type,
            value: field.type === 'number' ? Number(field.value || 0) : field.value,
            options: field.type === 'select' ? parseCsv(field.options) : [],
          })),
        relationships: relationships
          .filter((relationship) => relationship.target_entry_id.trim() !== '')
          .map((relationship) => ({
            target_entry_id: relationship.target_entry_id,
            type: relationship.type.trim() || 'related_to',
            notes: relationship.notes.trim(),
          })),
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create entry.');
      }

      resetForm();
      await loadEntries(selectedSeriesId, searchQuery, filterType);
      setSelectedEntryId(response.data.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!selectedSeriesId || !selectedEntry) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const response = await canonVaultApi.deleteEntry(selectedSeriesId, selectedEntry.id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete entry.');
      }

      setSelectedEntryId('');
      await loadEntries(selectedSeriesId, searchQuery, filterType);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCustomType = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSeriesId || customTypeName.trim() === '') {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const response = await canonVaultApi.createCustomType(selectedSeriesId, {
        name: customTypeName.trim(),
        description: customTypeDescription.trim(),
        field_definitions: [],
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create custom type.');
      }

      setCustomTypeName('');
      setCustomTypeDescription('');
      await loadEntries(selectedSeriesId, searchQuery, filterType);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create custom type.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenBacklink = (storyId: string, chapterId: string) => {
    navigateToView('editor', {
      storyId,
      chapterId,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Canon Vault</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Store canon facts, define custom entry types, connect relationships, and jump to where facts are mentioned.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Series
                <select
                  value={selectedSeriesId}
                  onChange={(event) => setSelectedSeriesId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a series</option>
                  {series.map((seriesItem) => (
                    <option key={seriesItem.id} value={seriesItem.id}>
                      {seriesItem.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Search
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Find a canon fact..."
                />
              </label>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Type
                <select
                  value={filterType}
                  onChange={(event) => setFilterType(event.target.value as CanonEntryType | '')}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All types</option>
                  {entryTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
              {isLoading && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading entries...</p>
              )}
              {!isLoading && entries.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No entries found.</p>
              )}
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntryId(entry.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    selectedEntryId === entry.id
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/40'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.name}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {entry.type}
                    {entry.custom_type_name ? ` - ${entry.custom_type_name}` : ''}
                    {typeof entry.mention_count === 'number' ? ` - mentions: ${entry.mention_count}` : ''}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Entry</h3>
            <form className="mt-4 space-y-3" onSubmit={handleCreateEntry}>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Entry name"
              />

              <select
                value={entryType}
                onChange={(event) => setEntryType(event.target.value as CanonEntryType)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {entryTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {entryType === 'custom' && (
                <input
                  type="text"
                  value={entryCustomTypeName}
                  onChange={(event) => setEntryCustomTypeName(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Custom type name (e.g. Resource)"
                />
              )}

              <textarea
                value={entrySummary}
                onChange={(event) => setEntrySummary(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Summary"
              />

              <input
                type="text"
                value={entryTags}
                onChange={(event) => setEntryTags(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Tags (comma separated)"
              />

              <input
                type="text"
                value={entryAliases}
                onChange={(event) => setEntryAliases(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Aliases (comma separated)"
              />

              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Custom Fields</p>
                  <button
                    type="button"
                    onClick={() => setCustomFields((previous) => [...previous, createFieldForm()])}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    + Field
                  </button>
                </div>
                <div className="space-y-2">
                  {customFields.map((field) => (
                    <div key={field.id} className="grid gap-2">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(event) =>
                          setCustomFields((previous) =>
                            previous.map((item) =>
                              item.id === field.id ? { ...item, name: event.target.value } : item
                            )
                          )
                        }
                        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Field name"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={field.type}
                          onChange={(event) =>
                            setCustomFields((previous) =>
                              previous.map((item) =>
                                item.id === field.id
                                  ? { ...item, type: event.target.value as EntryCustomFieldForm['type'] }
                                  : item
                              )
                            )
                          }
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="select">Select</option>
                        </select>
                        <input
                          type="text"
                          value={field.value}
                          onChange={(event) =>
                            setCustomFields((previous) =>
                              previous.map((item) =>
                                item.id === field.id ? { ...item, value: event.target.value } : item
                              )
                            )
                          }
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="Value"
                        />
                      </div>
                      {field.type === 'select' && (
                        <input
                          type="text"
                          value={field.options}
                          onChange={(event) =>
                            setCustomFields((previous) =>
                              previous.map((item) =>
                                item.id === field.id ? { ...item, options: event.target.value } : item
                              )
                            )
                          }
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="Options (comma separated)"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Relationships</p>
                  <button
                    type="button"
                    onClick={() => setRelationships((previous) => [...previous, createRelationshipForm()])}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    + Relationship
                  </button>
                </div>
                <div className="space-y-2">
                  {relationships.map((relationship) => (
                    <div key={relationship.id} className="grid gap-2">
                      <select
                        value={relationship.target_entry_id}
                        onChange={(event) =>
                          setRelationships((previous) =>
                            previous.map((item) =>
                              item.id === relationship.id
                                ? { ...item, target_entry_id: event.target.value }
                                : item
                            )
                          )
                        }
                        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Target entry</option>
                        {entries.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={relationship.type}
                        onChange={(event) =>
                          setRelationships((previous) =>
                            previous.map((item) =>
                              item.id === relationship.id ? { ...item, type: event.target.value } : item
                            )
                          )
                        }
                        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Relationship type (e.g. owns)"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSaving ? 'Saving...' : 'Create Entry'}
              </button>
            </form>

            <div className="mt-6 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Custom Entry Types</h4>
              <form className="mt-2 space-y-2" onSubmit={handleCreateCustomType}>
                <input
                  value={customTypeName}
                  onChange={(event) => setCustomTypeName(event.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Type name"
                />
                <input
                  value={customTypeDescription}
                  onChange={(event) => setCustomTypeDescription(event.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Description (optional)"
                />
                <button
                  type="submit"
                  disabled={isSaving || customTypeName.trim() === ''}
                  className="w-full rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-500"
                >
                  Add Type
                </button>
              </form>

              <ul className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                {customTypes.map((customType) => (
                  <li key={customType.id}>
                    {customType.name}
                    {customType.description ? ` - ${customType.description}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Entry Details</h3>
              {selectedEntry && (
                <button
                  type="button"
                  onClick={handleDeleteEntry}
                  disabled={isSaving}
                  className="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
                >
                  Delete
                </button>
              )}
            </div>

            {!selectedEntry && (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Select a canon entry to view its details and backlinks.
              </p>
            )}

            {selectedEntry && (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedEntry.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedEntry.type}
                    {selectedEntry.custom_type_name ? ` - ${selectedEntry.custom_type_name}` : ''}
                  </p>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedEntry.summary || 'No summary.'}</p>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Tags</p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {selectedEntry.tags.length > 0 ? selectedEntry.tags.join(', ') : 'No tags'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Relationships</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {selectedEntry.relationships.length === 0 && <li>No relationships</li>}
                    {selectedEntry.relationships.map((relationship) => {
                      const target = entries.find((entry) => entry.id === relationship.target_entry_id);
                      return (
                        <li key={relationship.id || `${relationship.target_entry_id}-${relationship.type}`}>
                          {relationship.type} - {target?.name || relationship.target_entry_id}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Where Mentioned ({selectedEntry.mention_count || 0})
                  </p>
                  <div className="mt-2 max-h-60 space-y-2 overflow-y-auto">
                    {(!selectedEntry.backlinks || selectedEntry.backlinks.length === 0) && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No mentions found in chapters yet.</p>
                    )}
                    {selectedEntry.backlinks?.map((backlink) => (
                      <article
                        key={`${backlink.chapter_id}-${backlink.story_id}`}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900/40"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">
                          {backlink.story_title} - Chapter {backlink.chapter_number}: {backlink.chapter_title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Matches: {backlink.matches}
                        </p>
                        <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">{backlink.snippet}</p>
                        <button
                          type="button"
                          onClick={() => handleOpenBacklink(backlink.story_id, backlink.chapter_id)}
                          className="mt-2 rounded border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                        >
                          Open In Editor
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}

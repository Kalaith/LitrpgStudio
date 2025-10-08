import React from 'react';
import type { Series } from '../../types/series';

interface CharactersTabProps {
  series: Series;
}

export const CharactersTab: React.FC<CharactersTabProps> = ({ series }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Series Characters</h3>

    <div className="grid gap-4">
      {series.sharedElements.characters.map((sharedChar) => (
        <div key={sharedChar.characterId} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {sharedChar.character.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Appears in {sharedChar.appearances.length} book(s)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {sharedChar.appearances.map((appearance, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  Book {appearance.bookNumber}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  appearance.role === 'main' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  appearance.role === 'supporting' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {appearance.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {series.sharedElements.characters.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No characters added to this series yet.
        </div>
      )}
    </div>
  </div>
);

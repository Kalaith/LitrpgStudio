import React from 'react';
import type { Series } from '../../types/series';

interface WorldBuildingTabProps {
  series: Series;
}

export const WorldBuildingTab: React.FC<WorldBuildingTabProps> = ({ series }) => (
  <div className="space-y-6">
    {/* Magic Systems */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Magic Systems</h3>
      <div className="grid gap-4">
        {series.sharedElements.magicSystems.map((system) => (
          <div key={system.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{system.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{system.description}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                {system.type}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {system.rules.length} rules
              </span>
            </div>
          </div>
        ))}

        {series.sharedElements.magicSystems.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No magic systems defined yet.
          </div>
        )}
      </div>
    </div>

    {/* Locations */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Locations</h3>
      <div className="grid gap-4">
        {series.sharedElements.locations.map((location) => (
          <div key={location.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{location.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{location.description}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                {location.type}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                Appears in {location.appearances.length} book(s)
              </span>
            </div>
          </div>
        ))}

        {series.sharedElements.locations.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No locations defined yet.
          </div>
        )}
      </div>
    </div>

    {/* World Rules */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">World Rules</h3>
      <div className="space-y-3">
        {series.sharedElements.worldBuilding.worldRules.map((rule) => (
          <div key={rule.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{rule.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rule.description}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                {rule.category}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                Established in book {rule.establishedInBook}
              </span>
            </div>
          </div>
        ))}

        {series.sharedElements.worldBuilding.worldRules.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No world rules defined yet.
          </div>
        )}
      </div>
    </div>
  </div>
);

import React from 'react';
import type { ConsistencyIssue } from '../../api/analytics';

interface ConsistencyTabProps {
  issues: ConsistencyIssue[];
}

export const ConsistencyTab: React.FC<ConsistencyTabProps> = ({ issues }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Consistency Issues</h3>

    {issues.length === 0 ? (
      <div className="text-center py-8 text-green-600 dark:text-green-400">
        ✓ No consistency issues detected across the series
      </div>
    ) : (
      <div className="space-y-3">
        {issues.map((issue) => (
          <div key={issue.id} className={`p-4 rounded-lg border-l-4 ${
            issue.severity >= 80 ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
            issue.severity >= 60 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500' :
            issue.severity >= 40 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
            'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">{issue.type}</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                issue.severity >= 80 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                issue.severity >= 60 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                issue.severity >= 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {issue.type}
              </span>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{issue.message}</p>

            {issue.location && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Location:</span>
                <span className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                  {issue.location}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

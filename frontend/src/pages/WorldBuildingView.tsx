import { useState } from 'react';
import { useStoryStore } from '../stores/storyStore';
import WorldBuildingTools from '../components/WorldBuildingTools';
import { motion } from 'framer-motion';

export default function WorldBuildingView() {
  const { currentStory, updateStory } = useStoryStore();
  const [consistencyReport, setConsistencyReport] = useState<any>(null);

  const handleWorldUpdate = (updates: any) => {
    if (!currentStory) return;

    const updatedWorldBuilding = {
      ...currentStory.worldBuilding,
      ...updates,
    };

    updateStory(currentStory.id, {
      worldBuilding: updatedWorldBuilding,
    });
  };

  const runConsistencyCheck = () => {
    if (!currentStory) return;

    // This would be a real consistency checking algorithm
    const issues = [];
    const world = currentStory.worldBuilding;

    // Check for missing information
    if (!world.name) issues.push({ type: 'warning', message: 'World name is not defined' });
    if (!world.description) issues.push({ type: 'warning', message: 'World description is missing' });
    if (!world.magicSystem) issues.push({ type: 'info', message: 'Magic system not documented' });

    // Check character consistency
    const allCharacters = [currentStory.mainCharacter, ...currentStory.supportingCharacters];
    allCharacters.forEach(character => {
      if (character && character.backstory.includes('unknown land')) {
        issues.push({
          type: 'error',
          message: `Character "${character.name}" references "unknown land" - location may need to be defined`,
          character: character.name
        });
      }
    });

    // Check timeline consistency
    if (currentStory.timeline.length > 1) {
      const timelineEvents = [...currentStory.timeline].sort((a, b) => a.date.localeCompare(b.date));
      for (let i = 1; i < timelineEvents.length; i++) {
        const prev = timelineEvents[i - 1];
        const curr = timelineEvents[i];

        if (prev.charactersInvolved.some(char => curr.charactersInvolved.includes(char))) {
          // Check for character conflicts in timeline
          const conflictChars = prev.charactersInvolved.filter(char =>
            curr.charactersInvolved.includes(char)
          );

          issues.push({
            type: 'warning',
            message: `Timeline events "${prev.title}" and "${curr.title}" both involve: ${conflictChars.join(', ')}`,
            events: [prev.title, curr.title]
          });
        }
      }
    }

    setConsistencyReport({
      timestamp: new Date().toISOString(),
      issuesCount: issues.length,
      issues,
      suggestions: [
        'Consider adding more detailed location descriptions',
        'Define relationships between factions',
        'Document the magic system rules',
        'Create a world map to visualize spatial relationships'
      ]
    });
  };

  if (!currentStory) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No story selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please select or create a story to build its world
          </p>
          <button className="btn-primary">
            Create New Story
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">World Building</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage the world of "{currentStory.title}"
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={runConsistencyCheck}
              className="btn-secondary"
            >
              Check Consistency
            </button>
            <button className="btn-primary">
              Export World Bible
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <WorldBuildingTools
          worldDetails={currentStory.worldBuilding}
          onUpdate={handleWorldUpdate}
        />

        {consistencyReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Consistency Report</h3>
              <span className="text-sm text-gray-500">
                {new Date(consistencyReport.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {consistencyReport.issues.filter((i: any) => i.type === 'error').length}
                </div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded">
                <div className="text-2xl font-bold text-yellow-600">
                  {consistencyReport.issues.filter((i: any) => i.type === 'warning').length}
                </div>
                <div className="text-sm text-yellow-600">Warnings</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {consistencyReport.issues.filter((i: any) => i.type === 'info').length}
                </div>
                <div className="text-sm text-blue-600">Info</div>
              </div>
            </div>

            {consistencyReport.issues.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Issues Found</h4>
                <div className="space-y-2">
                  {consistencyReport.issues.map((issue: any, index: number) => (
                    <div
                      key={index}
                      className={`
                        flex items-start space-x-3 p-3 rounded
                        ${issue.type === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                          issue.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                          'bg-blue-50 dark:bg-blue-900/20'}
                      `}
                    >
                      <div className={`
                        flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                        ${issue.type === 'error' ? 'bg-red-500 text-white' :
                          issue.type === 'warning' ? 'bg-yellow-500 text-white' :
                          'bg-blue-500 text-white'}
                      `}>
                        {issue.type === 'error' ? '!' : issue.type === 'warning' ? '⚠' : 'ℹ'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{issue.message}</p>
                        {issue.character && (
                          <p className="text-xs text-gray-500 mt-1">Character: {issue.character}</p>
                        )}
                        {issue.events && (
                          <p className="text-xs text-gray-500 mt-1">Events: {issue.events.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-3">Suggestions</h4>
              <ul className="space-y-1">
                {consistencyReport.suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
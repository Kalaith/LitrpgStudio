import { useEffect, useRef, useState, memo } from 'react';
import Chart from 'chart.js/auto';

interface ProjectStats {
  words: number;
  chapters: number;
  characters: number;
}

interface ActivityItem {
  id: string;
  text: string;
  timestamp: string;
  type: 'edit' | 'create' | 'delete';
}

const DashboardView: React.FC = memo(() => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [stats] = useState<ProjectStats>({
    words: 0,
    chapters: 0,
    characters: 0
  });
  
  const [activities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Destroy existing chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Set fixed dimensions
        chartRef.current.width = 600;
        chartRef.current.height = 200;
        
        Chart.defaults.animation = false; // Disable all animations globally
        
        chartInstanceRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Chapter 1', 'Chapter 2', 'Chapter 3'],
            datasets: [{
              label: 'Character Power Level',
              data: [10, 20, 35],
              borderColor: '#21808d',
              fill: false,
              tension: 0
            }]
          },
          options: {
            responsive: false,
            maintainAspectRatio: false,
            animation: false,
            elements: {
              line: {
                tension: 0
              },
              point: {
                radius: 0 // Hide points for better performance
              }
            },
            plugins: {
              legend: {
                display: false
              }
            }
          }
        });
      }
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-4">
            Characters
          </h3>
          <div className="space-y-4">
            {/* Character cards will be rendered here */}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {activities.map(activity => (
              <div 
                key={activity.id}
                className="text-sm text-gray-600 dark:text-gray-400 p-2 border-l-2 border-primary-600"
              >
                {activity.text}
                <div className="text-xs text-gray-500">{activity.timestamp}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-4">
            Project Stats
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Words', value: stats.words },
              { label: 'Chapters', value: stats.chapters },
              { label: 'Characters', value: stats.characters }
            ].map(stat => (
              <div key={stat.label} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-4">
            Character Progression
          </h3>
          <canvas ref={chartRef} className="w-full h-[200px]"></canvas>
        </div>
      </div>
    </div>
  );
});

export default DashboardView;

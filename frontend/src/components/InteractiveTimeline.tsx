import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import type { StoryEvent } from '../types/story';
import type { Character } from '../types/character';

interface TimelineEvent extends Omit<StoryEvent, 'date'> {
  date: Date;
  position: number;
}

interface InteractiveTimelineProps {
  events: StoryEvent[];
  characters: Character[];
  onEventClick?: (event: StoryEvent) => void;
  onEventUpdate?: (eventId: string, updates: Partial<StoryEvent>) => void;
  onAddEvent?: (event: Omit<StoryEvent, 'id'>) => void;
}

export default function InteractiveTimeline({
  events,
  characters,
  onEventClick,
  onEventUpdate,
  onAddEvent
}: InteractiveTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<StoryEvent | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [filterCharacter, setFilterCharacter] = useState<string>('');
  const [filterImportance, setFilterImportance] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    // Convert and sort events
    const processedEvents: TimelineEvent[] = events
      .map(event => ({
        ...event,
        date: new Date(event.date),
        position: 0
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((event, index) => ({
        ...event,
        position: index
      }));

    setTimelineEvents(processedEvents);
  }, [events]);

  useEffect(() => {
    if (!svgRef.current || timelineEvents.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1000 * zoomLevel;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 60, left: 40 };

    // Filter events
    let filteredEvents = timelineEvents;
    if (filterCharacter) {
      filteredEvents = filteredEvents.filter(event =>
        event.charactersInvolved.includes(filterCharacter)
      );
    }
    if (filterImportance) {
      filteredEvents = filteredEvents.filter(event =>
        event.importance === filterImportance
      );
    }

    if (filteredEvents.length === 0) return;

    // Set up scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(filteredEvents, d => d.date) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleOrdinal()
      .domain(['critical', 'major', 'moderate', 'minor'])
      .range([margin.top + 20, margin.top + 80, margin.top + 140, margin.top + 200]);

    const colorScale = d3.scaleOrdinal<string>()
      .domain(['critical', 'major', 'moderate', 'minor'])
      .range(['#DC2626', '#F59E0B', '#3B82F6', '#6B7280']);

    // Create container
    const container = svg.append("g");

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create timeline line
    container.append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", height / 2)
      .attr("y2", height / 2)
      .attr("stroke", "#E5E7EB")
      .attr("stroke-width", 2);

    // Create events
    const eventGroups = container.selectAll(".timeline-event")
      .data(filteredEvents)
      .enter().append("g")
      .attr("class", "timeline-event")
      .attr("transform", d => `translate(${xScale(d.date)}, ${yScale(d.importance)})`)
      .style("cursor", "pointer");

    // Event circles
    eventGroups.append("circle")
      .attr("r", d => d.importance === 'critical' ? 12 :
                    d.importance === 'major' ? 10 :
                    d.importance === 'moderate' ? 8 : 6)
      .attr("fill", d => colorScale(d.importance))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .on("mouseover", function(event, d) {
        d3.select(this).transition().duration(150).attr("r",
          d.importance === 'critical' ? 15 :
          d.importance === 'major' ? 13 :
          d.importance === 'moderate' ? 11 : 9
        );

        // Show tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "timeline-tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.9)")
          .style("color", "white")
          .style("padding", "8px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .html(`
            <strong>${d.title}</strong><br/>
            ${d.date.toLocaleDateString()}<br/>
            Importance: ${d.importance}<br/>
            Characters: ${d.charactersInvolved.slice(0, 3).join(', ')}${d.charactersInvolved.length > 3 ? '...' : ''}
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");

        setTimeout(() => tooltip.remove(), 3000);
      })
      .on("mouseout", function(_event, d) {
        d3.select(this).transition().duration(150).attr("r",
          d.importance === 'critical' ? 12 :
          d.importance === 'major' ? 10 :
          d.importance === 'moderate' ? 8 : 6
        );
      })
      .on("click", (_event, d) => {
        setSelectedEvent(d as unknown as StoryEvent);
        if (onEventClick) onEventClick(d as unknown as StoryEvent);
      });

    // Event labels
    eventGroups.append("text")
      .text(d => d.title.length > 15 ? d.title.substring(0, 15) + '...' : d.title)
      .attr("x", 0)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "#374151");

    // Date labels
    eventGroups.append("text")
      .text(d => d.date.toLocaleDateString())
      .attr("x", 0)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("fill", "#6B7280");

    // Character connections
    filteredEvents.forEach((event, eventIndex) => {
      event.charactersInvolved.forEach((characterId) => {
        const character = characters.find(c => c.id === characterId);
        if (!character) return;

        // Find other events with this character
        const relatedEvents = filteredEvents.filter((e, i) =>
          i !== eventIndex && e.charactersInvolved.includes(characterId)
        );

        relatedEvents.forEach(relatedEvent => {
          if (relatedEvent.date > event.date) {
            container.append("line")
              .attr("x1", xScale(event.date) as number)
              .attr("y1", yScale(event.importance) as number)
              .attr("x2", xScale(relatedEvent.date) as number)
              .attr("y2", yScale(relatedEvent.importance) as number)
              .attr("stroke", `hsl(${(character.level * 30) % 360}, 50%, 50%)`)
              .attr("stroke-width", 1)
              .attr("stroke-opacity", 0.3)
              .attr("stroke-dasharray", "2,2");
          }
        });
      });
    });

    // Add axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat((d) => d3.timeFormat("%b %Y")(d as Date));

    container.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(xAxis);

  }, [timelineEvents, filterCharacter, filterImportance, zoomLevel, characters, onEventClick]);

  const handleAddEvent = () => {
    if (onAddEvent) {
      onAddEvent({
        title: 'New Event',
        description: 'Event description',
        date: new Date().toISOString(),
        charactersInvolved: [],
        importance: 'moderate'
      });
    }
  };

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium mb-1">Filter by Character</label>
            <select
              value={filterCharacter}
              onChange={(e) => setFilterCharacter(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
            >
              <option value="">All Characters</option>
              {characters.map(char => (
                <option key={char.id} value={char.id}>{char.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Filter by Importance</label>
            <select
              value={filterImportance}
              onChange={(e) => setFilterImportance(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
            >
              <option value="">All Levels</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="moderate">Moderate</option>
              <option value="minor">Minor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Zoom</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>
        </div>

        <button
          onClick={handleAddEvent}
          className="btn-primary text-sm"
        >
          Add Event
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-4 mb-4 text-sm">
        <span className="font-medium">Importance:</span>
        {[
          { level: 'critical', color: '#DC2626', label: 'Critical' },
          { level: 'major', color: '#F59E0B', label: 'Major' },
          { level: 'moderate', color: '#3B82F6', label: 'Moderate' },
          { level: 'minor', color: '#6B7280', label: 'Minor' }
        ].map(({ level, color, label }) => (
          <div key={level} className="flex items-center space-x-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-x-auto">
        <svg
          ref={svgRef}
          width="100%"
          height="400"
          className="bg-white dark:bg-gray-800"
        />
      </div>

      {/* Event Details Panel */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={selectedEvent.title}
                    onChange={(e) => {
                      if (onEventUpdate) {
                        onEventUpdate(selectedEvent.id, { title: e.target.value });
                      }
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedEvent.date}
                    onChange={(e) => {
                      if (onEventUpdate) {
                        onEventUpdate(selectedEvent.id, { date: e.target.value });
                      }
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Importance</label>
                  <select
                    value={selectedEvent.importance}
                    onChange={(e) => {
                      if (onEventUpdate) {
                        onEventUpdate(selectedEvent.id, { importance: e.target.value as StoryEvent['importance'] });
                      }
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                  >
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={selectedEvent.description}
                    onChange={(e) => {
                      if (onEventUpdate) {
                        onEventUpdate(selectedEvent.id, { description: e.target.value });
                      }
                    }}
                    rows={4}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Characters Involved</label>
                  <div className="space-y-2">
                    {characters.map(character => (
                      <label key={character.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedEvent.charactersInvolved.includes(character.id)}
                          onChange={(e) => {
                            if (onEventUpdate) {
                              const updatedCharacters = e.target.checked
                                ? [...selectedEvent.charactersInvolved, character.id]
                                : selectedEvent.charactersInvolved.filter(id => id !== character.id);
                              onEventUpdate(selectedEvent.id, { charactersInvolved: updatedCharacters });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{character.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedEvent(null)}
                className="btn-secondary"
              >
                Close
              </button>
              <button className="btn-primary">
                Save Changes
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline Stats */}
      {timelineEvents.length > 0 && (
        <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Timeline Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold">{timelineEvents.length}</div>
              <div className="text-gray-600">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">
                {timelineEvents.filter(e => e.importance === 'critical' || e.importance === 'major').length}
              </div>
              <div className="text-gray-600">Major Events</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">
                {new Set(timelineEvents.flatMap(e => e.charactersInvolved)).size}
              </div>
              <div className="text-gray-600">Active Characters</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">
                {timelineEvents.length > 0
                  ? Math.round((timelineEvents[timelineEvents.length - 1].date.getTime() - timelineEvents[0].date.getTime()) / (1000 * 60 * 60 * 24))
                  : 0}
              </div>
              <div className="text-gray-600">Days Span</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

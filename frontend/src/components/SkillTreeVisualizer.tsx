import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon?: string;
  tier: number;
  maxLevel: number;
  currentLevel: number;
  prerequisites: string[];
  cost: number;
  unlocked: boolean;
  skillType: 'active' | 'passive' | 'toggle';
  category: string;
  effects: string[];
}

export interface SkillTree {
  id: string;
  name: string;
  description: string;
  nodes: SkillNode[];
  connections: Array<{
    from: string;
    to: string;
    type: 'prerequisite' | 'synergy';
  }>;
}

interface SkillTreeVisualizerProps {
  skillTree: SkillTree;
  availablePoints: number;
  onSkillClick?: (skill: SkillNode) => void;
  onSkillUpgrade?: (skillId: string) => void;
  onSkillReset?: (skillId: string) => void;
  readonly?: boolean;
}

export default function SkillTreeVisualizer({
  skillTree,
  availablePoints,
  onSkillClick,
  onSkillUpgrade,
  onSkillReset,
  readonly = false
}: SkillTreeVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<SkillNode | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Get unique categories
  const categories = useMemo(() =>
    Array.from(new Set(skillTree.nodes.map(n => n.category))),
    [skillTree.nodes]
  );

  // Filter nodes based on category
  const filteredNodes = useMemo(() =>
    filterCategory
      ? skillTree.nodes.filter(n => n.category === filterCategory)
      : skillTree.nodes,
    [skillTree.nodes, filterCategory]
  );

  // Check if skill can be upgraded
  const canUpgradeSkill = (skill: SkillNode): boolean => {
    if (readonly || availablePoints < skill.cost) return false;
    if (skill.currentLevel >= skill.maxLevel) return false;

    // Check prerequisites
    const hasPrerequisites = skill.prerequisites.every(prereqId => {
      const prereq = skillTree.nodes.find(n => n.id === prereqId);
      return prereq?.currentLevel > 0;
    });

    return hasPrerequisites;
  };

  useEffect(() => {
    if (!svgRef.current || filteredNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1000 * zoomLevel;
    const height = 600;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };

    // Create container group
    const container = svg.append("g");

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    if (viewMode === 'tree') {
      // Tree layout
      const treeLayout = d3.tree<SkillNode>()
        .size([width - margin.left - margin.right, height - margin.top - margin.bottom]);

      // Create hierarchy based on prerequisites
      const root = d3.hierarchy<SkillNode>(
        createHierarchy(filteredNodes, skillTree.connections)
      );

      const treeData = treeLayout(root);

      // Create links (connections)
      const linkGenerator = d3.linkVertical<d3.HierarchyPointLink<SkillNode>, d3.HierarchyPointNode<SkillNode>>()
        .x((d) => d.x + margin.left)
        .y((d) => d.y + margin.top);

      container.selectAll(".skill-link")
        .data(treeData.links())
        .enter().append("path")
        .attr("class", "skill-link")
        .attr("d", linkGenerator)
        .attr("fill", "none")
        .attr("stroke", "#E5E7EB")
        .attr("stroke-width", 2);

      // Create skill nodes
      const nodes = container.selectAll(".skill-node")
        .data(treeData.descendants())
        .enter().append("g")
        .attr("class", "skill-node")
        .attr("transform", d => `translate(${d.x + margin.left},${d.y + margin.top})`);

      // Add circles for skills
      nodes.append("circle")
        .attr("r", 25)
        .attr("fill", d => getSkillColor(d.data))
        .attr("stroke", d => d.data.unlocked ? "#10B981" : "#9CA3AF")
        .attr("stroke-width", 3)
        .style("cursor", "pointer");

      // Add skill icons/text
      nodes.append("text")
        .text(d => d.data.icon || d.data.name.slice(0, 2))
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .style("pointer-events", "none");

      // Add skill names below nodes
      nodes.append("text")
        .text(d => d.data.name)
        .attr("text-anchor", "middle")
        .attr("dy", "3em")
        .attr("font-size", "10px")
        .attr("fill", "#374151")
        .style("pointer-events", "none");

      // Add level indicators
      nodes.append("text")
        .text(d => `${d.data.currentLevel}/${d.data.maxLevel}`)
        .attr("text-anchor", "middle")
        .attr("dy", "4.5em")
        .attr("font-size", "9px")
        .attr("fill", "#6B7280")
        .style("pointer-events", "none");

    } else {
      // Grid layout
      const gridCols = Math.ceil(Math.sqrt(filteredNodes.length));
      const gridRows = Math.ceil(filteredNodes.length / gridCols);
      const cellWidth = (width - margin.left - margin.right) / gridCols;
      const cellHeight = (height - margin.top - margin.bottom) / gridRows;

      const nodes = container.selectAll(".skill-node")
        .data(filteredNodes)
        .enter().append("g")
        .attr("class", "skill-node")
        .attr("transform", (d, i) => {
          const row = Math.floor(i / gridCols);
          const col = i % gridCols;
          return `translate(${col * cellWidth + cellWidth / 2 + margin.left},${row * cellHeight + cellHeight / 2 + margin.top})`;
        });

      // Add rectangles for grid view
      nodes.append("rect")
        .attr("x", -40)
        .attr("y", -25)
        .attr("width", 80)
        .attr("height", 50)
        .attr("fill", d => getSkillColor(d))
        .attr("stroke", d => d.unlocked ? "#10B981" : "#9CA3AF")
        .attr("stroke-width", 2)
        .attr("rx", 8)
        .style("cursor", "pointer");

      // Add skill names
      nodes.append("text")
        .text(d => d.name.length > 10 ? d.name.slice(0, 8) + '...' : d.name)
        .attr("text-anchor", "middle")
        .attr("dy", "-0.5em")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .style("pointer-events", "none");

      // Add level indicators
      nodes.append("text")
        .text(d => `Lv.${d.currentLevel}/${d.maxLevel}`)
        .attr("text-anchor", "middle")
        .attr("dy", "1em")
        .attr("font-size", "9px")
        .attr("fill", "white")
        .style("pointer-events", "none");
    }

    // Add interactivity
    const getSkillData = (datum: unknown): SkillNode => {
      return viewMode === 'tree'
        ? (datum as d3.HierarchyPointNode<SkillNode>).data
        : (datum as SkillNode);
    };

    container.selectAll(".skill-node")
      .on("click", (_event, d) => {
        const skillData = getSkillData(d);
        setSelectedSkill(skillData);
        if (onSkillClick) onSkillClick(skillData);
      })
      .on("mouseover", (_event, d) => {
        const skillData = getSkillData(d);
        setHoveredSkill(skillData);
      })
      .on("mouseout", () => {
        setHoveredSkill(null);
      });

    // Tooltip
    if (hoveredSkill) {
      const tooltip = d3.select("body").append("div")
        .attr("class", "skill-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.9)")
        .style("color", "white")
        .style("padding", "12px")
        .style("border-radius", "8px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "1000")
        .style("max-width", "250px")
        .html(`
          <div class="font-bold text-yellow-400">${hoveredSkill.name}</div>
          <div class="text-gray-300 mb-2">${hoveredSkill.description}</div>
          <div class="text-sm">
            <div>Level: ${hoveredSkill.currentLevel}/${hoveredSkill.maxLevel}</div>
            <div>Type: <span class="capitalize">${hoveredSkill.skillType}</span></div>
            <div>Category: ${hoveredSkill.category}</div>
            ${hoveredSkill.effects.length > 0 ? `<div class="mt-2"><strong>Effects:</strong><br/>${hoveredSkill.effects.slice(0, 3).join('<br/>')}</div>` : ''}
            ${canUpgradeSkill(hoveredSkill) ? `<div class="text-green-400 mt-2">Click to upgrade (Cost: ${hoveredSkill.cost})</div>` : ''}
          </div>
        `);

      setTimeout(() => tooltip.remove(), 3000);
    }

  }, [filteredNodes, skillTree, viewMode, zoomLevel, hoveredSkill, availablePoints, readonly]);

  const getSkillColor = (skill: SkillNode): string => {
    if (!skill.unlocked) return "#6B7280"; // Gray for locked
    if (skill.currentLevel === 0) return "#3B82F6"; // Blue for unlocked but not learned
    if (skill.currentLevel === skill.maxLevel) return "#F59E0B"; // Gold for maxed
    return "#10B981"; // Green for partially learned
  };

  const createHierarchy = (nodes: SkillNode[], _connections: SkillTree['connections']): { name: string; children: SkillNode[] } => {
    // Simple hierarchy creation - this could be enhanced
    const rootNodes = nodes.filter(n => n.prerequisites.length === 0);

    if (rootNodes.length === 0) return { name: "Root", children: nodes };

    return {
      name: "Skill Tree Root",
      children: rootNodes
    };
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Controls */}
      <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">{skillTree.name}</h3>
          <span className="text-sm text-gray-600">
            Available Points: <span className="font-bold text-blue-600">{availablePoints}</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
            {(['tree', 'grid'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`
                  px-3 py-1 text-sm capitalize
                  ${viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }
                `}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Zoom Control */}
          <div className="flex items-center space-x-2">
            <label className="text-sm">Zoom:</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Skill Tree Visualization */}
      <div className="flex-1 overflow-hidden">
        <svg
          ref={svgRef}
          width="100%"
          height="600"
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        />
      </div>

      {/* Skill Details Panel */}
      <AnimatePresence>
        {selectedSkill && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 p-6"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    {selectedSkill.icon && <span className="mr-2 text-2xl">{selectedSkill.icon}</span>}
                    {selectedSkill.name}
                  </h3>
                  <button
                    onClick={() => setSelectedSkill(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-gray-300">Description</h4>
                      <p className="text-gray-600 dark:text-gray-400">{selectedSkill.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Type:</span>
                        <span className="ml-2 capitalize">{selectedSkill.skillType}</span>
                      </div>
                      <div>
                        <span className="font-medium">Category:</span>
                        <span className="ml-2">{selectedSkill.category}</span>
                      </div>
                      <div>
                        <span className="font-medium">Level:</span>
                        <span className="ml-2">{selectedSkill.currentLevel}/{selectedSkill.maxLevel}</span>
                      </div>
                      <div>
                        <span className="font-medium">Tier:</span>
                        <span className="ml-2">{selectedSkill.tier}</span>
                      </div>
                    </div>

                    {selectedSkill.prerequisites.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Prerequisites</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedSkill.prerequisites.map(prereqId => {
                            const prereq = skillTree.nodes.find(n => n.id === prereqId);
                            return prereq ? (
                              <span
                                key={prereqId}
                                className={`px-2 py-1 text-xs rounded-full ${
                                  prereq.currentLevel > 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {prereq.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {selectedSkill.effects.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Effects</h4>
                        <ul className="list-disc list-inside text-sm space-y-1 text-gray-600 dark:text-gray-400">
                          {selectedSkill.effects.map((effect, index) => (
                            <li key={index}>{effect}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!readonly && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => onSkillUpgrade?.(selectedSkill.id)}
                          disabled={!canUpgradeSkill(selectedSkill)}
                          className={`px-4 py-2 rounded-md font-medium ${
                            canUpgradeSkill(selectedSkill)
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Upgrade (Cost: {selectedSkill.cost})
                        </button>

                        {selectedSkill.currentLevel > 0 && (
                          <button
                            onClick={() => onSkillReset?.(selectedSkill.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 border-t">
        <h4 className="font-medium mb-2">Legend</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-gray-500 mr-2"></div>
            <span>Locked</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
            <span>Learned</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
            <span>Maxed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

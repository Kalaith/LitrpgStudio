import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { Character } from '../types';

interface RelationshipNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  character: Character;
  level: number;
}

interface RelationshipLink extends d3.SimulationLinkDatum<RelationshipNode> {
  source: RelationshipNode;
  target: RelationshipNode;
  type: 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family';
  strength: number;
}

interface CharacterRelationshipMapProps {
  characters: Character[];
  relationships?: Array<{
    sourceId: string;
    targetId: string;
    type: 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family';
    strength: number;
  }>;
  onNodeClick?: (character: Character) => void;
}

export default function CharacterRelationshipMap({
  characters,
  relationships = [],
  onNodeClick
}: CharacterRelationshipMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Character | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    if (!svgRef.current || characters.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    // Create nodes from characters
    const nodes: RelationshipNode[] = characters.map(character => ({
      id: character.id,
      name: character.name,
      character,
      level: character.level,
      x: Math.random() * (width - 2 * margin.left) + margin.left,
      y: Math.random() * (height - 2 * margin.top) + margin.top
    }));

    // Create links from relationships
    const links: RelationshipLink[] = relationships
      .map(rel => {
        const source = nodes.find(n => n.id === rel.sourceId);
        const target = nodes.find(n => n.id === rel.targetId);
        if (source && target) {
          return {
            source,
            target,
            type: rel.type,
            strength: rel.strength
          };
        }
        return null;
      })
      .filter(Boolean) as RelationshipLink[];

    // Set up the simulation
    const simulation = d3.forceSimulation<RelationshipNode>(nodes)
      .force("link", d3.forceLink<RelationshipNode, RelationshipLink>(links)
        .id(d => d.id)
        .distance(d => 100 - d.strength * 20))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Color scale for relationship types
    const relationshipColors = {
      ally: '#10B981', // green
      enemy: '#EF4444', // red
      neutral: '#6B7280', // gray
      romantic: '#F59E0B', // pink
      family: '#8B5CF6' // purple
    };

    // Create container group
    const container = svg.append("g");

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create links
    const link = container.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", d => relationshipColors[d.type])
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.strength) * 2);

    // Create nodes
    const node = container.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .attr("class", "node")
      .call(d3.drag<SVGGElement, RelationshipNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add circles for nodes
    node.append("circle")
      .attr("r", d => 5 + d.level * 2)
      .attr("fill", d => {
        const hue = (d.level * 30) % 360;
        return `hsl(${hue}, 70%, 50%)`;
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Add labels
    node.append("text")
      .text(d => d.name)
      .attr("x", 0)
      .attr("y", d => -(5 + d.level * 2) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#374151");

    // Add level indicators
    node.append("text")
      .text(d => `Lv.${d.level}`)
      .attr("x", 0)
      .attr("y", d => (5 + d.level * 2) + 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#6B7280");

    // Node click handler
    node.on("click", (event, d) => {
      setSelectedNode(d.character);
      if (onNodeClick) {
        onNodeClick(d.character);
      }
    });

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000");

    node.on("mouseover", (event, d) => {
      tooltip.style("visibility", "visible")
        .html(`
          <strong>${d.name}</strong><br/>
          Level: ${d.level}<br/>
          Class: ${d.character.class}<br/>
          Race: ${d.character.race}
        `);
    })
    .on("mousemove", (event) => {
      tooltip.style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as RelationshipNode).x!)
        .attr("y1", d => (d.source as RelationshipNode).y!)
        .attr("x2", d => (d.target as RelationshipNode).x!)
        .attr("y2", d => (d.target as RelationshipNode).y!);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: RelationshipNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: RelationshipNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: RelationshipNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      tooltip.remove();
    };
  }, [characters, relationships, onNodeClick]);

  return (
    <div className="w-full h-full flex">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Character Relationships</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {showLegend ? 'Hide' : 'Show'} Legend
            </button>
          </div>
        </div>

        <svg
          ref={svgRef}
          width="100%"
          height="600"
          className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        />
      </div>

      {showLegend && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-64 ml-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4"
        >
          <h4 className="font-semibold mb-3">Relationship Types</h4>
          <div className="space-y-2">
            {[
              { type: 'ally', color: '#10B981', label: 'Ally' },
              { type: 'enemy', color: '#EF4444', label: 'Enemy' },
              { type: 'neutral', color: '#6B7280', label: 'Neutral' },
              { type: 'romantic', color: '#F59E0B', label: 'Romantic' },
              { type: 'family', color: '#8B5CF6', label: 'Family' },
            ].map(({ type, color, label }) => (
              <div key={type} className="flex items-center">
                <div
                  className="w-4 h-0.5 mr-2"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>

          {selectedNode && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold mb-2">Selected Character</h4>
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {selectedNode.name}</p>
                <p><strong>Level:</strong> {selectedNode.level}</p>
                <p><strong>Class:</strong> {selectedNode.class}</p>
                <p><strong>Race:</strong> {selectedNode.race}</p>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold mb-2">Controls</h4>
            <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
              <p>• Click and drag nodes to move</p>
              <p>• Mouse wheel to zoom</p>
              <p>• Click node to select</p>
              <p>• Hover for details</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
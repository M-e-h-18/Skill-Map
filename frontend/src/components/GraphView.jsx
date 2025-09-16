import React, { useEffect, useCallback, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GitBranch, Maximize2, Minimize2 } from 'lucide-react';
import ExportButtons from './ExportButtons';

const mockSkillsData = {
  JavaScript: { category: 'Programming', connections: ['React', 'Node.js', 'TypeScript'] },
  Python: { category: 'Programming', connections: ['Django', 'Machine Learning', 'Data Analysis'] },
  React: { category: 'Frontend', connections: ['JavaScript', 'TypeScript', 'CSS'] },
  SQL: { category: 'Database', connections: ['PostgreSQL', 'MongoDB', 'Database Design'] },
  Git: { category: 'Tools', connections: ['GitHub', 'Version Control'] },
  'Node.js': { category: 'Backend', connections: ['JavaScript', 'Express', 'MongoDB'] },
  TypeScript: { category: 'Programming', connections: ['JavaScript', 'React', 'Angular'] },
  CSS: { category: 'Frontend', connections: ['HTML', 'React', 'Sass'] },
  HTML: { category: 'Frontend', connections: ['CSS', 'JavaScript'] },
  'Machine Learning': { category: 'AI/ML', connections: ['Python', 'Statistics', 'Data Analysis'] },
};

function wrap(text, width) {
  text.each(function () {
    const textElement = d3.select(this);
    const words = textElement.text().split(/\s+/).reverse();
    let word;
    let line = [];
    let lineNumber = 0;
    const lineHeight = 1.1;
    const y = textElement.attr('y');
    const dy = parseFloat(textElement.attr('dy')) || 0;
    let tspan = textElement.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');

    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(' '));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = textElement
          .append('tspan')
          .attr('x', 0)
          .attr('y', y)
          .attr('dy', ++lineNumber * lineHeight + dy + 'em')
          .text(word);
      }
    }
  });
}

const GraphView = ({ skills, onSkillClick, isDark, analysis, svgRef: externalSvgRef }) => {
  const [fullscreen, setFullscreen] = useState(false);
  const internalSvgRef = useRef(null);
  const svgRef = externalSvgRef || internalSvgRef;

  // Resize handler for fullscreen
  useEffect(() => {
    function handleResize() {
      if (fullscreen && svgRef.current) {
        svgRef.current.setAttribute('width', window.innerWidth);
        svgRef.current.setAttribute('height', window.innerHeight);
      }
    }
    if (fullscreen) {
      window.addEventListener('resize', handleResize);
      handleResize();
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [fullscreen, svgRef]);

  const buildGraphData = useCallback(() => {
    const nodes = [];
    const links = [];
    const nodeIds = new Set();
    const allSkillsFromAnalysis = new Set();

    if (Array.isArray(analysis)) {
      analysis.forEach((role) => {
        (Array.isArray(role.missingSkills) ? role.missingSkills : String(role.missingSkills).split(/[,]|[\u0026]| /)).forEach(
          (s) => s && allSkillsFromAnalysis.add(s)
        );
        (Array.isArray(role.suggestedSkills) ? role.suggestedSkills : String(role.suggestedSkills).split(/[,]|[\u0026]| /)).forEach(
          (s) => s && allSkillsFromAnalysis.add(s)
        );
      });
    }

    skills.forEach((skill) => {
      if (!nodeIds.has(skill)) {
        nodes.push({
          id: skill,
          type: 'skill',
          status: 'owned',
          ...mockSkillsData[skill],
        });
        nodeIds.add(skill);
      }
    });

    [...skills, ...Array.from(allSkillsFromAnalysis)].forEach((skillId) => {
      const skillData = mockSkillsData[skillId];
      if (skillData?.connections) {
        skillData.connections.forEach((connectionId) => {
          if (!nodeIds.has(connectionId)) {
            nodes.push({
              id: connectionId,
              type: 'skill',
              status: 'suggested',
              ...mockSkillsData[connectionId],
            });
            nodeIds.add(connectionId);
          }
          if (nodeIds.has(skillId) && nodeIds.has(connectionId)) {
            links.push({
              source: skillId,
              target: connectionId,
              type: 'connection',
              isStrong: skills.includes(skillId) && skills.includes(connectionId),
            });
          }
        });
      }
    });

    if (Array.isArray(analysis)) {
      analysis.forEach((role) => {
        if (role && typeof role === 'object' && role.title) {
          const roleNodeId = `ROLE_${role.title}`;
          if (!nodeIds.has(roleNodeId)) {
            nodes.push({
              id: roleNodeId,
              type: 'role',
              title: role.title,
              readiness: role.readiness || 0,
              status: 'role',
              category: 'Role',
            });
            nodeIds.add(roleNodeId);
          }
          skills.forEach((skillId) => {
            links.push({
              source: skillId,
              target: roleNodeId,
              type: 'skill-to-role',
              isStrong: (role.readiness || 0) > 50,
              strength: (role.readiness || 0) / 100,
            });
          });
          [
            ...(Array.isArray(role.missingSkills) ? role.missingSkills : String(role.missingSkills).split(/[,]|[\u0026]| /)),
            ...(Array.isArray(role.suggestedSkills) ? role.suggestedSkills : String(role.suggestedSkills).split(/[,]|[\u0026]| /)),
          ].forEach((skillId) => {
            if (nodeIds.has(skillId) && !skills.includes(skillId)) {
              links.push({
                source: skillId,
                target: roleNodeId,
                type: 'skill-to-role-suggested',
                isStrong: false,
                strength: 0.2,
              });
            }
          });
        }
      });
    }

    return { nodes, links };
  }, [skills, analysis]);

  useEffect(() => {
    const { nodes, links } = buildGraphData();
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (nodes.length === 0) {
      svg
        .append('text')
        .attr('x', 400)
        .attr('y', 200)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('fill', isDark ? '#64748b' : '#94a3b8')
        .text('Add skills to visualize connections and roles');
      return;
    }


    const width = fullscreen ? window.innerWidth : 800;
    const height = fullscreen ? window.innerHeight : 400;
    const margin = 50;

    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => (d.type === 'skill-to-role' ? 120 * (1 - (d.strength || 0)) : 100)))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => (d.type === 'role' ? 45 : 35)))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));

    const container = svg.append('g');

    const zoom = d3.zoom().scaleExtent([0.5, 2]).on('zoom', event => {
      container.attr('transform', event.transform);
    });

    svg.call(zoom);

    // Links
    const link = container.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', d => (d.type === 'skill-to-role' ? '#00aa31' : '#0088bb'))
      .attr('stroke-width', d => (d.isStrong ? 3 : 1.5))
      .attr('stroke-opacity', d => (d.isStrong ? 0.8 : 0.4))
      .attr('stroke-dasharray', d => (d.isStrong ? '0' : '4 4'));

    // Nodes
    const node = container.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    node.each(function (d) {
      const g = d3.select(this);
      if (d.type === 'role') {
        const r = 40;
        const hexPoints = Array.from({ length: 6 }, (_, i) => {
          const angle = (Math.PI / 3) * i;
          return [r * Math.cos(angle), r * Math.sin(angle)].join(',');
        }).join(' ');
        g.append('polygon')
          .attr('points', hexPoints)
          .attr('fill', d.readiness > 70 ? '#006400' : d.readiness > 40 ? '#8B8000' : '#8B0000')
          .attr('stroke', d.readiness > 70 ? '#00ff41' : d.readiness > 40 ? '#ffff00' : '#ff0000')
          .attr('stroke-width', 3);
      } else {
        g.append('circle')
          .attr('r', 25)
          .attr('fill', d.status === 'owned' ? '#0a0a0a' : '#2a2a2a')
          .attr('stroke', d.status === 'owned' ? '#00ff41' : '#666666')
          .attr('stroke-width', 3)
          .attr('opacity', d.status === 'suggested' ? 0.7 : 1);
      }
    });

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('font-size', d => (d.type === 'role' ? '10px' : '9px'))
      .attr('fill', d => (d.type === 'role' ? '#fff' : d.status === 'owned' ? '#00ffff' : '#999999'))
      .attr('font-weight', '600')
      .text(d => (d.type === 'role' ? d.title : d.id.length > 8 ? d.id.substring(0, 8) + '...' : d.id))
      .call(t => t.call(wrap, 40));

    node.on('click', (event, d) => {
      if (d.type === 'skill') onSkillClick(d);
    });

    simulation.on('tick', () => {
      nodes.forEach(d => {
        d.x = Math.max(margin, Math.min(width - margin, d.x));
        d.y = Math.max(margin, Math.min(height - margin, d.y));
      });

      link.attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
    function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
    function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }

  }, [buildGraphData, isDark, onSkillClick, skills, analysis, fullscreen]);

  return (
    <>
      {/* Fullscreen Overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-0 m-0">
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 p-3 bg-white rounded-full shadow-lg z-50 hover:bg-gray-200 transition"
            title="Exit Fullscreen"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <svg
            ref={svgRef}
            width={window.innerWidth}
            height={window.innerHeight}
            className="rounded-lg"
          />
        </div>
      )}

      {/* Normal view */}
      {!fullscreen && (
        <div className={`relative p-6 rounded-xl border-2 backdrop-blur-sm ${isDark ? 'border-cyan-400/30 bg-slate-800/70' : 'border-slate-300 bg-white/90'} shadow-2xl`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-cyan-300' : 'text-slate-700'}`}>
              <GitBranch className="w-5 h-5" />
              Skills & Career Pathways Graph
            </h3>
            <div className="flex items-center gap-2">
              <ExportButtons isDark={isDark} />
              <button
                onClick={() => setFullscreen(true)}
                className={`p-2 rounded-lg border ${isDark ? 'border-cyan-400/30 hover:border-cyan-400 text-cyan-400' : 'border-slate-300 hover:border-slate-400 text-slate-600'} transition-colors`}
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <svg
            ref={svgRef}
            width={800}
            height={400}
            className="rounded-lg border border-cyan-400/30"
          />
        </div>
      )}
    </>
  );
};

export default GraphView;
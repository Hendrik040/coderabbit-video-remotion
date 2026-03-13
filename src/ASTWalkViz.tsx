import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

// CodeRabbit Brand Colors
const COLORS = {
  orange: "#FF570A",
  pink: "#F2B8EB",
  aquamarine: "#25BAB1",
  dark: "#171717",
  cream: "#F6F6F1",
};

// Tree node component
const TreeNode: React.FC<{
  label: string;
  x: number;
  y: number;
  delay: number;
  isActive?: boolean;
  isHighlighted?: boolean;
  children?: { x: number; y: number }[];
}> = ({ label, x, y, delay, isActive = false, isHighlighted = false, children = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const activeGlow = isActive
    ? interpolate(Math.sin(frame * 0.2), [-1, 1], [0.5, 1])
    : 0;

  const nodeColor = isHighlighted
    ? COLORS.orange
    : isActive
    ? COLORS.aquamarine
    : COLORS.cream;

  const bgColor = isHighlighted
    ? `${COLORS.orange}30`
    : isActive
    ? `${COLORS.aquamarine}20`
    : `${COLORS.dark}`;

  return (
    <>
      {/* Lines to children */}
      {children.map((child, i) => {
        const lineOpacity = interpolate(frame - delay - 10, [0, 15], [0, 0.4], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <line
            key={i}
            x1={x}
            y1={y + 25}
            x2={child.x}
            y2={child.y - 25}
            stroke={COLORS.cream}
            strokeWidth={2}
            opacity={lineOpacity}
          />
        );
      })}

      {/* Node */}
      <g
        transform={`translate(${x}, ${y}) scale(${Math.max(0, scale)})`}
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
      >
        <rect
          x={-60}
          y={-25}
          width={120}
          height={50}
          rx={8}
          fill={bgColor}
          stroke={nodeColor}
          strokeWidth={isActive || isHighlighted ? 3 : 1}
          filter={isActive ? `drop-shadow(0 0 ${10 * activeGlow}px ${nodeColor})` : "none"}
        />
        <text
          x={0}
          y={6}
          textAnchor="middle"
          fill={nodeColor}
          fontSize={14}
          fontFamily="JetBrains Mono, monospace"
          fontWeight={isActive || isHighlighted ? 700 : 400}
        >
          {label}
        </text>
      </g>
    </>
  );
};

// Walking indicator (the "cursor" that moves through the tree)
const WalkingCursor: React.FC<{ x: number; y: number; visible: boolean }> = ({
  x,
  y,
  visible,
}) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame * 0.3), [-1, 1], [0.8, 1.2]);

  if (!visible) return null;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle
        r={8 * pulse}
        fill={COLORS.orange}
        opacity={0.8}
        filter={`drop-shadow(0 0 10px ${COLORS.orange})`}
      />
      <circle r={4} fill={COLORS.cream} />
    </g>
  );
};

// Code panel showing current node
const CodePanel: React.FC<{ currentNode: string; lineNumber: number }> = ({
  currentNode,
  lineNumber,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        right: 80,
        top: 200,
        width: 450,
        opacity,
      }}
    >
      <div
        style={{
          backgroundColor: "#0d0d0d",
          borderRadius: 12,
          padding: 24,
          border: `2px solid ${COLORS.orange}50`,
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: COLORS.cream,
            opacity: 0.5,
            marginBottom: 16,
            fontFamily: "Inter, sans-serif",
          }}
        >
          ast.walk(tree)
        </div>
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 16,
            color: COLORS.cream,
            lineHeight: 1.8,
          }}
        >
          <span style={{ color: COLORS.pink }}>for </span>
          <span style={{ color: COLORS.cream }}>node </span>
          <span style={{ color: COLORS.pink }}>in </span>
          <span style={{ color: COLORS.aquamarine }}>ast.walk</span>
          <span style={{ color: COLORS.cream }}>(tree):</span>
          <br />
          <span style={{ color: COLORS.cream }}>{"    "}</span>
          <span style={{ color: COLORS.pink }}>if </span>
          <span style={{ color: COLORS.aquamarine }}>isinstance</span>
          <span style={{ color: COLORS.cream }}>(node, ast.FunctionDef):</span>
          <br />
          <span style={{ color: COLORS.cream }}>{"        "}</span>
          <span style={{ color: COLORS.aquamarine }}>print</span>
          <span style={{ color: COLORS.cream }}>(node.name)</span>
        </div>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            backgroundColor: `${COLORS.orange}15`,
            borderRadius: 8,
            border: `1px solid ${COLORS.orange}50`,
          }}
        >
          <div style={{ fontSize: 12, color: COLORS.orange, marginBottom: 8 }}>
            Current Node:
          </div>
          <div
            style={{
              fontSize: 20,
              color: COLORS.cream,
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 700,
            }}
          >
            {currentNode}
          </div>
          {lineNumber > 0 && (
            <div style={{ fontSize: 14, color: COLORS.aquamarine, marginTop: 8 }}>
              Line {lineNumber}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main component
export const ASTWalkViz: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Define the tree structure
  // This represents a simple Python file with a module, function, and statements
  const nodes = [
    { id: "module", label: "Module", x: 400, y: 100, delay: 0 },
    { id: "func", label: "FunctionDef", x: 250, y: 220, delay: 10 },
    { id: "import", label: "Import", x: 550, y: 220, delay: 15 },
    { id: "args", label: "arguments", x: 120, y: 340, delay: 20 },
    { id: "return", label: "Return", x: 380, y: 340, delay: 25 },
    { id: "arg1", label: "arg: price", x: 50, y: 460, delay: 30 },
    { id: "arg2", label: "arg: percent", x: 190, y: 460, delay: 35 },
    { id: "binop", label: "BinOp", x: 380, y: 460, delay: 40 },
  ];

  // Define parent-child relationships for drawing lines
  const edges = [
    { from: "module", to: "func" },
    { from: "module", to: "import" },
    { from: "func", to: "args" },
    { from: "func", to: "return" },
    { from: "args", to: "arg1" },
    { from: "args", to: "arg2" },
    { from: "return", to: "binop" },
  ];

  // Walking sequence - which node is active at which frame
  const walkSequence = [
    { nodeId: "module", startFrame: 60, label: "Module", line: 0 },
    { nodeId: "func", startFrame: 120, label: "FunctionDef: calculate_discount", line: 4 },
    { nodeId: "args", startFrame: 180, label: "arguments", line: 4 },
    { nodeId: "arg1", startFrame: 220, label: "arg: price", line: 4 },
    { nodeId: "arg2", startFrame: 260, label: "arg: percent", line: 4 },
    { nodeId: "return", startFrame: 320, label: "Return", line: 16 },
    { nodeId: "binop", startFrame: 380, label: "BinOp: Multiply", line: 16 },
    { nodeId: "import", startFrame: 440, label: "Import: typing", line: 1 },
  ];

  // Determine current active node
  let currentWalk = walkSequence[0];
  for (const walk of walkSequence) {
    if (frame >= walk.startFrame) {
      currentWalk = walk;
    }
  }

  // Get node position for cursor
  const activeNode = nodes.find((n) => n.id === currentWalk.nodeId);
  const cursorX = activeNode?.x || 400;
  const cursorY = activeNode?.y || 100;

  // Title animation
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          backgroundImage: `
            linear-gradient(${COLORS.orange}15 1px, transparent 1px),
            linear-gradient(90deg, ${COLORS.orange}15 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 80,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: COLORS.cream,
            fontFamily: "Inter, sans-serif",
          }}
        >
          Walking the AST
        </div>
        <div
          style={{
            fontSize: 18,
            color: COLORS.aquamarine,
            fontFamily: "JetBrains Mono, monospace",
            marginTop: 8,
          }}
        >
          Abstract Syntax Tree Traversal
        </div>
      </div>

      {/* Tree visualization */}
      <svg
        style={{
          position: "absolute",
          left: 0,
          top: 80,
          width: 800,
          height: 600,
        }}
      >
        {/* Draw edges first (behind nodes) */}
        {edges.map((edge, i) => {
          const fromNode = nodes.find((n) => n.id === edge.from);
          const toNode = nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const lineOpacity = interpolate(
            frame - Math.max(fromNode.delay, toNode.delay) - 10,
            [0, 15],
            [0, 0.4],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <line
              key={i}
              x1={fromNode.x}
              y1={fromNode.y + 25}
              x2={toNode.x}
              y2={toNode.y - 25}
              stroke={COLORS.cream}
              strokeWidth={2}
              opacity={lineOpacity}
            />
          );
        })}

        {/* Draw nodes */}
        {nodes.map((node) => {
          const isActive = currentWalk.nodeId === node.id;
          const walkIndex = walkSequence.findIndex((w) => w.nodeId === node.id);
          const isHighlighted =
            walkIndex >= 0 && frame >= walkSequence[walkIndex].startFrame + 30;

          return (
            <TreeNode
              key={node.id}
              label={node.label}
              x={node.x}
              y={node.y}
              delay={node.delay}
              isActive={isActive}
              isHighlighted={isHighlighted && !isActive}
            />
          );
        })}

        {/* Walking cursor */}
        <WalkingCursor x={cursorX} y={cursorY - 45} visible={frame > 60} />
      </svg>

      {/* Code panel */}
      <CodePanel currentNode={currentWalk.label} lineNumber={currentWalk.line} />

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 80,
          display: "flex",
          gap: 32,
          opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              backgroundColor: `${COLORS.aquamarine}20`,
              border: `2px solid ${COLORS.aquamarine}`,
            }}
          />
          <span style={{ color: COLORS.cream, fontSize: 14, fontFamily: "Inter, sans-serif" }}>
            Currently visiting
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              backgroundColor: `${COLORS.orange}30`,
              border: `2px solid ${COLORS.orange}`,
            }}
          />
          <span style={{ color: COLORS.cream, fontSize: 14, fontFamily: "Inter, sans-serif" }}>
            Already visited
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

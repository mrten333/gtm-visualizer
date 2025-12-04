import type { Node, Edge } from '@xyflow/react';
import type { GTMExport } from '../types/gtm';

export interface ParsedGTMData {
  nodes: Node[];
  edges: Edge[];
}

// Extract variable references from parameter values using {{Variable Name}} pattern
function extractVariableReferences(parameters: Array<{ key: string; value: string }> = []): string[] {
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const references: string[] = [];

  parameters.forEach(param => {
    if (typeof param.value === 'string') {
      const matches = param.value.matchAll(variablePattern);
      for (const match of matches) {
        references.push(match[1]);
      }
    }
  });

  return references;
}

export function parseGTMJson(gtmData: GTMExport): ParsedGTMData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const { containerVersion } = gtmData;
  const tags = containerVersion.tag || [];
  const triggers = containerVersion.trigger || [];
  const variables = containerVersion.variable || [];

  // Create maps for quick lookups
  const triggerMap = new Map(triggers.map(t => [t.triggerId, t]));
  const variableMap = new Map(variables.map(v => [v.name, v]));

  // Create nodes for triggers (Green)
  triggers.forEach(trigger => {
    nodes.push({
      id: `trigger-${trigger.triggerId}`,
      type: 'default',
      position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
      data: {
        label: trigger.name,
        type: 'trigger',
        raw: trigger
      },
      style: {
        backgroundColor: '#1a2332',
        color: '#10b981',
        border: '3px solid #10b981',
        borderRadius: '10px',
        padding: '24px 32px',
        minWidth: '280px',
        fontSize: '26px',
        fontWeight: '700',
        boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
      }
    });
  });

  // Create nodes for variables (Blue)
  variables.forEach(variable => {
    nodes.push({
      id: `variable-${variable.variableId}`,
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: variable.name,
        type: 'variable',
        raw: variable
      },
      style: {
        backgroundColor: '#1a2332',
        color: '#3b82f6',
        border: '3px solid #3b82f6',
        borderRadius: '10px',
        padding: '24px 32px',
        minWidth: '280px',
        fontSize: '26px',
        fontWeight: '700',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
      }
    });
  });

  // Create nodes for tags (Red)
  tags.forEach(tag => {
    nodes.push({
      id: `tag-${tag.tagId}`,
      type: 'default',
      position: { x: 0, y: 0 },
      data: {
        label: tag.name,
        type: 'tag',
        raw: tag
      },
      style: {
        backgroundColor: '#1a2332',
        color: '#f87171',
        border: '3px solid #f87171',
        borderRadius: '10px',
        padding: '24px 32px',
        minWidth: '280px',
        fontSize: '26px',
        fontWeight: '700',
        boxShadow: '0 0 20px rgba(248, 113, 113, 0.4)'
      }
    });

    // Create edges: Trigger -> Tag
    if (tag.firingTriggerId) {
      tag.firingTriggerId.forEach(triggerId => {
        if (triggerMap.has(triggerId)) {
          edges.push({
            id: `trigger-${triggerId}-tag-${tag.tagId}`,
            source: `trigger-${triggerId}`,
            target: `tag-${tag.tagId}`,
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 8 }
          });
        }
      });
    }

    // Create edges: Variable -> Tag
    if (tag.parameter) {
      const referencedVars = extractVariableReferences(tag.parameter);
      referencedVars.forEach(varName => {
        const variable = variableMap.get(varName);
        if (variable) {
          edges.push({
            id: `variable-${variable.variableId}-tag-${tag.tagId}`,
            source: `variable-${variable.variableId}`,
            target: `tag-${tag.tagId}`,
            animated: false,
            style: { stroke: '#3b82f6', strokeWidth: 8 }
          });
        }
      });
    }
  });

  // Create edges: Variable -> Variable
  variables.forEach(variable => {
    if (variable.parameter) {
      const referencedVars = extractVariableReferences(variable.parameter);
      referencedVars.forEach(varName => {
        const referencedVar = variableMap.get(varName);
        if (referencedVar && referencedVar.variableId !== variable.variableId) {
          edges.push({
            id: `variable-${referencedVar.variableId}-variable-${variable.variableId}`,
            source: `variable-${referencedVar.variableId}`,
            target: `variable-${variable.variableId}`,
            animated: false,
            style: { stroke: '#3b82f6', strokeWidth: 8, strokeDasharray: '5,5' }
          });
        }
      });
    }
  });

  return { nodes, edges };
}

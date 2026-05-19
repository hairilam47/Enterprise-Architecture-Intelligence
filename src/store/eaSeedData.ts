/**
 * Sample ArchiMate project for demonstration.
 * Loaded on first run if no saved project exists.
 */

import type { EAProject, EAElement, EARelationship, EAView } from './eaTypes'

function el(
  id: string,
  type: EAElement['type'],
  name: string,
  layer: EAElement['layer'],
  description?: string,
  x = 0,
  y = 0,
  viewId = 'view-overview',
): EAElement {
  return {
    id,
    type,
    name,
    description,
    layer,
    status: 'Active',
    properties: {},
    positions: { [viewId]: { x, y } },
    sizes: { [viewId]: { w: 180, h: 60 } },
    viewIds: [viewId],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }
}

function rel(
  id: string,
  type: EARelationship['type'],
  sourceId: string,
  targetId: string,
  label?: string,
): EARelationship {
  return {
    id,
    type,
    sourceId,
    targetId,
    label,
    properties: {},
    createdAt: '2025-01-01T00:00:00.000Z',
  }
}

const VIEW_ID = 'view-overview'

const overviewView: EAView = {
  id: VIEW_ID,
  name: 'Architecture Overview',
  type: 'Canvas',
  loS: 2,
  description: 'High-level EA overview covering Business, Application and Technology layers.',
  elementIds: [
    'e-customer', 'e-sales', 'e-crm-service', 'e-crm-app', 'e-erp-app',
    'e-db-crm', 'e-db-erp', 'e-node-app', 'e-node-db',
  ],
  relationshipIds: [
    'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8',
  ],
  layoutData: {},
  viewport: { x: 0, y: 0, zoom: 1 },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
}

export const seedProject: EAProject = {
  id: 'project-demo',
  name: 'Enterprise Demo',
  description: 'Sample ArchiMate project demonstrating Business, Application, and Technology layers.',
  elements: {
    'e-customer':   el('e-customer',   'BusinessActor',       'Customer',             'Business',     'External customer',             80,  60),
    'e-sales':      el('e-sales',      'BusinessRole',        'Sales Representative', 'Business',     'Internal sales role',           340, 60),
    'e-crm-service':el('e-crm-service','BusinessService',     'CRM Service',          'Business',     'Customer Relationship Mgmt',    600, 60),
    'e-crm-app':    el('e-crm-app',    'ApplicationComponent','CRM Application',      'Application',  'CRM software component',        80,  220),
    'e-erp-app':    el('e-erp-app',    'ApplicationComponent','ERP Application',      'Application',  'Enterprise Resource Planning',  340, 220),
    'e-db-crm':     el('e-db-crm',     'DataObject',          'Customer Data',        'Application',  'CRM customer data store',       600, 220),
    'e-db-erp':     el('e-db-erp',     'DataObject',          'ERP Data',             'Application',  'ERP master data',               860, 220),
    'e-node-app':   el('e-node-app',   'Node',                'App Server',           'Technology',   'Application server cluster',    200, 380),
    'e-node-db':    el('e-node-db',    'Node',                'Database Server',      'Technology',   'PostgreSQL cluster',            600, 380),
  },
  relationships: {
    r1: rel('r1', 'Assignment',   'e-customer',    'e-crm-service', 'uses'),
    r2: rel('r2', 'Assignment',   'e-sales',       'e-crm-service', 'manages'),
    r3: rel('r3', 'Realization',  'e-crm-app',     'e-crm-service'),
    r4: rel('r4', 'Serving',      'e-erp-app',     'e-crm-app',     'provides data'),
    r5: rel('r5', 'Access',       'e-crm-app',     'e-db-crm',      'reads/writes'),
    r6: rel('r6', 'Access',       'e-erp-app',     'e-db-erp',      'reads/writes'),
    r7: rel('r7', 'Assignment',   'e-node-app',    'e-crm-app'),
    r8: rel('r8', 'Assignment',   'e-node-db',     'e-db-crm'),
  },
  views: [overviewView],
  activeViewId: VIEW_ID,
  selectedElementIds: [],
  selectedRelationshipId: null,
  highlightedElementIds: [],
  version: 1,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
}

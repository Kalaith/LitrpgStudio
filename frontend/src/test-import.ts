// Test file to check if imports work
import type { BaseEntity } from './types/entityRegistry';

console.log('Import test successful');

const testEntity: BaseEntity = {
  id: 'test',
  name: 'Test Entity',
  type: 'character',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {}
};

console.log('Test entity created:', testEntity);
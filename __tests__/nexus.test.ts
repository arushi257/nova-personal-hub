import assert from 'node:assert';
import test from 'node:test';
import { getFeatureFlags, getServices, performServiceAction, toggleFeatureFlag } from '../src/app/api/nexus/data';

test('services inventory returns items', () => {
  const services = getServices();
  assert.ok(services.length > 0, 'expected at least one service');
});

test('service action refreshes deploy time', () => {
  const services = getServices();
  const target = services[0];
  const updated = performServiceAction(target.id, 'deploy');
  assert.notStrictEqual(updated.lastDeployAt, target.lastDeployAt, 'deploy should update deploy time');
});

test('feature flags can toggle', () => {
  const flags = getFeatureFlags();
  const first = flags[0];
  const toggled = toggleFeatureFlag(first.key, !first.enabled);
  assert.strictEqual(toggled.enabled, !first.enabled, 'toggle should flip enabled state');
});


const test = require('node:test');
const assert = require('node:assert/strict');

const { getAllowedRoutes, hasRouteAccess } = require('../utils/roleAccess');

test('student access is limited to student routes', () => {
  const routes = getAllowedRoutes('student');
  assert.ok(routes.includes('dashboard'));
  assert.ok(routes.includes('profile'));
  assert.ok(!routes.includes('audit-logs'));
  assert.equal(hasRouteAccess('student', 'dashboard'), true);
  assert.equal(hasRouteAccess('student', 'audit-logs'), false);
});

test('mentor access includes mentor routes but not admin-only routes', () => {
  const routes = getAllowedRoutes('mentor');
  assert.ok(routes.includes('approvals'));
  assert.ok(routes.includes('analytics'));
  assert.ok(!routes.includes('audit-logs'));
  assert.equal(hasRouteAccess('mentor', 'phases'), true);
  assert.equal(hasRouteAccess('mentor', 'audit-logs'), false);
});

test('admin access includes all privileged routes', () => {
  const routes = getAllowedRoutes('admin');
  assert.ok(routes.includes('audit-logs'));
  assert.ok(routes.includes('houses'));
  assert.equal(hasRouteAccess('admin', 'audit-logs'), true);
  assert.equal(hasRouteAccess('admin', 'dashboard'), true);
});

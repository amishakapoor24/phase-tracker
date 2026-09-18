const ROLE_ROUTE_MAP = {
  student: [
    'dashboard',
    'phase',
    'quiz',
    'profile',
    'progress',
    'notifications',
    'assistant'
  ],
  mentor: [
    'dashboard',
    'phases',
    'questions',
    'approvals',
    'users',
    'student-progress',
    'announcements',
    'analytics',
    'profile',
    'notifications',
    'assistant'
  ],
  admin: [
    'dashboard',
    'phases',
    'questions',
    'approvals',
    'users',
    'student-progress',
    'announcements',
    'analytics',
    'houses',
    'audit-logs',
    'profile',
    'notifications',
    'assistant'
  ]
};

const normalizeRoute = (route = '') => {
  if (!route) return '';
  const trimmed = String(route).trim().replace(/^\/+|\/+$/g, '');
  if (!trimmed) return '';
  const segment = trimmed.split('/')[0];
  return segment.split('?')[0].split('#')[0];
};

const getAllowedRoutes = (role) => {
  const safeRole = role && ROLE_ROUTE_MAP[role] ? role : 'student';
  return [...ROLE_ROUTE_MAP[safeRole]];
};

const hasRouteAccess = (role, route) => {
  const normalizedRoute = normalizeRoute(route);
  if (!normalizedRoute) return true;
  const allowedRoutes = getAllowedRoutes(role);
  return allowedRoutes.includes(normalizedRoute) || allowedRoutes.some((allowedRoute) => {
    if (allowedRoute === 'dashboard' && normalizedRoute === 'admin') return true;
    if (allowedRoute === 'phases' && normalizedRoute === 'admin') return true;
    if (allowedRoute === 'questions' && normalizedRoute === 'admin') return true;
    return false;
  });
};

const getAccessibleCollections = (role) => {
  const roleMap = {
    student: ['Progress', 'Phase', 'SubPhase', 'Submission', 'Announcement', 'User'],
    mentor: ['Progress', 'Phase', 'SubPhase', 'Submission', 'ApprovalRequest', 'Announcement', 'User'],
    admin: ['Progress', 'Phase', 'SubPhase', 'Submission', 'ApprovalRequest', 'Announcement', 'House', 'User', 'AuditLog']
  };

  return roleMap[role] || roleMap.student;
};

module.exports = {
  ROLE_ROUTE_MAP,
  getAllowedRoutes,
  hasRouteAccess,
  getAccessibleCollections,
  normalizeRoute
};

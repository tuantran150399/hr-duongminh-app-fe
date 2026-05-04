import {
  AuditOutlined,
  BankOutlined,
  BranchesOutlined,
  DashboardOutlined,
  InboxOutlined,
  SettingOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { PERMISSIONS } from '@/store/slices/authSlice';

export const APP_ROUTES = [
  {
    path: '/dashboard',
    permission: PERMISSIONS.DASHBOARD_VIEW,
    showInMenu: true,
    icon: DashboardOutlined,
    labelKey: 'menu.dashboard'
  },
  {
    path: '/jobs',
    permission: PERMISSIONS.JOBS_VIEW,
    showInMenu: true,
    icon: InboxOutlined,
    labelKey: 'menu.jobs',
    children: [
      { path: '/jobs/create', permission: PERMISSIONS.JOBS_CREATE },
      { path: '/jobs/detail', permission: PERMISSIONS.JOBS_VIEW },
      { path: '/jobs/edit', permission: PERMISSIONS.JOBS_EDIT }
    ]
  },
  {
    path: '/partners',
    permission: PERMISSIONS.PARTNERS_VIEW,
    showInMenu: true,
    icon: TeamOutlined,
    labelKey: 'menu.partners'
  },
  {
    path: '/accounting',
    permission: PERMISSIONS.ACCOUNTING_VIEW,
    showInMenu: true,
    icon: BankOutlined,
    labelKey: 'menu.accounting'
  },
  {
    path: '/users',
    permission: PERMISSIONS.USERS_VIEW,
    showInMenu: true,
    icon: SettingOutlined,
    labelKey: 'menu.settings'
  },
  {
    path: '/branches',
    permission: PERMISSIONS.BRANCH_MANAGE,
    showInMenu: true,
    icon: BranchesOutlined,
    labelKey: 'menu.branches'
  },
  {
    path: '/audit',
    permission: PERMISSIONS.AUDITLOG_VIEW,
    showInMenu: true,
    icon: AuditOutlined,
    labelKey: 'menu.audit'
  }
];

export const PUBLIC_ROUTES = ['/login'];

export function getAuthorizedMenuItems(userPermissions, t) {
  const hasWildcard = userPermissions.includes('*');

  return APP_ROUTES.filter((route) => {
    if (!route.showInMenu) return false;
    if (!route.permission) return true;
    return hasWildcard || userPermissions.includes(route.permission);
  }).map((route) => ({
    key: route.path,
    icon: route.icon ? <route.icon /> : null,
    label: t(route.labelKey)
  }));
}

export function canAccessPath(pathname, userPermissions) {
  if (PUBLIC_ROUTES.includes(pathname)) return true;

  const hasWildcard = userPermissions.includes('*');
  if (hasWildcard) return true;

  for (const route of APP_ROUTES) {
    if (pathname === route.path || pathname.startsWith(`${route.path}/`)) {
      const matchedChild = route.children?.find(
        (child) => pathname === child.path || pathname.startsWith(`${child.path}/`)
      );
      const requiredPermission = matchedChild ? matchedChild.permission : route.permission;
      if (!requiredPermission) return true;
      return userPermissions.includes(requiredPermission);
    }
  }

  return false;
}

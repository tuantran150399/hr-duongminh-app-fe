import {
  AuditOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  BranchesOutlined,
  DashboardOutlined,
  InboxOutlined,
  SettingOutlined,
  TeamOutlined,
  MoneyCollectOutlined,
  FileProtectOutlined,
  BarChartOutlined,
  DollarOutlined,
  IdcardOutlined,
  CreditCardOutlined,
  FileDoneOutlined,
  SwapOutlined,
  BellOutlined,
  ReconciliationOutlined
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
    path: '/payment-requests',
    permission: PERMISSIONS.ACCOUNTING_VIEW,
    showInMenu: true,
    icon: MoneyCollectOutlined,
    labelKey: 'menu.paymentRequests'
  },
  {
    path: '/debt-policies',
    permission: PERMISSIONS.PARTNER_MANAGE,
    showInMenu: true,
    icon: FileProtectOutlined,
    labelKey: 'menu.debtPolicies'
  },
  {
    path: '/reports',
    permission: PERMISSIONS.ACCOUNTING_VIEW,
    showInMenu: true,
    icon: BarChartOutlined,
    labelKey: 'menu.reports'
  },
  {
    path: '/debit-notes',
    permission: PERMISSIONS.ACCOUNTING_VIEW,
    showInMenu: true,
    icon: FileDoneOutlined,
    labelKey: 'menu.debitNotes'
  },
  {
    path: '/cob',
    permission: PERMISSIONS.ACCOUNTING_VIEW,
    showInMenu: true,
    icon: SwapOutlined,
    labelKey: 'menu.cob'
  },
  {
    path: '/pricing',
    permission: PERMISSIONS.DASHBOARD_VIEW,
    showInMenu: true,
    icon: DollarOutlined,
    labelKey: 'menu.pricing'
  },
  {
    path: '/hrm',
    permission: PERMISSIONS.HR_VIEW,
    showInMenu: true,
    icon: IdcardOutlined,
    labelKey: 'menu.hrm'
  },
  {
    path: '/advances',
    permission: PERMISSIONS.ADVANCE_VIEW,
    showInMenu: true,
    icon: CreditCardOutlined,
    labelKey: 'menu.advances'
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
  },
  {
    path: '/notifications',
    permission: PERMISSIONS.DASHBOARD_VIEW,
    showInMenu: true,
    icon: BellOutlined,
    labelKey: 'menu.notifications'
  },
  {
    path: '/adjustments',
    permission: PERMISSIONS.ACCOUNTING_VIEW,
    showInMenu: true,
    icon: ReconciliationOutlined,
    labelKey: 'menu.adjustments'
  },
  {
    path: '/security',
    permission: PERMISSIONS.SECURITY_VIEW,
    showInMenu: true,
    icon: SafetyCertificateOutlined,
    labelKey: 'menu.security'
  }
];

export const PUBLIC_ROUTES = ['/login'];
export const AUTHENTICATED_FALLBACK_ROUTES = ['/no-access', '/account'];

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

export function getFirstAuthorizedPath(userPermissions) {
  const hasWildcard = userPermissions.includes('*');
  const firstRoute = APP_ROUTES.find((route) => {
    if (!route.permission) return true;
    return hasWildcard || userPermissions.includes(route.permission);
  });
  return firstRoute?.path || '/no-access';
}

export function canAccessPath(pathname, userPermissions) {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (AUTHENTICATED_FALLBACK_ROUTES.includes(pathname)) return true;

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

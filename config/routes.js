import {
  AppstoreOutlined,
  BankOutlined,
  DashboardOutlined,
  InboxOutlined,
  SettingOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { PERMISSIONS } from '@/store/slices/authSlice';

/**
 * Cấu hình routing tập trung cho toàn bộ ứng dụng.
 *
 * Mỗi route có thể khai báo:
 *   - `path`        : URL path
 *   - `permission`  : permission cần có để truy cập (undefined = public)
 *   - `showInMenu`  : có hiển thị trong sidebar không
 *   - `icon`        : icon cho menu
 *   - `labelKey`    : key trong i18n dictionary (t('menu.xxx'))
 *   - `children`    : sub-routes (không show trong sidebar, chỉ dùng cho guard)
 */
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
    labelKey: 'menu.partners',
    children: [
      { path: '/partners/create', permission: PERMISSIONS.PARTNERS_CREATE },
      { path: '/partners/edit', permission: PERMISSIONS.PARTNERS_EDIT }
    ]
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
    labelKey: 'menu.settings',
    children: [
      { path: '/users/create', permission: PERMISSIONS.USERS_MANAGE },
      { path: '/users/edit', permission: PERMISSIONS.USERS_MANAGE }
    ]
  }
];

/** Các trang không cần authentication */
export const PUBLIC_ROUTES = ['/login'];

/**
 * Lấy menu items được phép hiển thị cho user dựa trên permissions.
 *
 * @param {string[]} userPermissions - Danh sách permissions của user
 * @param {Function} t              - Hàm dịch từ useLanguage()
 * @returns {Array} menuItems cho Ant Design Menu
 */
export function getAuthorizedMenuItems(userPermissions, t) {
  const hasWildcard = userPermissions.includes('*');

  return APP_ROUTES.filter((route) => {
    if (!route.showInMenu) return false;
    if (!route.permission) return true; // public menu item
    return hasWildcard || userPermissions.includes(route.permission);
  }).map((route) => ({
    key: route.path,
    icon: route.icon ? <route.icon /> : null,
    label: t(route.labelKey)
  }));
}

/**
 * Kiểm tra user có quyền truy cập path không.
 * Duyệt qua APP_ROUTES và children để tìm route phù hợp.
 *
 * @param {string} pathname        - Pathname hiện tại (từ usePathname)
 * @param {string[]} userPermissions
 * @returns {boolean}
 */
export function canAccessPath(pathname, userPermissions) {
  if (PUBLIC_ROUTES.includes(pathname)) return true;

  const hasWildcard = userPermissions.includes('*');
  if (hasWildcard) return true;

  for (const route of APP_ROUTES) {
    // Kiểm tra route cha
    if (pathname === route.path || pathname.startsWith(`${route.path}/`)) {
      // Kiểm tra children trước (more specific)
      const matchedChild = route.children?.find(
        (child) =>
          pathname === child.path || pathname.startsWith(`${child.path}/`)
      );

      const requiredPermission = matchedChild
        ? matchedChild.permission
        : route.permission;

      if (!requiredPermission) return true;
      return userPermissions.includes(requiredPermission);
    }
  }

  // Path không tìm thấy trong config → không cho truy cập
  return false;
}

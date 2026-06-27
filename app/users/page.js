'use client';

import {
  Alert, Button, Card, Form, Input, Modal, Popconfirm,
  Select, Space, Switch, Table, Tabs, Tag, App
} from 'antd';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import { useAppSelector } from '@/store/hooks';
import { selectHasPermission, selectHasRole, PERMISSIONS, ROLES } from '@/store/slices/authSlice';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
  useGetBranchesQuery,
  useGetPermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation
} from '@/store/services/adminExtApi';
import { getApiError } from '@/utils/getApiError';

const ROLE_LABELS = {
  en: {
    SUPER_ADMIN: 'Super Administrator',
    ADMIN: 'Administrator',
    MANAGER: 'Manager',
    ACCOUNTANT: 'Accountant',
    OPERATION: 'Operations',
    STAFF: 'Staff',
    VIEWER: 'Viewer'
  },
  vi: {
    SUPER_ADMIN: 'Quản trị hệ thống',
    ADMIN: 'Quản trị viên',
    MANAGER: 'Quản lý',
    ACCOUNTANT: 'Kế toán',
    OPERATION: 'Nhân viên vận hành',
    STAFF: 'Nhân viên',
    VIEWER: 'Chỉ xem'
  }
};

function formatRoleLabel(roleName, language) {
  const name = String(roleName || '').trim();
  const roleCode = name.toUpperCase().replace(/[\s-]+/g, '_');
  const translated = ROLE_LABELS[language]?.[roleCode];

  if (translated) return translated;
  if (!/^[A-Z0-9_-]+$/.test(name)) return name;

  return name
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function roleIdsFromUser(user) {
  return (user?.roles || []).map((role) => role.id || role.backendId).filter(Boolean);
}

function permissionIdsFromRole(role) {
  return (role?.permissions || []).map((permission) => permission.id || permission.backendId).filter(Boolean);
}

function isMasterAccount(record) {
  return ['admin', 'api.tester'].includes(record?.username);
}

export default function UsersPage() {
  const { t, language } = useLanguage();
  const { message } = App.useApp();
  const isHighestRole = useAppSelector(selectHasRole(ROLES.SUPER_ADMIN));
  const canManageUsers = useAppSelector(selectHasPermission(PERMISSIONS.USER_MANAGE)) && isHighestRole;
  const canManageRoles = useAppSelector(selectHasPermission(PERMISSIONS.ROLE_MANAGE)) && isHighestRole;
  const [userModal, setUserModal] = useState({ open: false, record: null });
  const [roleModal, setRoleModal] = useState({ open: false, record: null });
  const [blockModal, setBlockModal] = useState({ open: false, record: null });
  const [userForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [blockForm] = Form.useForm();

  const { data: users = [], isLoading: loadingUsers, error, refetch } = useGetUsersQuery();
  const { data: roles = [], isLoading: loadingRoles } = useGetRolesQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: permissions = [] } = useGetPermissionsQuery();

  const [createUser, { isLoading: isCreatingUser }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
  const [blockUser, { isLoading: isBlockingUser }] = useBlockUserMutation();
  const [unblockUser, { isLoading: isUnblockingUser }] = useUnblockUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [createRole, { isLoading: isCreatingRole }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const loading = loadingUsers || loadingRoles;
  const savingUser = isCreatingUser || isUpdatingUser;
  const savingRole = isCreatingRole || isUpdatingRole;
  const savingBlock = isBlockingUser || isUnblockingUser;

  const roleOptions = useMemo(
    () => roles.map((role) => ({ label: formatRoleLabel(role.name, language), value: role.backendId })),
    [roles, language]
  );
  const branchOptions = useMemo(
    () => branches.map((branch) => ({ label: `${branch.code} - ${branch.name}`, value: branch.backendId })),
    [branches]
  );
  const permissionOptions = useMemo(
    () => permissions.map((permission) => {
      const trans = t(`permissions.${permission.name}`);
      const label = trans !== `permissions.${permission.name}` ? trans : permission.name;
      return { label, value: permission.id };
    }),
    [permissions, t]
  );

  function openUserModal(record = null) {
    setUserModal({ open: true, record });
    userForm.setFieldsValue(
      record
        ? {
          username: record.username,
          email: record.email,
          fullName: record.fullName,
          branchId: record.branchId,
          canAccessAllBranches: Boolean(record.raw?.canAccessAllBranches),
          roleIds: roleIdsFromUser(record.raw),
          isActive: record.isActive
        }
        : { isActive: true, roleIds: [], canAccessAllBranches: false }
    );
  }

  function openRoleModal(record = null) {
    setRoleModal({ open: true, record });
    roleForm.setFieldsValue(
      record
        ? {
          name: record.name,
          description: record.raw?.description,
          permissionIds: permissionIdsFromRole(record.raw)
        }
        : { permissionIds: [] }
    );
  }

  function openBlockModal(record) {
    setBlockModal({ open: true, record });
    blockForm.setFieldsValue({ reason: record?.blockedReason || '' });
  }

  async function submitUser(values) {
    const payload = {
      username: values.username,
      email: values.email,
      fullName: values.fullName,
      branchId: values.branchId,
      canAccessAllBranches: Boolean(values.canAccessAllBranches),
      roleIds: values.roleIds || [],
      isActive: values.isActive
    };
    try {
      if (userModal.record) {
        delete payload.username;
        if (!values.password) delete payload.password;
        await updateUser({ id: userModal.record.backendId, ...payload }).unwrap();
        message.success(t('users.userUpdated'));
      } else {
        await createUser({ ...payload, password: values.password }).unwrap();
        message.success(t('users.userCreated'));
      }
      setUserModal({ open: false, record: null });
      userForm.resetFields();
    } catch (saveError) {
      message.error(getApiError(saveError, t, 'users.saveUserError'));
    }
  }

  async function submitRole(values) {
    const payload = {
      name: values.name,
      description: values.description,
      permissionIds: values.permissionIds || []
    };
    try {
      if (roleModal.record) {
        delete payload.name;
        await updateRole({ id: roleModal.record.backendId, ...payload }).unwrap();
        message.success(t('users.roleUpdated'));
      } else {
        await createRole(payload).unwrap();
        message.success(t('users.roleCreated'));
      }
      setRoleModal({ open: false, record: null });
      roleForm.resetFields();
    } catch (saveError) {
      message.error(getApiError(saveError, t, 'users.saveRoleError'));
    }
  }

  async function submitBlock(values) {
    if (!blockModal.record) return;
    try {
      await blockUser({
        id: blockModal.record.backendId,
        reason: values.reason
      }).unwrap();
      message.success(t('users.userBlocked'));
      setBlockModal({ open: false, record: null });
      blockForm.resetFields();
    } catch (saveError) {
      message.error(saveError?.data?.message || t('users.blockUserError'));
    }
  }

  function renderUserStatus(record) {
    if (!record.isActive) {
      return <Tag color="red">{t('users.deactivated')}</Tag>;
    }
    if (record.isBlocked) {
      return <Tag color="orange">{t('users.blocked')}</Tag>;
    }
    return <Tag color="green">{t('users.active')}</Tag>;
  }

  const userColumns = [
    { title: t('users.username'), dataIndex: 'username', key: 'username' },
    { title: t('users.fullName'), dataIndex: 'fullName', key: 'fullName' },
    { title: t('users.emailLabel'), dataIndex: 'email', key: 'email' },
    {
      title: t('users.branch'),
      dataIndex: 'branchId',
      key: 'branchId',
      render: (value, record) => record.raw?.canAccessAllBranches
        ? t('users.allBranches')
        : branches.find((branch) => branch.backendId === value)?.name || '-'
    },
    {
      title: t('users.roles'),
      dataIndex: 'roleNames',
      key: 'roleNames',
      render: (items = []) => (
        <Space wrap size={[4, 4]}>
          {items.map((role) => <Tag key={role}>{formatRoleLabel(role, language)}</Tag>)}
        </Space>
      )
    },
    {
      title: t('users.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (_value, record) => renderUserStatus(record)
    },
    {
      title: t('users.actions'),
      key: 'actions',
      align: 'right',
      render: (_, record) => {
        const protectedAccount = isMasterAccount(record);
        return (
          <Space>
            {canManageUsers ? (
              <>
                <Button size="small" icon={<EditOutlined />} title={t('users.edit')} onClick={() => openUserModal(record)} />
                {!protectedAccount && record.isActive && !record.isBlocked ? (
                  <Button
                    size="small"
                    icon={<PauseCircleOutlined />}
                    title={t('users.block')}
                    onClick={() => openBlockModal(record)}
                  />
                ) : null}
                {!protectedAccount && record.isActive && record.isBlocked ? (
                  <Popconfirm
                    title={t('users.unblockConfirm')}
                    okText={t('users.unblock')}
                    onConfirm={async () => {
                      try {
                        await unblockUser(record.backendId).unwrap();
                        message.success(t('users.userUnblocked'));
                      } catch (saveError) {
                        message.error(saveError?.data?.message || t('users.unblockUserError'));
                      }
                    }}
                  >
                    <Button size="small" icon={<CheckCircleOutlined />} title={t('users.unblock')} />
                  </Popconfirm>
                ) : null}
                {!protectedAccount ? (
                  <Popconfirm
                    title={t('users.deactivateConfirm')}
                    okText={t('users.deactivate')}
                    okButtonProps={{ danger: true }}
                    onConfirm={async () => {
                      try {
                        await deleteUser(record.backendId).unwrap();
                        message.success(t('users.userDeactivated'));
                      } catch (saveError) {
                        message.error(saveError?.data?.message || t('users.deactivateUserError'));
                      }
                    }}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} title={t('users.deactivate')} />
                  </Popconfirm>
                ) : null}
              </>
            ) : null}
          </Space>
        );
      }
    }
  ];

  const roleColumns = [
    {
      title: t('users.roleName'),
      dataIndex: 'name',
      key: 'name',
      render: (name) => formatRoleLabel(name, language)
    },
    { title: t('users.description'), dataIndex: 'description', key: 'description' },
    {
      title: t('users.permissions'),
      key: 'permissions',
      render: (_, record) => (
        <Space wrap size={[4, 4]}>
          {(record.raw?.permissions || []).slice(0, 6).map((permission) => {
            const trans = t(`permissions.${permission.name}`);
            const label = trans !== `permissions.${permission.name}` ? trans : permission.name;
            return <Tag key={permission.id}>{label}</Tag>;
          })}
          {(record.raw?.permissions || []).length > 6 ? <Tag>+{record.raw.permissions.length - 6}</Tag> : null}
        </Space>
      )
    },
    {
      title: t('users.actions'),
      key: 'actions',
      align: 'right',
      render: (_, record) => {
        const isUnassigned = !record.raw?.users?.length;
        return canManageRoles ? (
          <Space>
            <Button size="small" icon={<EditOutlined />} title={t('users.edit')} onClick={() => openRoleModal(record)} />
            {isUnassigned ? (
              <Popconfirm
                title={t('users.deleteRoleConfirm')}
                description={t('users.deleteRoleDescription')}
                okText={t('users.delete')}
                okButtonProps={{ danger: true }}
                onConfirm={async () => {
                  try {
                    await deleteRole(record.backendId).unwrap();
                    message.success(t('users.roleDeleted'));
                  } catch (err) {
                    message.error(err?.data?.message || t('users.deleteRoleError'));
                  }
                }}
              >
                <Button size="small" danger icon={<DeleteOutlined />} title={t('users.delete')} />
              </Popconfirm>
            ) : null}
          </Space>
        ) : null;
      }
    }
  ];

  return (
    <DashboardLayout>
      <div className="admin-page">
        <div className="shipment-page-header">
          <div>
            <h2>{t('users.title')}</h2>
            <p>{t('users.subtitle')}</p>
          </div>
          <Button icon={<ReloadOutlined />} onClick={refetch}>{t('users.refresh')}</Button>
        </div>

        {error ? <Alert type="error" showIcon message={t('users.loadError')} style={{ marginBottom: 16 }} /> : null}

        <Alert
          type="info"
          showIcon
          message={t('users.adminAssignmentTitle')}
          description={t('users.adminAssignmentDescription')}
          style={{ marginBottom: 16 }}
        />

        <Tabs
          items={[
            {
              key: 'users',
              label: `${t('users.usersTab')} (${users.length})`,
              children: (
                <Card className="table-card">
                  <div className="shipment-toolbar">
                    <span className="shipment-toolbar-total">{t('users.userAccounts')}</span>
                    {canManageUsers ? (
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => openUserModal()}>
                        {t('users.createUser')}
                      </Button>
                    ) : null}
                  </div>
                  <Table rowKey="id" loading={loading} columns={userColumns} dataSource={users} pagination={{ pageSize: 10 }} />
                </Card>
              )
            },
            {
              key: 'roles',
              label: `${t('users.rolesTab')} (${roles.length})`,
              children: (
                <Card className="table-card">
                  <div className="shipment-toolbar">
                    <span className="shipment-toolbar-total">{t('users.permissionGroups')}</span>
                    {canManageRoles ? (
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => openRoleModal()}>
                        {t('users.createRole')}
                      </Button>
                    ) : null}
                  </div>
                  <Table rowKey="id" loading={loading} columns={roleColumns} dataSource={roles} pagination={{ pageSize: 10 }} />
                </Card>
              )
            }
          ]}
        />

        <Modal
          title={userModal.record ? t('users.editUser') : t('users.createUser')}
          open={userModal.open}
          onCancel={() => setUserModal({ open: false, record: null })}
          onOk={() => userForm.submit()}
          confirmLoading={savingUser}
          destroyOnHidden
          width={720}
        >
          <Form form={userForm} layout="vertical" onFinish={submitUser}>
            <Form.Item name="username" label={t('users.username')} rules={[{ required: !userModal.record, message: t('users.usernameRequired') }]}>
              <Input disabled={Boolean(userModal.record)} />
            </Form.Item>
            <Form.Item name="email" label={t('users.emailLabel')} rules={[{ required: true, type: 'email', message: t('users.emailRequired') }]}>
              <Input />
            </Form.Item>
            <Form.Item name="fullName" label={t('users.fullName')}>
              <Input />
            </Form.Item>
            <Form.Item
              name="password"
              label={userModal.record ? t('users.newPassword') : t('users.password')}
              rules={[{ required: !userModal.record, min: 6, message: t('users.passwordMin') }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item name="canAccessAllBranches" label={t('users.branchScope')} valuePropName="checked">
              <Switch checkedChildren={t('users.allBranches')} unCheckedChildren={t('users.singleBranch')} />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, next) => prev.canAccessAllBranches !== next.canAccessAllBranches}>
              {({ getFieldValue }) => (
                <Form.Item name="branchId" label={t('users.branch')}>
                  <Select allowClear options={branchOptions} disabled={getFieldValue('canAccessAllBranches')} />
                </Form.Item>
              )}
            </Form.Item>
            <Form.Item name="roleIds" label={t('users.roles')}>
              <Select mode="multiple" allowClear options={roleOptions} />
            </Form.Item>
            <Form.Item name="isActive" label={t('users.activeLabel')} valuePropName="checked">
              <Switch disabled={isMasterAccount(userModal.record)} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={t('users.blockUserTitle')}
          open={blockModal.open}
          onCancel={() => setBlockModal({ open: false, record: null })}
          onOk={() => blockForm.submit()}
          confirmLoading={savingBlock}
          destroyOnHidden
        >
          <Form form={blockForm} layout="vertical" onFinish={submitBlock}>
            <Form.Item label={t('users.username')}>
              <Input value={blockModal.record?.username || ''} disabled />
            </Form.Item>
            <Form.Item
              name="reason"
              label={t('users.blockReason')}
              rules={[{ required: true, message: t('users.blockReasonRequired') }]}
            >
              <Input.TextArea rows={4} maxLength={500} showCount />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={roleModal.record ? t('users.editRole') : t('users.createRole')}
          open={roleModal.open}
          onCancel={() => setRoleModal({ open: false, record: null })}
          onOk={() => roleForm.submit()}
          confirmLoading={savingRole}
          destroyOnHidden
          width={760}
        >
          <Form form={roleForm} layout="vertical" onFinish={submitRole}>
            <Form.Item name="name" label={t('users.roleName')} rules={[{ required: !roleModal.record, message: t('users.roleNameRequired') }]}>
              <Input disabled={Boolean(roleModal.record)} />
            </Form.Item>
            <Form.Item name="description" label={t('users.description')}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="permissionIds" label={t('users.permissions')}>
              <Select mode="multiple" allowClear options={permissionOptions} optionFilterProp="label" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

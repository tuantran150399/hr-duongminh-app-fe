'use client';

import {
  Alert, Button, Card, Form, Input, Modal, Popconfirm,
  Select, Space, Switch, Table, Tabs, Tag, message
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
  useGetBranchesQuery,
  useGetPermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation
} from '@/store/services/adminExtApi';

function roleIdsFromUser(user) {
  return (user?.roles || []).map((role) => role.id || role.backendId).filter(Boolean);
}

function permissionIdsFromRole(role) {
  return (role?.permissions || []).map((permission) => permission.id || permission.backendId).filter(Boolean);
}

export default function UsersPage() {
  const { t } = useLanguage();
  const [userModal, setUserModal] = useState({ open: false, record: null });
  const [roleModal, setRoleModal] = useState({ open: false, record: null });
  const [userForm] = Form.useForm();
  const [roleForm] = Form.useForm();

  const { data: users = [], isLoading: loadingUsers, error, refetch } = useGetUsersQuery();
  const { data: roles = [], isLoading: loadingRoles } = useGetRolesQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: permissions = [] } = useGetPermissionsQuery();

  const [createUser, { isLoading: isCreatingUser }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [createRole, { isLoading: isCreatingRole }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateRoleMutation();

  const loading = loadingUsers || loadingRoles;
  const savingUser = isCreatingUser || isUpdatingUser;
  const savingRole = isCreatingRole || isUpdatingRole;

  const roleOptions = useMemo(
    () => roles.map((role) => ({ label: role.name, value: role.backendId })),
    [roles]
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
      message.error(saveError?.data?.message || t('users.saveUserError'));
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
      message.error(saveError?.data?.message || t('users.saveRoleError'));
    }
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
          {items.map((role) => <Tag key={role}>{role}</Tag>)}
        </Space>
      )
    },
    {
      title: t('users.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (value) => <Tag color={value ? 'green' : 'red'}>{value ? t('users.active') : t('users.locked')}</Tag>
    },
    {
      title: t('users.actions'),
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} title={t('users.edit')} onClick={() => openUserModal(record)} />
          <Popconfirm
            title={t('users.deactivateConfirm')}
            okText={t('users.deactivate')}
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              await deleteUser(record.backendId).unwrap();
              message.success(t('users.userDeactivated'));
            }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} title={t('users.deactivate')} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const roleColumns = [
    { title: t('users.roleName'), dataIndex: 'name', key: 'name' },
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
      render: (_, record) => <Button size="small" icon={<EditOutlined />} title={t('users.edit')} onClick={() => openRoleModal(record)} />
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
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openUserModal()}>
                      {t('users.createUser')}
                    </Button>
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
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openRoleModal()}>
                      {t('users.createRole')}
                    </Button>
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
              <Switch />
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

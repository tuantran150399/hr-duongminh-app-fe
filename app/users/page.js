'use client';

import {
  Alert, Button, Card, Form, Input, Modal, Popconfirm,
  Select, Space, Switch, Table, Tabs, Tag, message
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
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
    () => permissions.map((permission) => ({ label: permission.name, value: permission.id })),
    [permissions]
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
          roleIds: roleIdsFromUser(record.raw),
          isActive: record.isActive
        }
        : { isActive: true, roleIds: [] }
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
      roleIds: values.roleIds || [],
      isActive: values.isActive
    };
    try {
      if (userModal.record) {
        delete payload.username;
        if (!values.password) delete payload.password;
        await updateUser({ id: userModal.record.backendId, ...payload }).unwrap();
        message.success('User updated.');
      } else {
        await createUser({ ...payload, password: values.password }).unwrap();
        message.success('User created.');
      }
      setUserModal({ open: false, record: null });
      userForm.resetFields();
    } catch (saveError) {
      message.error(saveError?.data?.message || 'Unable to save user.');
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
        message.success('Role updated.');
      } else {
        await createRole(payload).unwrap();
        message.success('Role created.');
      }
      setRoleModal({ open: false, record: null });
      roleForm.resetFields();
    } catch (saveError) {
      message.error(saveError?.data?.message || 'Unable to save role.');
    }
  }

  const userColumns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Full name', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Branch',
      dataIndex: 'branchId',
      key: 'branchId',
      render: (value) => branches.find((branch) => branch.backendId === value)?.name || '-'
    },
    {
      title: 'Roles',
      dataIndex: 'roleNames',
      key: 'roleNames',
      render: (items = []) => (
        <Space wrap size={[4, 4]}>
          {items.map((role) => <Tag key={role}>{role}</Tag>)}
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (value) => <Tag color={value ? 'green' : 'red'}>{value ? 'Active' : 'Locked'}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openUserModal(record)}>Edit</Button>
          <Popconfirm
            title="Deactivate this user?"
            okText="Deactivate"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              await deleteUser(record.backendId).unwrap();
              message.success('User deactivated.');
            }}
          >
            <Button size="small" danger>Deactivate</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const roleColumns = [
    { title: 'Role', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Permissions',
      key: 'permissions',
      render: (_, record) => (
        <Space wrap size={[4, 4]}>
          {(record.raw?.permissions || []).slice(0, 6).map((permission) => (
            <Tag key={permission.id}>{permission.name}</Tag>
          ))}
          {(record.raw?.permissions || []).length > 6 ? <Tag>+{record.raw.permissions.length - 6}</Tag> : null}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => <Button size="small" onClick={() => openRoleModal(record)}>Edit</Button>
    }
  ];

  return (
    <DashboardLayout>
      <div className="admin-page">
        <div className="shipment-page-header">
          <div>
            <h2>Users & Roles</h2>
            <p>Manage accounts, role assignment, and permission groups.</p>
          </div>
          <Button icon={<ReloadOutlined />} onClick={refetch}>Refresh</Button>
        </div>

        {error ? <Alert type="error" showIcon message="Unable to load user administration data." style={{ marginBottom: 16 }} /> : null}

        <Tabs
          items={[
            {
              key: 'users',
              label: `Users (${users.length})`,
              children: (
                <Card className="table-card">
                  <div className="shipment-toolbar">
                    <span className="shipment-toolbar-total">User accounts</span>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openUserModal()}>
                      Create User
                    </Button>
                  </div>
                  <Table rowKey="id" loading={loading} columns={userColumns} dataSource={users} pagination={{ pageSize: 10 }} />
                </Card>
              )
            },
            {
              key: 'roles',
              label: `Roles (${roles.length})`,
              children: (
                <Card className="table-card">
                  <div className="shipment-toolbar">
                    <span className="shipment-toolbar-total">Permission groups</span>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openRoleModal()}>
                      Create Role
                    </Button>
                  </div>
                  <Table rowKey="id" loading={loading} columns={roleColumns} dataSource={roles} pagination={{ pageSize: 10 }} />
                </Card>
              )
            }
          ]}
        />

        <Modal
          title={userModal.record ? 'Edit User' : 'Create User'}
          open={userModal.open}
          onCancel={() => setUserModal({ open: false, record: null })}
          onOk={() => userForm.submit()}
          confirmLoading={savingUser}
          destroyOnHidden
          width={720}
        >
          <Form form={userForm} layout="vertical" onFinish={submitUser}>
            <Form.Item name="username" label="Username" rules={[{ required: !userModal.record, message: 'Username is required' }]}>
              <Input disabled={Boolean(userModal.record)} />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="fullName" label="Full name">
              <Input />
            </Form.Item>
            <Form.Item
              name="password"
              label={userModal.record ? 'New password' : 'Password'}
              rules={[{ required: !userModal.record, min: 6, message: 'Password must be at least 6 characters' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item name="branchId" label="Branch">
              <Select allowClear options={branchOptions} />
            </Form.Item>
            <Form.Item name="roleIds" label="Roles">
              <Select mode="multiple" allowClear options={roleOptions} />
            </Form.Item>
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={roleModal.record ? 'Edit Role' : 'Create Role'}
          open={roleModal.open}
          onCancel={() => setRoleModal({ open: false, record: null })}
          onOk={() => roleForm.submit()}
          confirmLoading={savingRole}
          destroyOnHidden
          width={760}
        >
          <Form form={roleForm} layout="vertical" onFinish={submitRole}>
            <Form.Item name="name" label="Role name" rules={[{ required: !roleModal.record, message: 'Role name is required' }]}>
              <Input disabled={Boolean(roleModal.record)} />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="permissionIds" label="Permissions">
              <Select mode="multiple" allowClear options={permissionOptions} optionFilterProp="label" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

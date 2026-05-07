'use client';

import { RightOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { useRouter } from 'next/navigation';

/**
 * PageHeader — component header dùng chung cho tất cả pages.
 *
 * Props:
 *   title       — Tiêu đề trang (required)
 *   subtitle    — Mô tả ngắn (optional)
 *   breadcrumbs — Mảng [{ label, path? }] (optional)
 *   actions     — ReactNode cho các action buttons (optional)
 *   level       — Typography heading level, default = 2
 *
 * Usage:
 *   <PageHeader
 *     title="Jobs"
 *     subtitle="Manage logistics jobs."
 *     actions={<Button type="primary">Create Job</Button>}
 *   />
 *
 *   <PageHeader
 *     title="Create Job"
 *     breadcrumbs={[{ label: 'Jobs', path: '/jobs' }, { label: 'Create' }]}
 *     actions={<Space><Button>Cancel</Button><Button type="primary">Save</Button></Space>}
 *   />
 */
export default function PageHeader({ title, subtitle, breadcrumbs, actions, level = 2 }) {
  const router = useRouter();

  return (
    <div className="page-header-component">
      <div className="page-header-left">
        {breadcrumbs?.length > 0 ? (
          <div className="page-header-breadcrumbs">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="page-header-crumb">
                {index > 0 ? <RightOutlined className="page-header-crumb-sep" /> : null}
                {crumb.path ? (
                  <a
                    className="page-header-crumb-link"
                    onClick={() => router.push(crumb.path)}
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="page-header-crumb-current">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        ) : null}
        <Typography.Title level={level} className="page-header-title">
          {title}
        </Typography.Title>
        {subtitle ? (
          <p className="page-header-subtitle">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </div>
  );
}

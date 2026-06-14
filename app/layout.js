import '@ant-design/v5-patch-for-react-19';
import { AppProviders } from '@/components/AppProviders';
import './globals.css';
import 'antd/dist/reset.css';
import favicon from '@/asset/image/favicon.ico';

export const metadata = {
  title: 'Dương Minh Logistics - ERP',
  description: 'Hệ thống quản lý nhân sự và vận hành Dương Minh Logistics'
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href={favicon.src} sizes="any" />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

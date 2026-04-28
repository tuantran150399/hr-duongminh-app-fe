import '@ant-design/v5-patch-for-react-19';
import { AppProviders } from '@/components/AppProviders';
import './globals.css';

export const metadata = {
  title: 'LogisticsPro - ERP',
  description: 'Internal ERP Logistics frontend demo'
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

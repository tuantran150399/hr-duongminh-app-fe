import { AntdRegistry } from '@ant-design/nextjs-registry';
import '@ant-design/v5-patch-for-react-19';
import { ConfigProvider } from 'antd';
import './globals.css';

export const metadata = {
  title: 'LogisticsPro - ERP',
  description: 'Internal ERP Logistics frontend demo'
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#0057c2',
                colorBgBase: '#f9f9f9',
                colorBgContainer: '#ffffff',
                fontFamily: '"Inter", sans-serif',
                borderRadius: 4,
              },
              components: {
                Button: {
                  colorPrimary: '#0057c2',
                  colorPrimaryHover: '#004398',
                  colorPrimaryActive: '#001a43',
                },
              },
            }}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

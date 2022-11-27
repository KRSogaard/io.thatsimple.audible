import React, { ReactNode } from 'react';
import { Layout } from 'antd';
import Header from './Header';
import { Outlet } from 'react-router-dom';

export const PageLayout = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header>
        <Header />
      </Layout.Header>
      <Layout.Content>
        <Outlet />
      </Layout.Content>
    </Layout>
  );
};

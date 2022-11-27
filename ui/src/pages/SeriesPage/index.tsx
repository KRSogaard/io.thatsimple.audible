import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLoaderData } from 'react-router-dom';
import { Breadcrumb, Layout } from 'antd';
import { SortedSeries } from './SeriesUtils';
import { SeriesMenu } from './components/SeriesMenu';

export const SeriesPage = () => {
  // const [loading, setLoading] = useState(true);

  // const seriesData: SortedSeries | null = useLoaderData() as SortedSeries | null;
  // useEffect(() => {
  //   setLoading(seriesData != null);
  //   if (seriesData) {
  //   } else {
  //   }
  // }, [seriesData]);

  return (
    <Layout>
      <Layout.Sider>
        <SeriesMenu />
      </Layout.Sider>
      <Layout.Content style={{ padding: '0 50px' }}>
        <Outlet />
      </Layout.Content>
    </Layout>
  );
};

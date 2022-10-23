import React, { useEffect } from 'react';
import { Layout, Menu, Skeleton, Breadcrumb, Space } from 'antd';
import { SeriesDataResponse } from '../../../services/AudibleService';
import { FaArchive, FaCheckDouble } from 'react-icons/fa';
import { BiPulse } from 'react-icons/bi';
import { Helmet } from 'react-helmet-async';
import { camelize } from '../../../utils/StringUtils';
import Series from './Series';

export interface Props {
  active: SeriesDataResponse[];
  completed: SeriesDataResponse[];
  archived: SeriesDataResponse[];
  myBooks: number[];
  onArchive: any;
  loading: boolean;
}

const Summary = (props: Props) => {
  let { active, completed, archived, loading, myBooks, onArchive } = props;
  let [activeMenu, setActiveMenu] = React.useState('active');
  let [series, setSeries] = React.useState<SeriesDataResponse[]>(active);

  useEffect(() => {
    switch (activeMenu) {
      case 'completed':
        setSeries(completed);
        break;
      case 'archived':
        setSeries(archived);
        break;
      default:
        setSeries(active);
        break;
    }
  }, [activeMenu, active, completed, archived]);

  useEffect(() => {
    setSeries(active);
  }, []);

  const onMenuSelect = (args: any) => {
    let { key } = args;
    setActiveMenu(key);
  };

  let menuItems = [
    {
      type: 'group',
      label: 'Series',
      key: 'series-menu',
      children: [
        { label: 'Active (' + active.length + ')', key: 'active', icon: <BiPulse /> },
        { label: 'Completed (' + completed.length + ')', key: 'completed', icon: <FaCheckDouble /> },
        { label: 'Archived (' + archived.length + ')', key: 'archived', icon: <FaArchive /> },
      ],
    },
    {
      type: 'group',
      key: 'stats-series-menu',
      label: (
        <span>
          <b>Series:</b> {active.length + completed.length + archived.length}
        </span>
      ),
    },
    {
      type: 'group',
      key: 'stats-books-menu',
      label: (
        <span>
          <b>Books:</b> {myBooks.length}
        </span>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>{activeMenu} audible series</title>
        <meta name="description" content="Welcome" />
      </Helmet>

      <Layout>
        <Layout.Sider>
          <Menu mode="inline" style={{ height: '100vh' }} theme="dark" defaultSelectedKeys={['active']} onSelect={onMenuSelect} items={menuItems} />
        </Layout.Sider>
        <Layout.Content style={{ padding: '0 50px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
            <Breadcrumb.Item href="/series">Series</Breadcrumb.Item>
            <Breadcrumb.Item>{camelize(activeMenu)}</Breadcrumb.Item>
          </Breadcrumb>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={'skeleton-' + i} active avatar={{ shape: 'square' }} paragraph={{ rows: 4 }} />)
          ) : (
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
              {series
                .sort((a: SeriesDataResponse, b: SeriesDataResponse) => {
                  if (!a.latestBook || !b.latestBook) {
                    return -1;
                  }
                  return a.latestBook.released < b.latestBook.released ? 1 : -1;
                })
                .map((s: SeriesDataResponse) => (
                  <Series key={'series-' + s.id} series={s} myBooks={myBooks} onArchive={onArchive} isArchived={archived.some((a) => a.id === s.id)} />
                ))}
            </Space>
          )}
        </Layout.Content>
      </Layout>
    </>
  );
};

export default Summary;

import React, { useEffect } from 'react';
import { Layout, Menu, Skeleton, Breadcrumb, Row, List } from 'antd';
import AudibleService, { SeriesDataResponse } from '../../../services/AudibleService';
import { FaArchive, FaCheckDouble } from 'react-icons/fa';
import { BiPulse } from 'react-icons/bi';
import { Helmet } from 'react-helmet-async';
import { camelize } from '../../../utils/StringUtils';
import { MenuItem } from '@mui/material';
import SeriesComponent from './Series';
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
  let [series, setSeries] = React.useState<SeriesDataResponse[]>([]);

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
  }, [activeMenu]);

  useEffect(() => {
    setSeries(active);
  }, []);

  const onMenuSelect = (args: any) => {
    let { key } = args;
    setActiveMenu(key);
  };

  return (
    <>
      <Helmet>
        <title>{activeMenu} audible series</title>
        <meta name="description" content="Welcome" />
      </Helmet>

      <Layout>
        <Layout.Sider>
          <Menu mode="inline" style={{ height: '100vh' }} theme="dark" defaultSelectedKeys={['active']} onSelect={onMenuSelect}>
            <Menu.ItemGroup title="Series">
              <Menu.Item key="active" icon={<BiPulse />}>
                Active
              </Menu.Item>
              <Menu.Item key="completed" icon={<FaCheckDouble />}>
                Completed
              </Menu.Item>
              <Menu.Item key="archived" icon={<FaArchive />}>
                Archived
              </Menu.Item>
            </Menu.ItemGroup>

            <Menu.Divider />
            <Menu.ItemGroup
              title={
                <span>
                  <b>Series:</b> {active.length + completed.length + archived.length}
                </span>
              }
            />
          </Menu>
        </Layout.Sider>
        <Layout.Content style={{ padding: '0 50px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
            <Breadcrumb.Item href="/series">Series</Breadcrumb.Item>
            <Breadcrumb.Item>{camelize(activeMenu)}</Breadcrumb.Item>
          </Breadcrumb>

          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton active avatar={{ shape: 'square' }} paragraph={{ rows: 4 }} />)
            : series.map((s: SeriesDataResponse) => (
                <Series key={s.id} series={s} myBooks={myBooks} onArchive={onArchive} isArchived={archived.some((a) => a.id === s.id)} />
              ))}
        </Layout.Content>
      </Layout>
    </>
  );
};

export default Summary;

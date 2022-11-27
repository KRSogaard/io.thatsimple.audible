import { Menu } from 'antd';
import { useEffect, useState } from 'react';
import { useLoaderData, useLocation } from 'react-router-dom';
import { SortedSeries } from '../SeriesUtils';
import { FaArchive, FaCheckDouble } from 'react-icons/fa';
import { BiPulse } from 'react-icons/bi';
import { Link } from 'react-router-dom';

export const SeriesMenu = () => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const seriesData: SortedSeries | null = useLoaderData() as SortedSeries | null;
  useEffect(() => {
    setLoading(seriesData != null);
    if (seriesData) {
    } else {
    }
  }, [seriesData]);

  let menuItems = [
    {
      type: 'group',
      label: 'Series',
      key: 'series-menu',
      children: [
        {
          label: <Link to="/series/active">Active ({seriesData?.activeSeries.length})</Link>,
          key: '/series/active',
          icon: <BiPulse />,
        },
        {
          label: <Link to="/series/completed">Completed ({seriesData?.completeSeries.length})</Link>,
          key: '/series/completed',
          icon: <FaCheckDouble />,
        },
        {
          label: <Link to="/series/archived">Archived ({seriesData?.archivedSeries.length})</Link>,
          key: '/series/archived',
          icon: <FaArchive />,
        },
      ],
    },
    {
      type: 'group',
      key: 'stats-series-menu',
      label: (
        <span>
          <b>Series:</b> {seriesData?.allSeries.length}
        </span>
      ),
    },
    {
      type: 'group',
      key: 'stats-books-menu',
      label: (
        <span>
          <b>Books:</b> {seriesData?.myBooks.length}
        </span>
      ),
    },
  ];
  return <Menu mode="inline" style={{ height: '100vh' }} theme="dark" defaultSelectedKeys={['active']} selectedKeys={[location.pathname]} items={menuItems} />;
};

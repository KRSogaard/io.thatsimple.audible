import { Breadcrumb, Skeleton, Space } from 'antd';
import { useEffect, useState } from 'react';
import { useRouteLoaderData } from 'react-router';
import AudibleService, { SeriesDataResponse } from '../../../services/AudibleService';
import Series from '../old-components/Series';
import { SortedSeries } from '../SeriesUtils';

export enum SeriesType {
  ACTIVE,
  COMPLETED,
  ARCHIVED,
}

interface IProps {
  seriesType: SeriesType;
}

export const SeriesList = ({ seriesType }: IProps) => {
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<SeriesDataResponse[]>([]);

  const seriesData: SortedSeries | null = useRouteLoaderData('series') as SortedSeries | null;
  useEffect(() => {
    if (seriesData) {
      switch (seriesType) {
        case SeriesType.ACTIVE:
          setSeries(seriesData.activeSeries);
          break;
        case SeriesType.COMPLETED:
          setSeries(seriesData.completeSeries);
          break;
        case SeriesType.ARCHIVED:
          setSeries(seriesData.archivedSeries);
          break;
      }
      setLoading(false);
    } else {
      setSeries([]);
      setLoading(true);
    }
  }, [seriesData, seriesType]);

  const changeArchiveStatus = async (seriesId: number, archived: boolean): Promise<void> => {
    let selectedSeries = null;
    if (!seriesData) {
      return;
    }

    setLoading(true);
    if (archived) {
      let seriesFilter = seriesData.allSeries.filter((s) => s.id === seriesId);
      if (seriesFilter.length < 1) {
        console.error('Could not find series', seriesId);
        return;
      }
      selectedSeries = seriesFilter[0];

      AudibleService.archiveSeries(seriesId);
      // Optimistinc remove for the current list
      setSeries(series.filter((s) => s.id !== seriesId));
      seriesData.completeSeries = seriesData.completeSeries.filter((s) => s.id !== seriesId);
      seriesData.activeSeries = seriesData.activeSeries.filter((s) => s.id !== seriesId);
      seriesData.archivedSeries = [...seriesData.archivedSeries, selectedSeries];
    } else {
      let seriesFilter = seriesData.archivedSeries.filter((s) => s.id === seriesId);
      if (seriesFilter.length < 1) {
        console.error('Was unable to find the seires');
        return;
      }
      selectedSeries = seriesFilter[0];
      AudibleService.unarchiveSeries(seriesId);

      setSeries(series.filter((s) => s.id !== seriesId));
      if (selectedSeries.books.filter((b) => !seriesData.myBooks.includes(b.id)).length === 0) {
        seriesData.completeSeries = [...seriesData.completeSeries, selectedSeries];
      } else {
        seriesData.activeSeries = [...seriesData.activeSeries, selectedSeries];
      }
    }
    setLoading(false);
  };

  return (
    <>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item href="/series">Series</Breadcrumb.Item>
        <Breadcrumb.Item>{seriesType === SeriesType.ACTIVE ? 'Active' : seriesType === SeriesType.COMPLETED ? 'Completed' : 'Archived'}</Breadcrumb.Item>
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
              <Series
                key={'series-' + s.id}
                series={s}
                myBooks={seriesData?.myBooks}
                onArchive={changeArchiveStatus}
                isArchived={seriesType === SeriesType.ARCHIVED}
              />
            ))}
        </Space>
      )}
    </>
  );
};

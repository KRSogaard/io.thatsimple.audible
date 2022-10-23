class AudibleService {
  private userToken: string | null;
  private userTokenExpires: number | null;
  private me: User | null;
  private baseUri = '/api';

  public constructor() {
    this.userToken = null;
    this.userTokenExpires = null;
    this.me = null;

    if (localStorage.getItem('userToken')) {
      this.userToken = localStorage.getItem('userToken');
      this.userTokenExpires = Number.parseInt(localStorage.getItem('userTokenExpires') as string);
      let me = localStorage.getItem('me');
      this.me = me ? JSON.parse(me) : null;
    } else if (sessionStorage.getItem('userToken')) {
      this.userToken = sessionStorage.getItem('userToken');
      this.userTokenExpires = Number.parseInt(sessionStorage.getItem('userTokenExpires') as string);
      let me = sessionStorage.getItem('me');
      this.me = me ? JSON.parse(me) : null;
    }
  }

  public getToken() {
    if (!this.userToken) {
      throw new Error('Not authenticated');
    }
    if (this.userTokenExpires && this.userTokenExpires < Date.now()) {
      return this.userToken;
    }
    throw new Error('Token expired');
  }

  public isAuthenticated(): boolean {
    try {
      this.getToken();
      return true;
    } catch (e) {
      return false;
    }
  }

  public async login(username: string, password: string, remember?: boolean): Promise<boolean> {
    const response = await fetch(this.baseUri + '/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    try {
      if (response.status === 200) {
        let responseJson = await response.json();
        console.log('Json: ', responseJson);
        this.userToken = responseJson.token;
        this.userTokenExpires = responseJson.expires;
        this.me = await this.getFetchMe();
        if (remember) {
          localStorage.setItem('userToken', this.userToken as string);
          localStorage.setItem('userTokenExpires', (this.userTokenExpires as number).toString());
          localStorage.setItem('me', JSON.stringify(this.me));
        } else {
          sessionStorage.setItem('userToken', this.userToken as string);
          sessionStorage.setItem('userTokenExpires', (this.userTokenExpires as number).toString());
          sessionStorage.setItem('me', JSON.stringify(this.me));
        }
        return true;
      }
    } catch (e) {
      console.error('Error: ', e);
    }
    return false;
  }

  public async register(username: string, password: string, email: string): Promise<boolean> {
    const response = await fetch(this.baseUri + '/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password, email: email }),
    });
    try {
      if (response.status === 200) {
        return true;
      }
    } catch (e) {
      console.error('Register Error: ', e);
    }
    return false;
  }

  public async getFetchMe(): Promise<User> {
    const response = await fetch(this.baseUri + '/user', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.getToken() },
    });
    return await response.json();
  }

  public getMe(): User {
    if (!this.me) {
      throw new Error('Not authenticated');
    }
    return this.me as User;
  }

  public async logout(): Promise<void> {
    this.userToken = null;
    localStorage.removeItem('userToken');
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('me');
  }

  public async getMyData(): Promise<MyData> {
    const response = await fetch(this.baseUri + '/my-series', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.getToken() },
    });
    let data = await response.json();
    let series: SeriesDataResponse[] = [];
    data.series.forEach((s: any) => {
      let latestBook = null;
      if (s.books.length > 1) {
        latestBook = s.books.sort((a: any, b: any) => b.released - a.released)[0];
      } else if (s.books.length === 1) {
        latestBook = s.books[0];
      } else {
        latestBook = null;
      }

      series.push({
        ...s,
        latestBook: latestBook,
      });
    });
    return {
      myBooks: data.myBooks,
      archivedSeries: data.archivedSeries,
      series: series,
    };
  }

  public getImageUrl(asin: string): string {
    return this.baseUri + '/image/' + asin + '.jpg';
  }

  public async archiveSeries(seriesId: number): Promise<boolean> {
    const response = await fetch(this.baseUri + '/user/archive/' + seriesId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.getToken() },
    });
    try {
      if (response.status === 200) {
        return true;
      }
    } catch (e) {
      console.error('Error: ', e);
    }
    return false;
  }

  public async unarchiveSeries(seriesId: number): Promise<boolean> {
    const response = await fetch(this.baseUri + '/user/archive/' + seriesId, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.getToken() },
    });
    try {
      if (response.status === 200) {
        return true;
      }
    } catch (e) {
      console.error('Error: ', e);
    }
    return false;
  }

  public async getJobs(): Promise<Job[]> {
    const response = await fetch(this.baseUri + '/user/jobs', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.getToken() },
    });
    return await response.json();
  }

  public async requestDownload(bookUrl: string) {
    const response = await fetch(this.baseUri + '/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.getToken() },
      body: JSON.stringify({ bookUrl: bookUrl }),
    });
    try {
      if (response.status === 200) {
        return true;
      }
    } catch (e) {
      console.error('Error: ', e);
    }
    return false;
  }
}

export default new AudibleService();

export interface MyData {
  myBooks: number[];
  archivedSeries: number[];
  series: SeriesDataResponse[];
}
export interface SeriesDataResponse {
  id: number;
  asin: string;
  name: string;
  link: string;
  summary: string;
  books: BookDataResponse[];
  latestBook?: BookDataResponse;
}
export interface BookDataResponse {
  id: number;
  asin: string;
  title: string;
  link: string;
  length: number;
  summary: string;
  released: number;
  authors: AuthorDataResponse[];
  tags: string[];
  narrators: NarratorDataResponse[];
}
export interface AuthorDataResponse {
  id: number;
  asin: string;
  name: string;
  link: string;
}
export interface NarratorDataResponse {
  id: number;
  name: string;
}
export interface Job {
  id: number;
  created: number;
  type: string;
  payload: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  created: number;
}

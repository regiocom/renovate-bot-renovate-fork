import fs from 'fs';
import * as httpMock from '../../../test/httpMock';
import { DATASOURCE_FAILURE } from '../../constants/error-messages';
import { getReleases } from '.';

let res1 = fs.readFileSync(
  'lib/datasource/cdnjs/__fixtures__/d3-force.json',
  'utf8'
);
res1 = JSON.parse(res1);

let res2 = fs.readFileSync(
  'lib/datasource/cdnjs/__fixtures__/bulma.json',
  'utf8'
);
res2 = JSON.parse(res2);

const baseUrl = 'https://api.cdnjs.com/';

const pathFor = (s: string): string =>
  `/libraries/${s.split('/').shift()}?fields=homepage,repository,assets`;

describe('datasource/cdnjs', () => {
  describe('getReleases', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      httpMock.setup();
    });

    afterEach(() => {
      httpMock.reset();
    });

    it('throws for empty result', async () => {
      httpMock.scope(baseUrl).get(pathFor('foo/bar')).reply(200, null);
      await expect(getReleases({ lookupName: 'foo/bar' })).rejects.toThrow(
        DATASOURCE_FAILURE
      );
      expect(httpMock.getTrace()).toMatchSnapshot();
    });
    it('throws for error', async () => {
      httpMock.scope(baseUrl).get(pathFor('foo/bar')).replyWithError('error');
      await expect(getReleases({ lookupName: 'foo/bar' })).rejects.toThrow(
        DATASOURCE_FAILURE
      );
      expect(httpMock.getTrace()).toMatchSnapshot();
    });
    it('returns null for 404', async () => {
      httpMock.scope(baseUrl).get(pathFor('foo/bar')).reply(404);
      expect(await getReleases({ lookupName: 'foo/bar' })).toBeNull();
      expect(httpMock.getTrace()).toMatchSnapshot();
    });
    it('returns null for empty 200 OK', async () => {
      httpMock
        .scope(baseUrl)
        .get(pathFor('doesnotexist/doesnotexist'))
        .reply(200, {});
      expect(
        await getReleases({ lookupName: 'doesnotexist/doesnotexist' })
      ).toBeNull();
      expect(httpMock.getTrace()).toMatchSnapshot();
    });
    it('throws for 401', async () => {
      httpMock.scope(baseUrl).get(pathFor('foo/bar')).reply(401);
      await expect(getReleases({ lookupName: 'foo/bar' })).rejects.toThrow(
        DATASOURCE_FAILURE
      );
      expect(httpMock.getTrace()).toMatchSnapshot();
    });
    it('throws for 429', async () => {
      httpMock.scope(baseUrl).get(pathFor('foo/bar')).reply(429);
      await expect(getReleases({ lookupName: 'foo/bar' })).rejects.toThrow(
        DATASOURCE_FAILURE
      );
      expect(httpMock.getTrace()).toMatchSnapshot();
    });
    it('throws for 5xx', async () => {
      httpMock.scope(baseUrl).get(pathFor('foo/bar')).reply(502);
      await expect(getReleases({ lookupName: 'foo/bar' })).rejects.toThrow(
        DATASOURCE_FAILURE
      );
      expect(httpMock.getTrace()).toMatchSnapshot();
    });
    it('returns null for unknown error', async () => {
      httpMock.scope(baseUrl).get(pathFor('foo/bar')).replyWithError('error');
      await expect(getReleases({ lookupName: 'foo/bar' })).rejects.toThrow(
        DATASOURCE_FAILURE
      );
      expect(httpMock.getTrace()).toMatchSnapshot();
    });
    it('processes real data', async () => {
      httpMock
        .scope(baseUrl)
        .get(pathFor('d3-force/d3-force.js'))
        .reply(200, res1);
      const res = await getReleases({ lookupName: 'd3-force/d3-force.js' });
      expect(res).toMatchSnapshot();
      expect(httpMock.getTrace()).toMatchSnapshot();
    });
    it('filters releases by asset presence', async () => {
      httpMock
        .scope(baseUrl)
        .get(pathFor('bulma/only/0.7.5/style.css'))
        .reply(200, res2);
      const res = await getReleases({
        lookupName: 'bulma/only/0.7.5/style.css',
      });
      expect(res).toMatchSnapshot();
      expect(httpMock.getTrace()).toMatchSnapshot();
    });
  });
});

import { Request, Response, NextFunction } from 'express';

interface query {
  [key: string]: string;
}

const pureStringProperties = ['searchTerm'];

const parseQueryProperty = (query: query, property: string) => {
  if (pureStringProperties.includes(property)) {
    return query[property];
  }

  try {
    return JSON.parse(query[property]);
  } catch (e) {
    return query[property];
  }
};

export const parseQuery = (req: Request<{}, {}, {}, {}>, _res: Response, next: NextFunction) => {
  req.query = Object.keys(req.query).reduce(
    (parsedQuery: query, key: string) => ({
      ...parsedQuery,
      [key]: parseQueryProperty(req.query, key),
    }),
    {}
  );

  next();
};

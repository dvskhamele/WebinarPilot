import app from '../../server/app';
import serverless from 'serverless-http';

export const handler = serverless(app);

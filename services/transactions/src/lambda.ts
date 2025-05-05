import serverless from 'serverless-http';
import createApp from './app';
import getConfig from '../lib/config';

const app = createApp();

const serverlessHandler = serverless(app);

interface APIGatewayProxyResult {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  body: string;
}

interface Context {
  awsRequestId: string;
  functionName: string;
}

// eslint-disable-next-line import/prefer-default-export
export const handler = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const response = (await serverlessHandler(event, context)) as APIGatewayProxyResult;

  if (!response.headers) {
    response.headers = {};
  }

  // Add CORS headers
  response.headers['Access-Control-Allow-Origin'] = getConfig().BASE_APP_URL;
  response.headers['Access-Control-Allow-Credentials'] = 'true';
  response.headers['Access-Control-Allow-Headers'] =
    'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token';
  response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS';

  return response;
};

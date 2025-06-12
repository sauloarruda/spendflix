import getLogger from '@/common/logger';
import insightsService from '@/modules/insights';
import { NextRequest } from 'next/server';

import { checkToken } from '@/actions/serverActions';

import userService from '../../../../../modules/users/user.service';

const logger = getLogger().child({ module: 'insights-stream' });

export async function GET(req: NextRequest) {
  // Set headers for Server-Sent Events
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };

  logger.debug('Starting insights stream...');

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const sessionCookie = req.cookies.get('session')?.value;
        const tokenPayload = await checkToken(sessionCookie);
        logger.debug({ tokenPayload }, 'Sessioncookie');
        const user = await userService.findByCognitoId(tokenPayload.sub!);
        if (!user) throw Error('User not found');
        // Generate content
        logger.debug({ user }, 'Generating content for user...');
        const contentStream = await insightsService.monthly(user.id);
        logger.debug('Content generation started');

        // Process and send content
        const iterator = contentStream[Symbol.asyncIterator]();

        const processNext = async () => {
          const { done, value } = await iterator.next();
          if (done) {
            logger.debug('Content generation completed, sending completion message');
            controller.enqueue(`data: ${JSON.stringify({ complete: true })}\n\n`);
            return;
          }

          if (value.text) {
            logger.debug('Sending chunk');
            controller.enqueue(`data: ${JSON.stringify({ insightsChunk: value.text })}\n\n`);
          }

          await processNext();
        };

        await processNext();
        logger.debug('Content streaming completed');
      } catch (error) {
        logger.error({ error }, 'Error in stream processing:');
        controller.enqueue(`data: ${JSON.stringify({ error: 'Failed to process insights' })}\n\n`);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}

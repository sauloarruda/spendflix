// import { NextResponse } from 'next/server';
import getLogger from '@/common/logger';
import generateContent from '@/modules/insights';

const logger = getLogger().child({ module: 'insights-stream' });

export async function GET() {
  // const { searchParams } = new URL(request.url);
  // const token = searchParams.get('token');
  // const date = searchParams.get('date');

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
        // Generate content
        logger.debug('Generating content...');
        const contentStream = await generateContent();
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

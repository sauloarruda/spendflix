// import { NextResponse } from 'next/server';
import generateContent from '@/modules/insights';

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

  console.log('Starting insights stream...');

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      let keepAliveInterval;
      let isControllerClosed = false;
      try {
        // Send a keep-alive message every 10 seconds to prevent timeout
        keepAliveInterval = setInterval(() => {
          if (!isControllerClosed) {
            console.log('Sending keep-alive message');
            try {
              controller.enqueue('data: {"keepAlive": true}\n\n');
            } catch (e) {
              console.error('Error sending keep-alive:', e);
              isControllerClosed = true;
              if (keepAliveInterval) clearInterval(keepAliveInterval);
            }
          }
        }, 10000);

        console.log('Calling generateContent...');
        // Call generateContent to get the stream response
        const response = await generateContent();
        console.log('Received response from generateContent');
        // Use a function to handle streaming chunks
        const handleStream = async () => {
          try {
            const iterator = response[Symbol.asyncIterator]();
            let next;
            let chunkCount = 0;
            do {
              if (isControllerClosed) break;
              next = await iterator.next();
              if (next.done) break;
              const chunk = next.value;
              if (chunk.text && !isControllerClosed) {
                chunkCount += 1;
                console.log(`Sending chunk ${chunkCount}`);
                const data = JSON.stringify({ insightsChunk: chunk.text });
                try {
                  controller.enqueue(`data: ${data}\n\n`);
                } catch (e) {
                  console.error('Error enqueuing chunk:', e);
                  isControllerClosed = true;
                  break;
                }
              }
            } while (!next.done);
            console.log(`Finished streaming. Total chunks sent: ${chunkCount}`);
          } catch (streamError) {
            console.error('Error during streaming:', streamError);
            if (!isControllerClosed) {
              const errorData = JSON.stringify({
                error: 'Streaming error',
                details: streamError.toString(),
              });
              try {
                controller.enqueue(`data: ${errorData}\n\n`);
              } catch (e) {
                console.error('Error enqueuing error data:', e);
                isControllerClosed = true;
              }
            }
          }
        };
        await handleStream();
      } catch (error) {
        console.error('Error generating insights:', error);
        if (!isControllerClosed) {
          const errorData = JSON.stringify({
            error: 'Failed to generate insights',
            details: error.toString(),
          });
          try {
            controller.enqueue(`data: ${errorData}\n\n`);
          } catch (e) {
            console.error('Error enqueuing error data:', e);
            isControllerClosed = true;
          }
        }
      } finally {
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          console.log('Cleared keep-alive interval');
        }
        console.log('Closing insights stream');
        if (!isControllerClosed) {
          try {
            controller.close();
          } catch (closeError) {
            console.error('Error closing controller:', closeError);
            isControllerClosed = true;
          }
        }
      }
    },
  });

  return new Response(stream, { headers });
}

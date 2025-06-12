import { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

function InsightsContent({ insights }: { insights: string }) {
  return (
    <>
      <div className="flex border-b-1 p-2 items-center mb-4">
        <h1 className="text-2xl flex-grow-1">Insights</h1>
      </div>
      <div className="ai-md">
        <ReactMarkdown>{insights}</ReactMarkdown>
      </div>
    </>
  );
}

export function InsightsReport() {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Use useCallback to memoize the update function
  const updateInsights = useCallback((chunk: string) => {
    setInsights((prev) => {
      const newInsights = prev + chunk;
      // Force a re-render by creating a new string
      return newInsights;
    });
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      if (eventSource) {
        eventSource.close();
      }

      setLoading(true);
      setError(null);
      setInsights('');

      eventSource = new EventSource('/api/insights');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.insightsChunk) {
            updateInsights(data.insightsChunk);
          } else if (data.complete) {
            // console.log('Stream completed successfully');
            setLoading(false);
            eventSource?.close();
          } else if (data.error) {
            setError(data.error);
            eventSource?.close();
          }
        } catch (err) {
          console.error('Error parsing message:', err);
          setError('Failed to parse insights data');
          eventSource?.close();
        }
      };

      eventSource.onerror = (eventError) => {
        // Only treat as error if we haven't received any data
        if (insights.length === 0) {
          console.error({ eventError }, 'SSE connection error');
          setError('Connection error');
        } else {
          console.log('SSE connection closed after receiving data');
          setLoading(false);
        }
        eventSource?.close();
      };

      eventSource.onopen = () => {
        console.log('SSE connection opened');
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [updateInsights]);

  if (error) return <div>Erro: {error}</div>;
  if (loading && !insights) return <div>Gerando insights...</div>;
  if (!insights) return <div>Não temos insights para este mês</div>;

  return <InsightsContent insights={insights} />;
}

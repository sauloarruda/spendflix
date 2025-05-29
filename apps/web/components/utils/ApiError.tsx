interface ApiErrorProps {
  error?: string;
}

export default function ApiError({ error }: ApiErrorProps) {
  return error ? <div className="text-red-500 mb-4 max-w-md mx-auto">{error}</div> : null;
}

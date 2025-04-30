interface ApiErrorProps {
  error?: string;
}

export default function ApiError({ error }: ApiErrorProps) {
  return error ? <div className="text-red-500 my-8">{error}</div> : null;
}

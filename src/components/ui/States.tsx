import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16" role="status" aria-label={message}>
      <Loader2 className="h-8 w-8 animate-spin text-accent-500 mb-3" />
      <p className="text-navy-500 text-sm">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
        <span className="text-red-500 text-xl">!</span>
      </div>
      <p className="text-navy-700 font-medium mb-1">Something went wrong</p>
      <p className="text-navy-500 text-sm mb-4 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-accent-600 bg-accent-50 rounded-lg hover:bg-accent-100 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, icon }: { title: string; description: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-3 text-navy-300">{icon}</div>}
      <p className="text-navy-700 font-medium mb-1">{title}</p>
      <p className="text-navy-500 text-sm max-w-md">{description}</p>
    </div>
  );
}

interface LoadingScreenProps {
  message: string
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-primary-500 rounded-full animate-spin mx-auto"></div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">{message}</h2>
          <p className="text-gray-400 text-sm">Please wait...</p>
        </div>
      </div>
    </div>
  )
}

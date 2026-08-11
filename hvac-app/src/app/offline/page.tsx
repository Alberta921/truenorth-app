export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#193140]">
      <div>
        <h1 className="text-white text-xl font-bold mb-2">No connection</h1>
        <p className="text-blue-200 text-sm max-w-xs mx-auto">
          Anything you've already opened still works. New maintenance entries
          save on your device and sync automatically once you're back online.
        </p>
      </div>
    </div>
  )
}

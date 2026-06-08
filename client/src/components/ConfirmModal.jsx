export default function ConfirmModal({
  isOpen,
  title        = 'Are you sure?',
  message      = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  onConfirm,
  onCancel,
  danger       = true,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center
                    justify-center p-4 animate-fadeIn">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-teal/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl
                      shadow-teal-lg border border-teal-100
                      p-6 animate-scaleIn">

        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center
                        justify-center text-2xl mb-4 mx-auto
                        ${danger ? 'bg-red-50' : 'bg-teal-50'}`}>
          {danger ? '⚠️' : '❓'}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-teal font-playfair
                       text-center mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-teal-500 text-center mb-6">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 font-semibold rounded-xl px-5 py-2.5
                       transition-all duration-200 ${
                         danger
                           ? 'bg-red-600 hover:bg-red-700 text-white'
                           : 'btn-primary'
                       }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
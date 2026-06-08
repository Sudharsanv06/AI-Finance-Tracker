export default function EmptyState({
  icon     = '📭',
  title    = 'Nothing here yet',
  description = 'Get started by creating your first item.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center
                    py-16 px-4 text-center animate-fadeIn">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 border
                      border-teal-100 flex items-center justify-center
                      text-3xl mb-4">
        {icon}
      </div>

      <h3 className="text-lg font-bold text-teal font-playfair mb-2">
        {title}
      </h3>

      <p className="text-sm text-teal-400 max-w-xs mb-6">
        {description}
      </p>

      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
}
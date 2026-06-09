export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null;

  const { page, pages, total, limit, hasNext, hasPrev } = pagination;

  // Build page numbers to show
  const getPageNumbers = () => {
    const nums = [];
    if (pages <= 5) {
      for (let i = 1; i <= pages; i++) nums.push(i);
    } else {
      nums.push(1);
      if (page > 3)          nums.push('...');
      if (page > 2)          nums.push(page - 1);
      if (page !== 1 && page !== pages) nums.push(page);
      if (page < pages - 1)  nums.push(page + 1);
      if (page < pages - 2)  nums.push('...');
      nums.push(pages);
    }
    return [...new Set(nums)];
  };

  const btnBase =
    'w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center';

  return (
    <div className="flex flex-col sm:flex-row items-center
                    justify-between gap-3 pt-4">

      {/* Info text */}
      <p className="text-xs text-teal-400 order-2 sm:order-1">
        Showing{' '}
        <span className="font-semibold text-teal">
          {(page - 1) * limit + 1}–{Math.min(page * limit, total)}
        </span>{' '}
        of{' '}
        <span className="font-semibold text-teal">{total}</span>{' '}
        expenses
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1 order-1 sm:order-2">

        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          className={`${btnBase} ${
            hasPrev
              ? 'bg-white border border-teal-200 text-teal hover:bg-teal-50'
              : 'bg-teal-50 text-teal-300 cursor-not-allowed'
          }`}
        >
          ←
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((num, i) =>
          num === '...' ? (
            <span key={`dots-${i}`}
                  className="w-9 h-9 flex items-center justify-center
                             text-teal-300 text-sm">
              ···
            </span>
          ) : (
            <button
              key={num}
              onClick={() => onPageChange(num)}
              className={`${btnBase} ${
                num === page
                  ? 'bg-teal text-cream shadow-teal-sm'
                  : 'bg-white border border-teal-200 text-teal hover:bg-teal-50'
              }`}
            >
              {num}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className={`${btnBase} ${
            hasNext
              ? 'bg-white border border-teal-200 text-teal hover:bg-teal-50'
              : 'bg-teal-50 text-teal-300 cursor-not-allowed'
          }`}
        >
          →
        </button>
      </div>
    </div>
  );
}
export default function PaginationBar({ page, totalPages, onPageChange }) {
  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <button
        className="btn btn-outline-secondary"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
      >Previous Page
      </button>
      <div>Page {page} / {Math.max(1, totalPages)}</div>
      <button
        className="btn btn-outline-secondary"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >Next Page
      </button>
    </div>
  )
}
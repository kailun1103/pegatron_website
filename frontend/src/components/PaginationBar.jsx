import { useState, useEffect } from 'react'

export default function PaginationBar({ page, totalPages, onPageChange }) {
  const [currentPage, setCurrentPage] = useState(page)

  useEffect(() => {
    setCurrentPage(page)
  }, [page])

  const handlePrevious = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      onPageChange(newPage)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      onPageChange(newPage)
    }
  }

  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <button
        className="btn btn-outline-secondary"
        onClick={handlePrevious}
        disabled={currentPage <= 1}
      >
        Previous Page
      </button>
      <div>Page {currentPage} / {Math.max(1, totalPages)}</div>
      <button
        className="btn btn-outline-secondary"
        onClick={handleNext}
        disabled={currentPage >= totalPages}
      >
        Next Page
      </button>
    </div>
  )
}
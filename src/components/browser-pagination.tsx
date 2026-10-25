"use client";

import { Pagination } from "react-bootstrap";

const ITEMS_PER_PAGE = 12;

type Props = {
  currentPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  perPage?: number;
};

export function BrowserPagination({
  currentPage,
  totalItems,
  onPageChange,
  perPage = ITEMS_PER_PAGE,
}: Props) {
  const totalPages = Math.ceil(totalItems / perPage);

  if (totalPages <= 1) return null;

  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);

  let startPage = Math.max(1, currentPage - half);
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const pages: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="d-flex justify-content-center mt-4">
      <Pagination className="mb-0">
        <Pagination.First
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        />
        <Pagination.Prev
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />

        {startPage > 1 && (
          <>
            <Pagination.Item onClick={() => onPageChange(1)}>1</Pagination.Item>
            {startPage > 2 && <Pagination.Ellipsis disabled />}
          </>
        )}

        {pages.map((page) => (
          <Pagination.Item
            key={page}
            active={page === currentPage}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Pagination.Item>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <Pagination.Ellipsis disabled />}
            <Pagination.Item onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </Pagination.Item>
          </>
        )}

        <Pagination.Next
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
        <Pagination.Last
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    </div>
  );
}

export { ITEMS_PER_PAGE };

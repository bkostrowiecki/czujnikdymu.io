"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { usePocketBase } from "@/app/shared/pocketbase-client-provider";

export function ClearSavedFiltersButton({ userId }: { userId: string }) {
  const pb = usePocketBase();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClear = async () => {
    if (!confirm("Czy na pewno chcesz usunąć zapisane filtry wyszukiwania?")) {
      return;
    }

    setIsLoading(true);
    try {
      await pb.collection("users").update(userId, {
        searchFilters: null,
      });
      router.refresh();
    } catch (err) {
      console.error("Błąd podczas czyszczenia filtrów:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline-danger"
      size="sm"
      onClick={handleClear}
      disabled={isLoading}
      className="d-inline-flex align-items-center gap-1"
    >
      {isLoading ? (
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      ) : (
        <i className="bi bi-trash3" />
      )}
      {isLoading ? "Usuwanie..." : "Wyczyść filtry"}
    </Button>
  );
}

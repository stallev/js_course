import { PlaceholderUser, searchUsers } from "@/app/utils/dataAPI";
import { useEffect, useMemo, useState } from "react";
import { debounce } from "@/app/utils/dataTransform";

export const useDebounceUsersSearch = (query: string) => {
  const [users, setUsers] = useState<PlaceholderUser[]>([]);

  const debouncedSearch = useMemo(
    () =>
      debounce((q: string) => {
        void searchUsers(q).then(setUsers);
      }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return users;
};

export function useDebouncedUsersSearch(query: string, delay = 300): PlaceholderUser[] {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [users, setUsers] = useState<PlaceholderUser[]>([]);

  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedQuery(query), delay);
    return () => clearTimeout(timerId);
  }, [query, delay]);

  useEffect(() => {
    void searchUsers(debouncedQuery).then(setUsers);
  }, [debouncedQuery]);

  return users;
}

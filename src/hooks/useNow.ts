import { useQuery } from '@tanstack/react-query'

/**
 * Single source of truth for "now" — the live clock, ticking every second
 * via React Query.
 */
export function useNow(): Date {
  const { data } = useQuery({
    queryKey: ['clock'],
    queryFn: () => Date.now(),
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
    initialData: () => Date.now(),
  })

  return new Date(data)
}

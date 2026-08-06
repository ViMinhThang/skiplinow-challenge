"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useInvalidatingMutation<TArgs, TResult>(
  queryKey: readonly unknown[],
  mutationFn: (args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

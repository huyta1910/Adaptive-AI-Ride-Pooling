import { useMutation, useQueryClient } from "@tanstack/react-query";
import { driverQueryKeys } from "@/features/driver/constants";
import { completePool } from "@/features/driver/poolService";

interface CompletePoolVariables {
  groupId: string;
}

export function useCompletePool(driverId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId }: CompletePoolVariables) => completePool(driverId, groupId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: driverQueryKeys.all });
    },
  });
}

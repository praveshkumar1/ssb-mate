import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachService } from '@/services/coachService';
import { testService } from '@/services/testService';
import { Coach } from '@/types';

// Test API hooks
export const useHello = () => {
  return useQuery({
    queryKey: ['hello'],
    queryFn: testService.hello,
  });
};

export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: testService.health,
  });
};

// Coach API hooks
export const useCoaches = () => {
  return useQuery({
    queryKey: ['coaches'],
    queryFn: coachService.getAllCoaches,
  });
};

export const useVerifiedCoaches = () => {
  return useQuery({
    queryKey: ['coaches', 'verified'],
    queryFn: coachService.getVerifiedCoaches,
  });
};

export const useCoach = (id: number) => {
  return useQuery({
    queryKey: ['coaches', id],
    queryFn: () => coachService.getCoachById(id),
    enabled: !!id,
  });
};

export const useSearchCoaches = (specialty: string) => {
  return useQuery({
    queryKey: ['coaches', 'search', specialty],
    queryFn: () => coachService.searchCoachesBySpecialty(specialty),
    enabled: !!specialty,
  });
};

// Mutations
export const useCreateCoach = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coachService.createCoach,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
};

export const useUpdateCoach = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, coach }: { id: number; coach: Partial<Coach> }) =>
      coachService.updateCoach(id, coach),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
};

export const useDeleteCoach = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coachService.deleteCoach,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
};

import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 2 days
      cacheTime: 1000 * 60 * 60 * 24 * 2,
    },
  },
});

export default queryClient;

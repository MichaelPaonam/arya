export const redisClient = {
  get: async (_key: string): Promise<string | null> => {
    throw new Error("Not implemented");
  },
  set: async (_key: string, _value: string): Promise<void> => {
    throw new Error("Not implemented");
  },
  lpush: async (_key: string, _value: string): Promise<void> => {
    throw new Error("Not implemented");
  },
};

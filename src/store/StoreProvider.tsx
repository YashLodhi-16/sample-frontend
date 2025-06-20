import type { Socket } from "socket.io-client";
import React, { use, useState } from "react";

export interface IStoreContext {
  socket: Socket | null;
  user: { userName: string } | null;
  setStore: React.Dispatch<
    React.SetStateAction<Pick<IStoreContext, "socket" | "user">>
  >;
}
const StoreContext = React.createContext<IStoreContext>({
  socket: null,
  user: null,
  setStore() {},
});

export const useStore = () => {
  return use(StoreContext);
};

const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [store, setStore] = useState<Pick<IStoreContext, "socket" | "user">>({
    socket: null,
    user: null,
  });

  return (
    <StoreContext.Provider value={{ ...store, setStore }}>
      {children}
    </StoreContext.Provider>
  );
};

export default StoreProvider;

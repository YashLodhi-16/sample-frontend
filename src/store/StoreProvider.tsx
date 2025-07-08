import { io, type Socket } from "socket.io-client";
import React, { use, useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "@/constants/constants";
import userInfo from "@/lib/userInfo";
import PeerService from "@/services/peer";

export interface User {
  userName: string;
  _id: string;
}

export interface IStoreContext {
  socket: Socket;
  user: User | null;
  setStore: React.Dispatch<
    React.SetStateAction<Pick<IStoreContext, "user" | "to">>
  >;
  peer: PeerService;
  to: string | null;
}

const StoreContext = React.createContext<IStoreContext | null>(null);

export const useStore = () => {
  const store = use(StoreContext);
  if (!store) {
    throw new Error("Store is Undefined");
  }
  return store;
};

const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const socket = useMemo(
    () =>
      io(BACKEND_URL, {
        path: "/chat",
        withCredentials: true,
        autoConnect: false,
      }),
    []
  );
  const peer = useMemo(() => new PeerService(), []);

  const [store, setStore] = useState<Pick<IStoreContext, "user" | "to">>({
    user: null,
    to: null,
  });

  useEffect(() => {
    (async () => {
      const user = await userInfo();
      if (user) {
        socket.connect();

        if (!store.user) setStore((value) => ({ ...value, user: user.data }));
      }
    })();
  }, [socket, store.user]);

  return (
    <StoreContext.Provider
      value={{
        ...store,
        setStore,
        peer,
        socket,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export default StoreProvider;

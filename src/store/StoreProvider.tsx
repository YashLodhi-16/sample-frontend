import { io, type Socket } from "socket.io-client";
import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "@/constants/constants";
import userInfo from "@/lib/userInfo";

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
  peer: RTCPeerConnection;
  to: string | null;
  remoteStream: MediaStream | null;
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
  const peer = useMemo(
    () =>
      new RTCPeerConnection([
        {
          iceServers: [
            {
              urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun.l.google.com:5349",
              ],
            },
          ],
        },
      ] as RTCConfiguration),
    []
  );

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [store, setStore] = useState<Pick<IStoreContext, "user" | "to">>({
    user: null,
    to: null,
  });

  const handlePeerTrack = useCallback((ev: RTCTrackEvent) => {
    const [stream] = ev.streams;
    setRemoteStream(stream);
    console.log("remote stream added");
  }, []);

  const handlePeerSignalingState = useCallback((ev: Event) => {
    const rtc = ev.target as RTCPeerConnection;
    console.log(rtc.signalingState);
  }, []);

  useEffect(() => {
    peer.addEventListener("track", handlePeerTrack);
    peer.addEventListener("signalingstatechange", handlePeerSignalingState);
    return () => {
      peer.removeEventListener("track", handlePeerTrack);
      peer.removeEventListener(
        "signalingstatechange",
        handlePeerSignalingState
      );
    };
  }, [peer, handlePeerTrack, handlePeerSignalingState]);

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
        remoteStream,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export default StoreProvider;

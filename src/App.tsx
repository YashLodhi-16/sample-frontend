import { useCallback, useEffect } from "react";
import { API_PATH } from "./constants/constants";
import { useStore } from "./store/StoreProvider";
import Login from "./components/custom/Login";
import Chat from "./components/custom/Chat";
import RandomUsers from "./components/custom/RandomUsers";
import Peer from "./components/custom/Peer";

const App = () => {
  const { user, socket, setStore } = useStore();

  useEffect(() => {
    if (!socket.connected && user) {
      socket.connect();
    }

    return () => {
      if (socket.connected) socket.disconnect();
    };
  }, [socket, user]);

  const handleSocketConnectionError = useCallback(
    async (err: Error) => {
      if (err.message === "jwt must be provided") {
        const res = await fetch(API_PATH + "/user" + "/token", {
          credentials: "include",
        });

        const json = await res.json();
        if (res.status === 200) {
          socket.connect();
        } else {
          console.log(json.message);
          setStore((value) => ({ ...value, user: null }));
        }
      } else {
        console.log(err);
      }
    },
    [socket, setStore]
  );

  const handleSocketConnect = useCallback(() => {
    console.log("Socket Id: ", socket.id);
  }, [socket]);

  const handleSocketDisconnect = useCallback((reason: string) => {
    console.log("Disconnected from the Socket: ", reason);
  }, []);

  useEffect(() => {
    const connectError = "connect_error";
    const connect = "connect";
    const disconnect = "disconnect";

    socket.on(connectError, handleSocketConnectionError);
    socket.on(connect, handleSocketConnect);
    socket.on(disconnect, handleSocketDisconnect);

    return () => {
      socket.removeListener(connectError, handleSocketConnectionError);
      socket.removeListener(connect, handleSocketConnect);
      socket.removeListener(disconnect, handleSocketDisconnect);
    };
  }, [
    socket,
    handleSocketConnect,
    handleSocketConnectionError,
    handleSocketDisconnect,
  ]);

  return (
    <div className="container mx-auto max-w-3/4 py-20 flex flex-col gap-10">
      <div>
        <h1 className="font-bold text-2xl text-center mb-2">Socket.io</h1>
        {socket.connected && (
          <h2 className="font-bold text-lg text-center">
            Your Socket ID: {socket.id}
          </h2>
        )}
      </div>

      <Login />

      {user && <RandomUsers />}

      {user && <Chat />}

      {user && <Peer />}
    </div>
  );
};

export default App;

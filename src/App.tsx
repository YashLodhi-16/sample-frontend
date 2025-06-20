import { useEffect, useState } from "react";
import { API_PATH, BACKEND_URL } from "./constants/constants";
import { io } from "socket.io-client";
import { useStore } from "./store/StoreProvider";
import Login from "./components/custom/login";
import Chat from "./components/custom/Chat";
import RandomUsers from "./components/custom/RandomUsers";
import type { IRandomUsers } from "./types/common";

const App = () => {
  const { user, socket, setStore } = useStore();
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [to, setTo] = useState<IRandomUsers | null>(null);

  // handle socket
  useEffect(() => {
    // only connect when user is logged in
    if (!socket && user) {
      const _socket = io(BACKEND_URL, {
        path: "/chat",
        withCredentials: true,
      });

      // handle connection errors
      _socket.on("connect_error", async (err) => {
        if (err.message === "jwt must be provided") {
          const res = await fetch(API_PATH + "/user" + "/token", {
            credentials: "include",
          });

          if (res.status === 200) {
            _socket.connect();
          } else {
            alert("Please Login Again!");
          }
        }
      });

      // add event listeners to socket
      _socket.on("connect", () => {
        setStore((value) => ({ ...value, socket: _socket }));

        // Add
        console.log("connected to _socket, ", _socket.id);

        _socket.on("chat:message", (message: string) => {
          setChatMessages((value) => [...value, message]);
        });

        _socket.on(
          "error:new-message",
          (error: { data: object; errors: []; message: string }) => {
            console.log(error);
          }
        );

        _socket.on("welcome", (userId) => {
          _socket.data = {
            user: userId,
          };
        });

        _socket.on("disconnect", () => {
          console.log("disconnected with the socket");
        });
      });
    }

    return () => {
      socket?.disconnect();
    };
  }, [socket, user]);

  // send message to a user function

  // login function

  return (
    <div className="container mx-auto max-w-3/4 py-20 flex flex-col gap-10">
      <h1 className="font-bold text-2xl text-center">Socket.io</h1>
      {socket && (
        <h2 className="font-bold text-2xl text-center">
          Your Socket ID: {socket.id}
        </h2>
      )}

      {!user && <Login />}

      {user && <RandomUsers setTo={setTo} />}

      {user && <Chat chatMessages={chatMessages} to={to} />}
    </div>
  );
};

export default App;

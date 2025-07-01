import React, { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

import { useStore } from "@/store/StoreProvider";
import { API_PATH } from "@/constants/constants";
import userInfo from "@/lib/userInfo";

const Chat = () => {
  const { socket, to } = useStore();

  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [messageReceivedFrom, setMessageReceivedFrom] = useState<string | null>(
    null
  );

  const [thatUser, setThatUser] = useState<string>("Random");
  useEffect(() => {
    if (to) {
      (async () => {
        const user = await userInfo(to);

        if (user) {
          setThatUser(user.data.userName);
        } else {
          console.log(user);
          return;
        }
      })();
    }
  }, [to]);

  const handleSocketChatMessageFailed = useCallback(
    (error: { data: object; errors: []; message: string }) => {
      console.log(error);
    },
    []
  );

  const handleSocketChatMessage = useCallback(
    ({ message, from }: { message: string; from: string }) => {
      setMessageReceivedFrom(from);
      setChatMessages((value) => [...value, message]);
    },
    []
  );

  useEffect(() => {
    const chatMessage = "chat:message";
    const chatMessageFailed = "chat:message:failed";

    socket.on(chatMessage, handleSocketChatMessage);
    socket.on(chatMessageFailed, handleSocketChatMessageFailed);

    return () => {
      socket.removeListener(chatMessage, handleSocketChatMessage);
      socket.removeListener(chatMessageFailed, handleSocketChatMessageFailed);
    };
  }, [socket, handleSocketChatMessage, handleSocketChatMessageFailed]);

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!to) {
      return alert("Please Select a Person You Want to Chat with.");
    }

    socket.emit("chat:message", { to, message });
    setMessage("");
  };

  useEffect(() => {
    let timeOutId: null | NodeJS.Timeout = null;
    if (messageReceivedFrom) {
      timeOutId = setTimeout(() => {
        setMessageReceivedFrom("");
      }, 2000);
    }

    return () => {
      if (timeOutId) clearTimeout(timeOutId);
    };
  }, [messageReceivedFrom]);

  const [previousChatMessages, setPreviousChatMessages] = useState<
    null | { didISend: boolean; message: string; createdAt: string }[]
  >(null);

  const getPreviousChatMessages = useCallback(async () => {
    if (to) {
      const res = await fetch(API_PATH + "/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: to,
        }),
        credentials: "include",
      });

      const json = await res.json();
      if (res.status === 200) {
        setPreviousChatMessages(json.data.chat);
      } else {
        console.log(json);
      }
    }
  }, [to]);

  useEffect(() => {
    getPreviousChatMessages();
  }, [getPreviousChatMessages]);
  return (
    <div className="border border-solid border-gray-400 rounded px-10 py-10 flex justify-center items-center gap-10 flex-col">
      <h4 className="font-bold text-lg">
        Send A Message to:{" "}
        {to ? thatUser : "Please Select a Person You Want to Chat with."}
      </h4>
      <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
        <Input
          type="text"
          placeholder="enter your messages"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        />

        <Button variant="outline" className="cursor-pointer" type="submit">
          Send
        </Button>
      </form>

      <div>
        <h5 className="font-bold text-lg">Chat Message</h5>
        <div className="flex flex-col justify-center items-center">
          {previousChatMessages &&
            previousChatMessages.map((message, index) => {
              return (
                <div key={index}>
                  <p
                    className={`font-bold text-lg ${
                      message.didISend ? "text-right" : "text-left"
                    }`}
                  >
                    {message.message}
                  </p>
                  <p>
                    Created At: {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              );
            })}
        </div>

        {chatMessages.length > 0 && (
          <div>
            <h4 className="font-bold text-lg text-center">
              New Message Received from {messageReceivedFrom}
            </h4>

            {chatMessages.map((chatMessage, i) => {
              return <p key={i}>{chatMessage}</p>;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

import { useStore } from "@/store/StoreProvider";
import type { IRandomUsers } from "@/types/common";

const Chat = ({
  chatMessages,
  to,
}: {
  chatMessages: string[];
  to: IRandomUsers | null;
}) => {
  // send message states

  const [message, setMessage] = useState("");

  const { socket } = useStore();
  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!socket) {
      return alert("socket is not connected");
    }

    if (!to) {
      return alert("Please Select a Person You Want to Chat with.");
    }

    socket.emit("chat:message", { to: to._id, message });
    setMessage("");
  };
  return (
    <div className="border border-solid border-gray-400 rounded px-20 py-20">
      <h4 className="font-bold text-lg">
        Send A Message to:{" "}
        {to ? to.userName : "Please Select a Person You Want to Chat with."}
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
        {chatMessages.length > 0 &&
          chatMessages.map((chatMessage, i) => {
            return <p key={i}>{chatMessage}</p>;
          })}
      </div>
    </div>
  );
};

export default Chat;

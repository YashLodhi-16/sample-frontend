import { ObjectId } from "mongodb";

declare module "socket.io-client" {
  interface Socket {
    data: {
      user: ObjectId;
    };
  }
}

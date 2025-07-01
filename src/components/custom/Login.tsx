import React, { useState } from "react";
import { Input } from "../ui/input";
import { API_PATH } from "@/constants/constants";
import { useStore } from "@/store/StoreProvider";
import { Button } from "../ui/button";

const Login = () => {
  const { setStore, user } = useStore();

  const [email, setEmail] = useState("yashlodhi2006@gmail.com");
  const [password, setPassword] = useState("Yash2006@#$");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await fetch(`${API_PATH}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: email,
        password,
      }),
      credentials: "include",
    });

    const json = await res.json();
    if (res.status === 200) {
      setStore((value) => ({ ...value, user: json.data }));
    } else {
      console.log(json);
    }
  };

  // logout function
  const handleLogout = async () => {
    const res = await fetch(API_PATH + "/user/logout", {
      method: "POST",
      credentials: "include",
    });

    const json = await res.json();
    if (res.status !== 200) {
      console.log(json);
    } else {
      setStore((value) => ({ ...value, user: null }));
    }
  };
  return (
    <div className="border border-solid border-gray-400 rounded px-5 py-5">
      {user ? (
        <div className="font-semibold text-lg flex gap-5 items-center justify-center">
          <p className="capitalize">{user.userName}</p>{" "}
          <Button
            variant="outline"
            className="cursor-pointer"
            type="submit"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="flex flex-col gap-2">
          <Input
            type="text"
            placeholder="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            list="emails"
          />
          <datalist id="emails">
            <option>yashlodhi2006@gmail.com</option>
            <option>Jessyca45@gmail.com</option>
          </datalist>
          <Input
            type="text"
            placeholder="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            list="passwords"
          />
          <datalist id="passwords">
            <option>Yash2006@#$</option>
            <option>qaixf6¬A</option>
          </datalist>

          <Button variant="outline" className="cursor-pointer" type="submit">
            Login
          </Button>
        </form>
      )}
    </div>
  );
};

export default Login;

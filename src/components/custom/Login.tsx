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
    setStore((value) => ({ ...value, user: json.data }));
  };

  // logout function
  const handleLogout = async () => {
    const res = await fetch(API_PATH + "/user/logout", {
      method: "POST",
      credentials: "include",
    });
    if (res.status !== 200) {
      alert("Some Error Occured While Logout.");
    } else {
      setStore((value) => ({ ...value, user: null }));
    }
  };
  return (
    <div className="border border-solid border-gray-400 rounded px-20 py-20">
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
          />
          <Input
            type="text"
            placeholder="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />

          <Button variant="outline" className="cursor-pointer" type="submit">
            Login
          </Button>
        </form>
      )}
    </div>
  );
};

export default Login;

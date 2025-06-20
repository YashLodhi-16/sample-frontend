import type { IRandomUsers } from "@/types/common";
import { API_PATH } from "@/constants/constants";
import { useStore } from "@/store/StoreProvider";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";

const RandomUsers = ({
  setTo,
}: {
  setTo: React.Dispatch<React.SetStateAction<IRandomUsers | null>>;
}) => {
  const { user } = useStore();
  const [randomUsers, setRandomUsers] = useState<IRandomUsers[]>([]);
  const [moreUsersLeft, setMoreUsersLeft] = useState(false);
  const getRandomUsers = async () => {
    const res = await fetch(API_PATH + "/user/random-users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        excludingIds: randomUsers.map((randomUser) => randomUser._id),
      }),
      credentials: "include",
    });

    if (res.status === 200) {
      const json: {
        data: { users: IRandomUsers[]; calc: { remainingUsersCount: number } };
      } = await res.json();
      if (json.data.calc.remainingUsersCount === 0) {
        setMoreUsersLeft(true);
      }
      setRandomUsers((prevIds) => [...prevIds, ...json.data.users]);
    } else {
      alert("Some Error Occured while Fetching Random Users");
    }
  };

  // get random users
  useEffect(() => {
    if (user) getRandomUsers();
    return () => {
      setRandomUsers([]);
    };
  }, [user]);
  return (
    <div>
      <h3 className="font-bold text-xl mb-5">Currently available users</h3>
      <ul className="list-disc flex flex-col gap-4 mb-8">
        {randomUsers.map((randomUser) => {
          return (
            <li
              id={randomUser._id}
              key={randomUser._id}
              onClick={() => {
                setTo(randomUser);
              }}
              className="cursor-pointer shadow-xl px-4 py-2 rounded shadow-gray-200"
            >
              {randomUser.userName}
            </li>
          );
        })}
      </ul>
      <div>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={getRandomUsers}
          disabled={moreUsersLeft}
        >
          Load More Users
        </Button>
      </div>
    </div>
  );
};

export default RandomUsers;

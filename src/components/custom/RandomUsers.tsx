import { API_PATH } from "@/constants/constants";
import { useStore, type User } from "@/store/StoreProvider";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";

const RandomUsers = () => {
  const { setStore } = useStore();

  const [randomUsers, setRandomUsers] = useState<User[]>([]);
  const [moreUsersLeft, setMoreUsersLeft] = useState(false);

  const getRandomUsers = useCallback(async () => {
    if (!moreUsersLeft) {
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

      const json: {
        data: { users: User[]; calc: { remainingUsersCount: number } };
      } = await res.json();

      if (res.status === 200) {
        if (json.data.calc.remainingUsersCount === 0) {
          setMoreUsersLeft(true);
        }
        setRandomUsers((prevIds) => [...prevIds, ...json.data.users]);
      } else {
        console.log(json);
      }
    }
  }, [moreUsersLeft, randomUsers]);

  // get random users
  useEffect(() => {
    getRandomUsers();

    return () => {
      setRandomUsers([]);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
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
                setStore((value) => ({ ...value, to: randomUser._id }));
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

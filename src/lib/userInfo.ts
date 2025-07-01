import { API_PATH } from "@/constants/constants";
import type { IStoreContext } from "@/store/StoreProvider";

export default async function userInfo(id?: string) {
  const URI = id ? API_PATH + "/user/info?id=" + id : API_PATH + "/user/info";
  const res = await fetch(URI, {
    method: "GET",
    credentials: "include",
  });

  const json: { data: NonNullable<IStoreContext["user"]> } = await res.json();
  if (res.status === 200) {
    return json;
  } else {
    console.log(json);
    return null;
  }
}

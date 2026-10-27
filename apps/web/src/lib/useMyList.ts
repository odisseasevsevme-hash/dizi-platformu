"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useSession } from "./useSession";

// Listem: kullanıcının sonra izlemek için kaydettiği başlıklar
export function useMyList() {
  const { session } = useSession();
  const userId = session?.user.id;
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("my_list")
      .select("title_id")
      .order("created_at", { ascending: false })
      .then(({ data }) => setIds((data ?? []).map((row) => row.title_id)));
  }, [userId]);

  const toggle = useCallback(
    async (titleId: string) => {
      if (!userId) {
        router.push("/login");
        return;
      }
      if (ids.includes(titleId)) {
        setIds((current) => current.filter((id) => id !== titleId));
        await supabase.from("my_list").delete().eq("user_id", userId).eq("title_id", titleId);
      } else {
        setIds((current) => [titleId, ...current]);
        await supabase.from("my_list").insert({ user_id: userId, title_id: titleId });
      }
    },
    [ids, userId, router],
  );

  return { ids: userId ? ids : [], toggle, signedIn: !!userId };
}

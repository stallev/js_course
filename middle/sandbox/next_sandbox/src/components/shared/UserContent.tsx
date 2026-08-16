"use client";

import { use } from "react";
import type { UserContentProps } from "@/app/utils/dataAPI";
import PostCard from "@/components/shared/PostCard";
import UserCard from "@/components/shared/UserCard";

export default function UserContent({ profilePromise }: { profilePromise: Promise<UserContentProps> }) {
  const { user, posts, albumStats } = use(profilePromise);
  
  return (
    <div className="flex flex-col gap-8">
      {user && <UserCard {...user} />}

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Posts
          </h2>
          <span className="text-sm text-zinc-500">{posts.length} записей</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Album Stats
        </h2>
        <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {albumStats?.albumCount ?? 0}
        </p>
        <p className="text-sm text-zinc-500">альбомов у пользователя</p>
      </section>
    </div>
  );
}

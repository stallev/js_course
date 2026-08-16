import type { PlaceholderPost } from "@/app/utils/dataAPI";

type PostCardProps = PlaceholderPost;

export default function PostCard({ id, userId, title, body }: PostCardProps) {
  return (
    <article className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <header className="mb-3 flex items-start justify-between gap-3">
        <span className="inline-flex shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          #{id}
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          user {userId}
        </span>
      </header>
      <h3 className="mb-2 text-base font-semibold leading-snug text-zinc-900 capitalize dark:text-zinc-50">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {body}
      </p>
    </article>
  );
}

import type { PlaceholderUser } from "@/app/utils/dataAPI";

type UserCardProps = PlaceholderUser;

export default function UserCard({
  id,
  name,
  username,
  email,
  phone,
  website,
  address,
  company,
}: UserCardProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-700 px-6 py-5 dark:from-zinc-800 dark:to-zinc-900">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg font-semibold text-white ring-2 ring-white/20"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-white">{name}</h2>
            <p className="text-sm text-zinc-300">@{username}</p>
            <p className="mt-0.5 text-xs text-zinc-400">ID {id}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Контакты
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={`mailto:${email}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {email}
              </a>
            </li>
            <li className="text-zinc-700 dark:text-zinc-300">{phone}</li>
            <li>
              <a
                href={`https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {website}
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Адрес
          </h3>
          <address className="not-italic text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {address.street}, {address.suite}
            <br />
            {address.city}, {address.zipcode}
          </address>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Компания
          </h3>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {company.name}
          </p>
          <p className="text-sm italic text-zinc-600 dark:text-zinc-400">
            {company.catchPhrase}
          </p>
        </div>
      </div>
    </section>
  );
}

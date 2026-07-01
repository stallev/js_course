import { Suspense } from "react";
import { resilientProfile } from "@/app/utils/dataTransform";
import UserContent from "@/components/shared/UserContent";
import type { UserContentProps } from "@/app/utils/dataAPI";

export default async function Topic1Page() {
  const profilePromise: Promise<UserContentProps> = resilientProfile("1");

  return <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
    <UserContent profilePromise={profilePromise} />
  </Suspense>;
}

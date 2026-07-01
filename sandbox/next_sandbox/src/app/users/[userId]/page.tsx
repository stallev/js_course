import { Suspense } from "react";
import { resilientProfile } from "@/app/utils/dataTransform";
import UserContent from "@/components/shared/UserContent";
import type { UserContentProps } from "@/app/utils/dataAPI";

export default async function UserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const profilePromise: Promise<UserContentProps> = resilientProfile(userId);
  return <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
    <UserContent profilePromise={profilePromise} />
  </Suspense>;
}
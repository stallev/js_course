import { fetchUserProfile, fetchUserPosts, fetchUserAlbumStats } from "./dataAPI";

export async function resilientProfile(userId: string) {
    const [userResult, postsResult, statsResult] = await Promise.allSettled([
      fetchUserProfile(userId),
      fetchUserPosts(userId),
      fetchUserAlbumStats(userId),
    ]);
  
    return {
      user:       userResult.status === "fulfilled"  ? userResult.value  : null,
      posts:      postsResult.status === "fulfilled" ? postsResult.value : [],
      albumStats: statsResult.status === "fulfilled" ? statsResult.value : null,
    };
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounce = <T extends (...args: any[]) => void>(
  fn: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  return function(this: unknown, ...args: Parameters<T>) {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), wait);
  };
}

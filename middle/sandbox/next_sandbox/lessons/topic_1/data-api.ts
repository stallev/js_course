/**
 * Placeholder Data API для упражнений topic_1.
 *
 * Источник: https://jsonplaceholder.typicode.com
 * Публичный REST API с фейковыми данными — стандарт для обучения fetch/Server Components.
 *
 * В Server Component / route handler используй тот же паттерн:
 *   const user = await fetchUserProfile(userId);
 */

export const PLACEHOLDER_API = "https://jsonplaceholder.typicode.com";

export interface PlaceholderGeo {
  lat: string;
  lng: string;
}

export interface PlaceholderAddress {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
  geo: PlaceholderGeo;
}

export interface PlaceholderCompany {
  name: string;
  catchPhrase: string;
  bs: string;
}

export interface PlaceholderUser {
  id: number;
  name: string;
  username: string;
  email: string;
  address: PlaceholderAddress;
  phone: string;
  website: string;
  company: PlaceholderCompany;
}

export interface PlaceholderPost {
  id: number;
  userId: number;
  title: string;
  body: string;
}

/** Количество альбомов пользователя — третий независимый запрос для Promise.all */
export interface UserAlbumStats {
  albumCount: number;
}

async function parseJson<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`${label}: HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchUserProfile(
  userId: string | number
): Promise<PlaceholderUser> {
  const res = await fetch(`${PLACEHOLDER_API}/users/${userId}`);
  return parseJson(res, `fetchUserProfile(${userId})`);
}

export async function fetchUserPosts(
  userId: string | number
): Promise<PlaceholderPost[]> {
  const res = await fetch(`${PLACEHOLDER_API}/posts?userId=${userId}`);
  return parseJson(res, `fetchUserPosts(${userId})`);
}

export async function fetchUserAlbumStats(
  userId: string | number
): Promise<UserAlbumStats> {
  const res = await fetch(`${PLACEHOLDER_API}/albums?userId=${userId}`);
  const albums = await parseJson<unknown[]>(res, `fetchUserAlbumStats(${userId})`);
  return { albumCount: albums.length };
}

/** Для демо Promise.allSettled: заведомо неверный URL → rejected */
export async function fetchUserProfileBroken(
  userId: string | number
): Promise<PlaceholderUser> {
  const res = await fetch(`${PLACEHOLDER_API}/users/${userId}/not-found`);
  return parseJson(res, `fetchUserProfileBroken(${userId})`);
}

export async function fetchPlaceholderPost(
  postId: number
): Promise<PlaceholderPost> {
  const res = await fetch(`${PLACEHOLDER_API}/posts/${postId}`);
  return parseJson(res, `fetchPlaceholderPost(${postId})`);
}

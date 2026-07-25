import { type CollectionEntry, getCollection } from "astro:content";
import { collectionDateSort } from "@/utils/date";

export async function getAllNotes(): Promise<CollectionEntry<"note">[]> {
	return await getCollection("note");
}

export function getSortedNotes(notes: CollectionEntry<"note">[]) {
	return [...notes].sort(collectionDateSort);
}

export function getLatestNotes(notes: CollectionEntry<"note">[], limit: number) {
	return getSortedNotes(notes).slice(0, limit);
}

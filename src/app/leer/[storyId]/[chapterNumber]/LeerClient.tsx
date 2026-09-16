"use client";

import { useParams } from "next/navigation";
import { MobileReaderView } from "@/app/m/leer/page";

export default function LeerClient() {
  const params = useParams();
  const storyId = typeof params?.storyId === "string" ? params.storyId : "";
  const chapterNumber = params?.chapterNumber ? parseInt(String(params.chapterNumber), 10) : 1;

  return <MobileReaderView storyId={storyId} chapterNumber={chapterNumber} />;
}

"use client";

import { useParams } from "next/navigation";
import { MobileStoryDetailView } from "@/app/m/historia/page";

export default function HistoriaClient() {
  const params = useParams();
  const storyId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  return <MobileStoryDetailView storyId={storyId} />;
}

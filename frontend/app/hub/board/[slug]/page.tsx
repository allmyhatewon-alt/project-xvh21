import { Suspense } from "react";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import { FeedView } from "@/components/Hub/FeedView";

export default function BoardPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense>
      <HubShell rightRail={<RightRail />}>
        <FeedView initialBoardSlug={params.slug} />
      </HubShell>
    </Suspense>
  );
}

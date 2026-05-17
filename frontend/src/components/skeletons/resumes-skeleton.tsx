import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ResumesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="h-3 w-1/3" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

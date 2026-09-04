import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { getSignedPhotoUrl } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

export function PhotoBukti({
  path,
  className,
  alt,
}: {
  path: string | null;
  className?: string;
  alt: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let aktif = true;
    if (!path) {
      setUrl(null);
      return;
    }
    getSignedPhotoUrl(path).then((u) => {
      if (aktif) setUrl(u);
    });
    return () => {
      aktif = false;
    };
  }, [path]);

  if (!path || !url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md border border-dashed border-border bg-secondary text-muted-foreground",
          className,
        )}
      >
        <ImageOff className="size-4" />
      </div>
    );
  }

  return <img src={url} alt={alt} className={cn("rounded-md object-cover", className)} />;
}

import { Container } from "@/components/ui/Container";

export default function SavedLoading() {
  return (
    <Container className="pb-16 pt-6">
      <div className="mb-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-glass-border"></div>
        <div className="mt-2 h-4 w-64 rounded bg-glass-border"></div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-glass-border">
        <div className="h-10 w-24 rounded-t bg-glass-border"></div>
        <div className="h-10 w-32 rounded-t bg-glass-border"></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex h-[100px] items-center gap-4 rounded-[1.25rem] border border-glass-border bg-glass p-4 animate-pulse"
          >
            <div className="h-[60px] w-[60px] shrink-0 rounded-2xl bg-glass-border"></div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-3/4 rounded bg-glass-border"></div>
              <div className="h-3 w-1/2 rounded bg-glass-border"></div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}

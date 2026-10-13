export type Rating = 1 | 2 | 3 | 4 | 5;
export const STAR_PATH = "m12 16.3-3.7 2.825q-.275.225-.6.213t-.575-.188-.387-.475-.013-.65L8.15 13.4l-3.625-2.575q-.3-.2-.375-.525t.025-.6.35-.488.6-.212H9.6l1.45-4.8q.125-.35.388-.538T12 3.475t.563.188.387.537L14.4 9h4.475q.35 0 .6.213t.35.487.025.6-.375.525L15.85 13.4l1.425 4.625q.125.35-.012.65t-.388.475-.575.188-.6-.213z";

export function RatingStars({ rating, className = "" }: { rating: Rating; className?: string }) {
  return <span className={`inline-flex shrink-0 gap-0.5 text-saffron ${className}`} dir="ltr" role="img" data-rating={rating} aria-label={`${rating.toLocaleString("fa-IR")} از ۵`}>
    {Array.from({ length: 5 }, (_, index) => <svg key={index} viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden><path d={STAR_PATH} fill={index < rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" opacity={index < rating ? 1 : 0.35} /></svg>)}
  </span>;
}

export function PageBanner({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="container page-banner-wrap">
      <div className="page-banner">
        <img className="page-banner-bg" src="/images/shapes/white-vectors.svg" alt="" />
        <div className="page-banner-content">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

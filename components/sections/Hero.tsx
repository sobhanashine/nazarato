import { SearchIcon } from "@/components/icons";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-blob-1" />
      <div className="hero-blob-2" />
      <div className="hero-blob-3" />
      <div className="hero-blob-4" />
      <div className="container">
        <div className="hero-content">
          <h1>به <strong>نظراتو</strong> خوش اومدید!</h1>
          <p>وبسایت ما در حال توسعه‌ست، منتظر خبرای خوب باشید <span>;)</span></p>
          <div className="search-box">
            <input type="text" placeholder="کسب و کار مورد نظر خودتو سرچ کن ..." />
            <span className="search-icon"><SearchIcon /></span>
          </div>
        </div>
      </div>
    </section>
  );
}

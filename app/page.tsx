import Link from "next/link";

export default function Home() {
  return (
    <main className="menu-page">
      <div className="menu">
        <h1 className="logo menu__logo">WordBox</h1>
        <p className="menu__tagline">
          Fill every row <strong>and</strong> column with a valid word.
        </p>

        <div className="menu__modes">
          <Link href="/play" className="menu__card">
            <div className="menu__card-grid">
              {Array(16).fill(null).map((_, i) => (
                <div key={i} className="menu__cell" />
              ))}
            </div>
            <div className="menu__card-size">4 × 4</div>
            <div className="menu__card-label">Classic</div>
            <div className="menu__card-desc">8 words · 2 hints · harder</div>
          </Link>

          <Link href="/play/3x3" className="menu__card">
            <div className="menu__card-grid menu__card-grid--3x3">
              {Array(9).fill(null).map((_, i) => (
                <div key={i} className="menu__cell" />
              ))}
            </div>
            <div className="menu__card-size">3 × 3</div>
            <div className="menu__card-label">Quick</div>
            <div className="menu__card-desc">6 words · 1 hint · faster</div>
          </Link>
        </div>
      </div>
    </main>
  );
}

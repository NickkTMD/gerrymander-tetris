const USE_IMAGE_LOGO = true;

export default function GameLogo() {
  if (USE_IMAGE_LOGO) {
    return (
      <div className="game-title">
        <img src="/Logo.png" alt="Gerrymander Tetris" className="logo-image" />
      </div>
    );
  }

  return (
    <div className="game-title">
      <div className="title-sub">{'GERRYMANDER'.split('').map((ch, i) => (
        <span key={i} className={`title-letter title-letter-${i}`}>{ch}</span>
      ))}</div>
      <div className="title-main">TETRIS</div>
    </div>
  );
}

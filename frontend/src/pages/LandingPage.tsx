import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Check, Download, RotateCcw, Sparkles, X } from 'lucide-react';
import '../App.css';

type Book = {
  id: number;
  title: string;
  author: string;
  category: string;
  gutenbergId: number;
  sourceUrl: string;
};

type ReaderState = {
  book: Book;
  pages: string[];
  page: number;
  loading: boolean;
  error?: string;
  opening: boolean;
};

const fallbackSeed: [string, string, string, number][] = [
  ['Pride and Prejudice','Jane Austen','Discipline',1342],['Meditations','Marcus Aurelius','Discipline',2680],['The Republic','Plato','Money & Mindset',1497],['The Prince','Niccolò Machiavelli','Strategy',1232],['The Science of Getting Rich','Wallace D. Wattles','Money & Mindset',59844],['The Art of War','Sun Tzu','Strategy',17405],['Self-Reliance','Ralph Waldo Emerson','Motivation',16643],['Walden','Henry David Thoreau','Mindset',205],['The Prophet','Kahlil Gibran','Mindset',58585],['As a Man Thinketh','James Allen','Motivation',4507],['The Time Machine','H. G. Wells','Curiosity',35],['Jane Eyre','Charlotte Brontë','Discipline',1260],['Wuthering Heights','Emily Brontë','Mindset',768],['Little Women','Louisa May Alcott','Motivation',37106],['Frankenstein','Mary Shelley','Curiosity',84],['Dracula','Bram Stoker','Curiosity',345],['The Great Gatsby','F. Scott Fitzgerald','Ambition',64317],['The Adventures of Sherlock Holmes','Arthur Conan Doyle','Strategy',1661],['A Tale of Two Cities','Charles Dickens','Discipline',98],['The Count of Monte Cristo','Alexandre Dumas','Resilience',1184],['The Odyssey','Homer','Resilience',1727],['The Iliad','Homer','Strategy',6130],['The Picture of Dorian Gray','Oscar Wilde','Mindset',174],['The Metamorphosis','Franz Kafka','Mindset',5200],['The Wonderful Wizard of Oz','L. Frank Baum','Curiosity',55],['The Secret Garden','Frances Hodgson Burnett','Motivation',17396],['The Call of the Wild','Jack London','Resilience',215],['The Jungle Book','Rudyard Kipling','Discipline',236],['The Importance of Being Earnest','Oscar Wilde','Mindset',844],['The Art of Money Getting','P. T. Barnum','Money & Mindset',8581],
];

const fallbackBooks: Book[] = fallbackSeed.map(([title, author, category, gutenbergId], index) => ({
  id: index + 1, title, author, category, gutenbergId,
  sourceUrl: `https://www.gutenberg.org/ebooks/${gutenbergId}`,
}));

function paginate(text: string, maxChars = 2550) {
  const clean = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const paragraphs = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const pages: string[] = [];
  let current = '';
  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length <= maxChars) { current = next; continue; }
    if (current) pages.push(current);
    if (paragraph.length <= maxChars) { current = paragraph; continue; }
    for (let i = 0; i < paragraph.length; i += maxChars) pages.push(paragraph.slice(i, i + maxChars));
    current = '';
  }
  if (current) pages.push(current);
  return pages.length ? pages : ['The book text is empty.'];
}

function BookTile({ book, index, onOpen }: { book: Book; index: number; onOpen: (book: Book) => void }) {
  return (
    <button className="library-book" onClick={(event) => { event.stopPropagation(); onOpen(book); }} aria-label={`Read ${book.title}`}>
      <div className="book-topline"><span>{String(index + 1).padStart(2, '0')}</span><span>{book.category}</span></div>
      <div className="book-content"><div className="book-name">{book.title}</div><div className="book-writer">{book.author}</div></div>
      <span className="book-free">READ</span>
    </button>
  );
}

function Brand() {
  return <a className="brand" href="#top" aria-label="Library OS home"><img className="brand-mark" src="/logo-mark.png" alt="" /><span className="brand-name"><span>Library</span><strong>OS</strong></span></a>;
}

function CoverArtwork({ book, className = '' }: { book: Book; className?: string }) {
  const [failed, setFailed] = useState(false);
  const coverUrl = `https://www.gutenberg.org/cache/epub/${book.gutenbergId}/pg${book.gutenbergId}.cover.medium.jpg`;
  return (
    <div className={`cover-art ${className}`}>
      {!failed ? (
        <img src={coverUrl} alt={`${book.title} original cover`} onError={() => setFailed(true)} />
      ) : (
        <div className="cover-fallback">
          <span>PUBLIC DOMAIN</span>
          <strong>{book.title}</strong>
          <small>{book.author}</small>
        </div>
      )}
    </div>
  );
}

function ReaderPage({ text, pageNumber, side, interactive = false, onActivate }: {
  text: string;
  pageNumber: number;
  side: 'left' | 'right';
  interactive?: boolean;
  onActivate?: () => void;
}) {
  return (
    <article
      className={`reader-page reader-page-${side} ${interactive ? 'reader-page-interactive' : ''}`}
      onClick={interactive ? onActivate : undefined}
      aria-label={interactive ? `${side === 'right' ? 'Next' : 'Previous'} page` : undefined}
    >
      <div className="reader-running-head">Library OS · {side === 'left' ? 'READING' : 'CONTINUED'}</div>
      <div className="reader-text">{text || ' '}</div>
      <span className="reader-page-number">{pageNumber}</span>
      {interactive && <span className="page-turn-hint" aria-hidden="true">{side === 'right' ? 'NEXT' : 'PREVIOUS'}</span>}
    </article>
  );
}

function BookReader({ state, onClose, onPage, onDownload }: {
  state: ReaderState;
  onClose: () => void;
  onPage: (page: number) => void;
  onDownload: () => void;
}) {
  const { book, pages, page, loading, error, opening } = state;
  const [turn, setTurn] = useState<'next' | 'prev' | null>(null);
  const [mobilePage, setMobilePage] = useState(page);
  const isTurning = turn !== null;
  const hasContent = !loading && !error && pages.length > 0;
  const nextDesktop = page + 2 < pages.length;
  const prevDesktop = page > 0;
  const nextMobile = mobilePage + 1 < pages.length;
  const prevMobile = mobilePage > 0;

  useEffect(() => {
    setMobilePage(page);
  }, [page]);

  const turnPage = (direction: 'next' | 'prev') => {
    if (!hasContent || isTurning) return;
    const isMobile = window.matchMedia('(max-width: 720px)').matches;
    const current = isMobile ? mobilePage : page;
    const next = direction === 'next' ? current + 1 : current - 1;
    const allowed = direction === 'next' ? next < pages.length : next >= 0;
    if (!allowed) return;
    setTurn(direction);
    window.setTimeout(() => {
      setTurn(null);
      if (isMobile) setMobilePage(next);
      onPage(next);
    }, 760);
  };

  useEffect(() => {
    const stage = document.querySelector('.reader-book-spread');
    if (!stage) return;
    let startX = 0;
    const onTouchStart = (event: Event) => {
      const touch = (event as TouchEvent).touches[0];
      startX = touch.clientX;
    };
    const onTouchEnd = (event: Event) => {
      const touch = (event as TouchEvent).changedTouches[0];
      const delta = touch.clientX - startX;
      if (Math.abs(delta) > 45) turnPage(delta < 0 ? 'next' : 'prev');
    };
    stage.addEventListener('touchstart', onTouchStart, { passive: true });
    stage.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchend', onTouchEnd);
    };
  }, [turn, page, mobilePage, pages.length, hasContent]);

  const isMobile = window.matchMedia('(max-width: 720px)').matches;
  const visiblePage = isMobile ? mobilePage : page;
  const rightPage = pages[visiblePage + 1] ?? '';
  const leftPage = pages[visiblePage] ?? '';
  const turnText = turn === 'next' ? (isMobile ? leftPage : rightPage) : leftPage;
  const turnNumber = visiblePage + 1;
  const revealedText = turn === 'next' ? pages[visiblePage + (isMobile ? 1 : 2)] ?? '' : pages[visiblePage - 1] ?? '';
  const revealedNumber = turn === 'next' ? visiblePage + (isMobile ? 2 : 3) : visiblePage;

  return (
    <motion.div className="reader-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="reader-topbar">
        <button className="reader-close" onClick={onClose}><X size={16} /> <span>Close</span></button>
        <div className="reader-book-title"><span>{book.title}</span><small>{book.author} · {book.category}</small></div>
        <div className="reader-actions"><button className="reader-download" onClick={onDownload} disabled={loading || !!error}><Download size={14} /><span>Save JSON</span></button></div>
      </div>

      <div className={`reader-stage ${opening ? 'is-opening' : 'is-open'}`}>
        <div className="reader-cover-opening">
          <div className="cover-shell"><CoverArtwork book={book} /></div>
        </div>

        <div className="reader-book-spread">
          {loading ? (
            <div className="reader-loading"><div className="reader-spinner" /><span>Opening the full book from the C++ library core…</span></div>
          ) : error ? (
            <div className="reader-error"><h3>Book text could not be loaded.</h3><p>{error}</p><a href={book.sourceUrl} target="_blank" rel="noreferrer">Check the public-domain source →</a></div>
          ) : (
            <>
              <ReaderPage text={leftPage} pageNumber={visiblePage + 1} side="left" interactive onActivate={() => turnPage('prev')} />
              <ReaderPage text={rightPage} pageNumber={visiblePage + 2} side="right" interactive onActivate={() => turnPage('next')} />

              {turn && (
                <>
                  <div className={`reader-revealed-page ${turn === 'next' ? 'reveal-right' : 'reveal-left'}`}>
                    <ReaderPage text={revealedText} pageNumber={revealedNumber} side={turn === 'next' ? 'right' : 'left'} />
                  </div>
                  <div className={`reader-turning-page turn-${turn}`}>
                    <div className="turn-face turn-front">
                      <ReaderPage text={turnText} pageNumber={turnNumber} side={turn === 'next' ? 'right' : 'left'} />
                    </div>
                    <div className="turn-face turn-back">
                      <ReaderPage text={turnText} pageNumber={turnNumber} side={turn === 'next' ? 'left' : 'right'} />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="reader-controls">
        <button onClick={() => turnPage('prev')} disabled={!hasContent || isTurning || (isMobile ? !prevMobile : !prevDesktop)}><ArrowLeft size={15} /> <span>Previous</span></button>
        <div className="reader-progress">
          <span>{pages.length ? `${visiblePage + 1} / ${pages.length}` : '—'}</span>
          <i><b style={{ width: `${pages.length ? ((visiblePage + 1) / pages.length) * 100 : 0}%` }} /></i>
        </div>
        <button onClick={() => turnPage('next')} disabled={!hasContent || isTurning || (isMobile ? !nextMobile : !nextDesktop)}> <span>Next</span> <ArrowRight size={15} /></button>
      </div>
      <div className="reader-mobile-note">Tap the right page for next · tap the left page for previous · swipe left or right on mobile.</div>
    </motion.div>
  );
}

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const [introDone, setIntroDone] = useState(false);
  const [view, setView] = useState<'home' | 'library'>('home');
  const [arranged, setArranged] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [books, setBooks] = useState<Book[]>(fallbackBooks);
  const [backendOnline, setBackendOnline] = useState(false);
  const [reader, setReader] = useState<ReaderState | null>(null);
  const [scrollActivated, setScrollActivated] = useState(false);

  useEffect(() => {
    if (reduceMotion) { setIntroDone(true); return; }
    const timer = window.setTimeout(() => setIntroDone(true), 4200);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  useEffect(() => {
    const activate = () => setScrollActivated(true);
    window.addEventListener('scroll', activate, { passive: true });
    window.addEventListener('wheel', activate, { passive: true });
    window.addEventListener('touchmove', activate, { passive: true });
    return () => { window.removeEventListener('scroll', activate); window.removeEventListener('wheel', activate); window.removeEventListener('touchmove', activate); };
  }, []);

  useEffect(() => {
    fetch('/api/books')
      .then((response) => { if (!response.ok) throw new Error('Backend offline'); return response.json(); })
      .then((data: Book[]) => { if (Array.isArray(data) && data.length) setBooks(data); setBackendOnline(true); })
      .catch(() => setBackendOnline(false));
  }, []);

  useEffect(() => {
    if (!reader) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = old; };
  }, [reader]);

  const orbitBooks = useMemo(() => books.map((book, index) => ({ book, index, angle: index * 12 })), [books]);
  const enterLibrary = () => { setArranged(false); setReplayKey((k) => k + 1); setView('library'); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); };
  const replayOrbit = () => { setArranged(false); setReplayKey((k) => k + 1); };

  const openBook = async (book: Book) => {
    setReader({ book, pages: [], page: 0, loading: true, opening: true });
    window.setTimeout(() => setReader((r) => r ? { ...r, opening: false } : r), reduceMotion ? 40 : 1100);
    try {
      const response = await fetch(`/api/books/${book.id}/content`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: `Backend returned HTTP ${response.status}.` }));
        throw new Error(body.error || `Backend returned HTTP ${response.status}.`);
      }
      const payload = await response.json() as { text: string };
      const pages = paginate(payload.text);
      setReader((r) => r ? { ...r, pages, loading: false } : r);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load the full book.';
      setReader((r) => r ? { ...r, loading: false, error: `${message} Start the C++ Library OS backend on port 8080 and try again.` } : r);
    }
  };

  const downloadBook = () => {
    if (!reader || !reader.pages.length) return;
    const payload = { id: reader.book.id, title: reader.book.title, author: reader.book.author, category: reader.book.category, source: reader.book.sourceUrl, pages: reader.pages, exportedAt: new Date().toISOString(), poweredBy: 'Library OS C++ OOP Core' };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${reader.book.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`; anchor.click(); URL.revokeObjectURL(url);
  };

  const shellClass = `site-shell ${scrollActivated ? 'scroll-activated' : ''}`;
  return (
    <div className={shellClass} id="top">
      <AnimatePresence>{reader && <BookReader state={reader} onClose={() => setReader(null)} onPage={(page) => setReader((r) => r ? { ...r, page: Math.max(0, Math.min(page, Math.max(0, r.pages.length - 1))) } : r)} onDownload={downloadBook} />}</AnimatePresence>
      <AnimatePresence>
        {!introDone && <motion.div className="intro-screen" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 1.1 } }}><div className="intro-logo-scene"><motion.img src="/logo-mark.png" alt="Library OS" className="intro-logo" initial={{ rotateY: 180, scale: .72, opacity: .3 }} animate={{ rotateY: 0, scale: 1, opacity: 1 }} transition={{ duration: 2.6, ease: [0.16,1,.3,1] }} /><motion.div className="intro-wordmark" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.2, duration: 1.1 }}>Library<strong>OS</strong></motion.div><motion.p className="intro-tagline" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.8, duration: 1 }}>A smarter way to read</motion.p></div></motion.div>}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'home' ? (
          <motion.div key="home" className="page" initial={{ opacity: 0 }} animate={{ opacity: introDone ? 1 : 0 }} transition={{ duration: 1 }}>
            <header className="nav"><Brand /><div className="nav-status"><span className={backendOnline ? 'status-dot online' : 'status-dot'} /> {backendOnline ? 'C++ CORE CONNECTED' : 'C++ CORE OFFLINE'}</div></header>
            <main>
              <section className="hero">
                <div className="hero-copy-block scroll-ink">
                  <div className="eyebrow"><span /> C++ POWERED DIGITAL LIBRARY</div>
                  <h1>Read with <em>intention.</em><br />Keep what matters.</h1>
                  <p>A calm reading system backed by an object-oriented C++ library core. Thirty public-domain books, cached locally after the first read, with a reader designed around the book itself.</p>
                  <button className="hero-enter" onClick={enterLibrary}><span>Enter the Library</span><span className="hero-enter-icon"><ArrowRight size={19} /></span></button>
                  <div className="hero-stats"><div><strong>30</strong><span>public-domain books</span></div><div><strong>C++</strong><span>OOP backend</span></div><div><strong>∞</strong><span>pages to explore</span></div></div>
                </div>
                <div className="hero-art" aria-hidden="true"><div className="art-halo" /><motion.img src="/logo-mark.png" alt="" className="hero-logo" animate={{ y: [0,-5,0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} /><div className="hero-logo-shadow" /></div>
              </section>
              <section className="manifesto scroll-ink"><div className="manifesto-line" /><div><span>THE IDEA</span><p>Less noise. More depth. The interface stays quiet until you interact with it.</p></div><Sparkles size={19} /></section>
            </main>
          </motion.div>
        ) : (
          <motion.div key="library" className="library-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }}>
            <header className="library-nav"><button className="back-button" onClick={() => setView('home')}><span className="back-arrow">←</span> Library OS</button><div className="library-nav-label">THE COLLECTION · 30 TITLES · C++ CORE</div><button className="replay-button" onClick={replayOrbit}><RotateCcw size={14} /> Replay</button></header>
            <main className="collection-main">
              <section className="collection-heading scroll-ink"><div><div className="eyebrow"><span /> FREE READING COLLECTION</div><h2>Thirty ideas,<br /><em>one orbit.</em></h2></div><p>Every book follows the same circular path with fixed spacing and upright covers. Hover on desktop or tap on mobile to settle the collection into a numbered shelf.</p></section>
              <section className={`orbit-room ${arranged ? 'is-arranged' : ''}`} onMouseEnter={() => setArranged(true)} onClick={() => setArranged(true)} aria-label="Thirty book collection">
                <div className="room-grid" /><div className="room-glow" />
                <div className="orbit-core"><div className="core-mark"><BookOpen size={23} /></div><span>LIBRARY OS</span><small>{arranged ? 'ORDERED COLLECTION' : 'HOVER / TAP TO ARRANGE'}</small></div>
                {!arranged && <div className="orbit-system" key={replayKey}>
                  <div className="orbit-ring orbit-ring-outer">{orbitBooks.slice(0, 15).map(({ book, index, angle }) => <div className="orbit-position" key={book.id} style={{ '--angle': `${angle * 2}deg` } as CSSProperties}><div className="orbit-upright"><BookTile book={book} index={index} onOpen={openBook} /></div></div>)}</div>
                  <div className="orbit-ring orbit-ring-inner">{orbitBooks.slice(15).map(({ book, index, angle }) => <div className="orbit-position" key={book.id} style={{ '--angle': `${angle * 2}deg` } as CSSProperties}><div className="orbit-upright"><BookTile book={book} index={index} onOpen={openBook} /></div></div>)}</div>
                </div>}
                {arranged && <motion.div className="ordered-grid" initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7 }}>{books.map((book, index) => <motion.div key={book.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35, delay: Math.min(index * .015, .35) }}><BookTile book={book} index={index} onOpen={openBook} /></motion.div>)}</motion.div>}
              </section>
              <div className="collection-footnote"><span className={backendOnline ? 'connection-pill online' : 'connection-pill'}>{backendOnline ? <><Check size={12} /> C++ backend connected</> : 'C++ backend not running'}</span><span>Tap a book to open the complete text inside Library OS.</span></div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

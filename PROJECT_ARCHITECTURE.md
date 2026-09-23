# Library OS — College Project Architecture

## Main context

The browser is the presentation layer. The C++17 backend is the library domain layer and owns the book catalog, user abstraction, book retrieval, and local content cache.

```text
React + Vite UI
      │
      │ /api/*
      ▼
C++17 Library OS Core
      │
      ├── Book (encapsulation)
      ├── User (abstraction)
      │    ├── StudentUser (inheritance)
      │    └── LibrarianUser (inheritance + polymorphism)
      └── LibraryService (composition + business logic)
             │
             ├── Project Gutenberg HTTPS retrieval
             └── data/cache/*.txt
```

## Why this is useful for the college demonstration

The project is not just a React mockup. The UI calls the C++ service for its catalog and complete book content. The backend demonstrates the four common OOP concepts directly in the code and provides an observable REST API that can be shown during a viva.

## Reading workflow

1. User enters the library.
2. Thirty books orbit in two clean, equally spaced circular paths.
3. Hovering on desktop or tapping on mobile arranges them into the numbered collection.
4. Selecting a book calls `GET /api/books/{id}/content`.
5. The C++ service downloads the public-domain text on the first request and caches it locally.
6. Library OS paginates the complete text into a two-page reader.
7. On mobile the reader switches to a single-page layout.
8. `Save JSON` exports the loaded book and its pages as a local JSON file.

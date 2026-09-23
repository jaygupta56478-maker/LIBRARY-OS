# Library OS v4 redesign notes

## Product direction

Library OS is treated as a college-grade full-stack library product: React is the presentation layer and the C++17 OOP service is the application/domain layer.

## Frontend

- Transparent version of the supplied logo mark; no cream square around the mark.
- Quiet editorial typography that begins low-contrast and gains full brand contrast on first user scroll/gesture.
- Slow, restrained motion rather than high-frequency card transitions.
- Two clean circular book orbits with mathematically fixed 12° spacing and upright cards.
- Desktop hover and mobile tap both trigger the ordered collection.
- Book cards open the internal reader rather than redirecting to an external page.
- Reader shows a real two-page spread on desktop and one page on mobile.
- Complete public-domain text is requested from the C++ backend and cached locally after first successful retrieval.
- JSON export saves the loaded book's metadata and paginated text.

## Backend / OOP

- `Book` demonstrates encapsulation.
- `User` is an abstract base class.
- `StudentUser` and `LibrarianUser` demonstrate inheritance and polymorphism.
- `LibraryService` owns the catalog and content cache.
- REST API: health, catalog, individual metadata, and complete text endpoints.
- Project Gutenberg text is downloaded over HTTPS on first read and stored under `backend/data/cache`.

# Library OS — C++ OOP backend

This is the college-project backend. The browser UI is intentionally connected to this C++ service instead of keeping the library logic only in React.

## OOP concepts used

- **Encapsulation:** `Book` keeps its state private and exposes getters.
- **Abstraction:** `User` is an abstract base class with a pure virtual `displayRole()`.
- **Inheritance:** `StudentUser` and `LibrarianUser` inherit from `User`.
- **Polymorphism:** the server starts through a `User` pointer and calls the overridden role method.
- **Composition:** `LibraryService` owns the `std::vector<Book>` catalog and controls book retrieval/cache behavior.

## API

- `GET /api/health`
- `GET /api/books`
- `GET /api/books/{id}`
- `GET /api/books/{id}/content`

The content endpoint downloads the public-domain Project Gutenberg plain-text edition on first read and stores it under `backend/data/cache`. Future reads come from the local cache, so the book becomes locally readable through Library OS after its first successful fetch.

## Build

From the `backend` directory:

```powershell
cmake -S . -B build
cmake --build build --config Release
```

Then run the executable from the backend directory so `data/cache` and the frontend path resolve correctly:

```powershell
.\build\bin\LibraryOS.exe
```

The API listens on `http://localhost:8080`.

> CMake fetches `cpp-httplib` during configuration and the backend uses OpenSSL for HTTPS requests to Project Gutenberg. The first build therefore needs an internet connection.

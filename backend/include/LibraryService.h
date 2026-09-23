#ifndef LIBRARY_SERVICE_H
#define LIBRARY_SERVICE_H

#include "Book.h"
#include <string>
#include <vector>

class LibraryService {
private:
    std::vector<Book> books;
    std::string cacheDirectory;

    std::string downloadText(int gutenbergId) const;
    std::string cachePath(int gutenbergId) const;
    static std::string cleanGutenbergText(const std::string& text);

public:
    explicit LibraryService(std::string cacheDirectory = "data/cache");

    void seedCatalog();
    const std::vector<Book>& getBooks() const;
    const Book* findBook(int id) const;
    std::string getBookText(int id);

    static std::string escapeJson(const std::string& value);
    std::string booksJson() const;
};

#endif

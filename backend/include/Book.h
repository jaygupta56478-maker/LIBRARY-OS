#ifndef BOOK_H
#define BOOK_H

#include <string>

// Encapsulation: book state is private and exposed through methods.
class Book {
private:
    int id;
    std::string title;
    std::string author;
    std::string isbn;
    std::string category;
    int gutenbergId;

public:
    Book(int id, std::string title, std::string author, std::string isbn,
         std::string category, int gutenbergId);

    int getId() const;
    const std::string& getTitle() const;
    const std::string& getAuthor() const;
    const std::string& getIsbn() const;
    const std::string& getCategory() const;
    int getGutenbergId() const;
};

#endif

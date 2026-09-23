#include "Book.h"
#include <utility>

Book::Book(int id, std::string title, std::string author, std::string isbn,
           std::string category, int gutenbergId)
    : id(id), title(std::move(title)), author(std::move(author)), isbn(std::move(isbn)),
      category(std::move(category)), gutenbergId(gutenbergId) {}

int Book::getId() const { return id; }
const std::string& Book::getTitle() const { return title; }
const std::string& Book::getAuthor() const { return author; }
const std::string& Book::getIsbn() const { return isbn; }
const std::string& Book::getCategory() const { return category; }
int Book::getGutenbergId() const { return gutenbergId; }

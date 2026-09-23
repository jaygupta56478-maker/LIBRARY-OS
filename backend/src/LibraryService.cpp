#include "LibraryService.h"

#define CPPHTTPLIB_OPENSSL_SUPPORT
#include <httplib.h>

#include <filesystem>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <utility>

namespace fs = std::filesystem;

LibraryService::LibraryService(std::string cacheDirectory)
    : cacheDirectory(std::move(cacheDirectory)) {
    fs::create_directories(this->cacheDirectory);
    seedCatalog();
}

void LibraryService::seedCatalog() {
    books = {
        Book(1, "Pride and Prejudice", "Jane Austen", "", "Discipline", 1342),
        Book(2, "Meditations", "Marcus Aurelius", "", "Discipline", 2680),
        Book(3, "The Republic", "Plato", "", "Money & Mindset", 1497),
        Book(4, "The Prince", "Niccolò Machiavelli", "", "Strategy", 1232),
        Book(5, "The Science of Getting Rich", "Wallace D. Wattles", "", "Money & Mindset", 59844),
        Book(6, "The Art of War", "Sun Tzu", "", "Strategy", 17405),
        Book(7, "Self-Reliance", "Ralph Waldo Emerson", "", "Motivation", 16643),
        Book(8, "Walden", "Henry David Thoreau", "", "Mindset", 205),
        Book(9, "The Prophet", "Kahlil Gibran", "", "Mindset", 58585),
        Book(10, "As a Man Thinketh", "James Allen", "", "Motivation", 4507),
        Book(11, "The Time Machine", "H. G. Wells", "", "Curiosity", 35),
        Book(12, "Jane Eyre", "Charlotte Brontë", "", "Discipline", 1260),
        Book(13, "Wuthering Heights", "Emily Brontë", "", "Mindset", 768),
        Book(14, "Little Women", "Louisa May Alcott", "", "Motivation", 37106),
        Book(15, "Frankenstein", "Mary Shelley", "", "Curiosity", 84),
        Book(16, "Dracula", "Bram Stoker", "", "Curiosity", 345),
        Book(17, "The Great Gatsby", "F. Scott Fitzgerald", "", "Ambition", 64317),
        Book(18, "The Adventures of Sherlock Holmes", "Arthur Conan Doyle", "", "Strategy", 1661),
        Book(19, "A Tale of Two Cities", "Charles Dickens", "", "Discipline", 98),
        Book(20, "The Count of Monte Cristo", "Alexandre Dumas", "", "Resilience", 1184),
        Book(21, "The Odyssey", "Homer", "", "Resilience", 1727),
        Book(22, "The Iliad", "Homer", "", "Strategy", 6130),
        Book(23, "The Picture of Dorian Gray", "Oscar Wilde", "", "Mindset", 174),
        Book(24, "The Metamorphosis", "Franz Kafka", "", "Mindset", 5200),
        Book(25, "The Wonderful Wizard of Oz", "L. Frank Baum", "", "Curiosity", 55),
        Book(26, "The Secret Garden", "Frances Hodgson Burnett", "", "Motivation", 17396),
        Book(27, "The Call of the Wild", "Jack London", "", "Resilience", 215),
        Book(28, "The Jungle Book", "Rudyard Kipling", "", "Discipline", 236),
        Book(29, "The Importance of Being Earnest", "Oscar Wilde", "", "Mindset", 844),
        Book(30, "The Art of Money Getting", "P. T. Barnum", "", "Money & Mindset", 8581)
    };
}

const std::vector<Book>& LibraryService::getBooks() const { return books; }

const Book* LibraryService::findBook(int id) const {
    for (const auto& book : books) {
        if (book.getId() == id) return &book;
    }
    return nullptr;
}

std::string LibraryService::cachePath(int gutenbergId) const {
    return (fs::path(cacheDirectory) / ("book-" + std::to_string(gutenbergId) + ".txt")).string();
}

std::string LibraryService::cleanGutenbergText(const std::string& text) {
    const std::string startMarker = "*** START OF THE PROJECT GUTENBERG EBOOK";
    const std::string endMarker = "*** END OF THE PROJECT GUTENBERG EBOOK";
    size_t start = text.find(startMarker);
    if (start != std::string::npos) {
        start = text.find('\n', start);
        if (start != std::string::npos) ++start;
    } else {
        start = 0;
    }
    size_t end = text.find(endMarker, start);
    std::string clean = text.substr(start, end == std::string::npos ? std::string::npos : end - start);
    while (clean.find("\r\n") != std::string::npos) clean.replace(clean.find("\r\n"), 2, "\n");
    while (clean.find("\n\n\n\n") != std::string::npos) clean.replace(clean.find("\n\n\n\n"), 4, "\n\n");
    return clean;
}

std::string LibraryService::downloadText(int gutenbergId) const {
    httplib::SSLClient client("www.gutenberg.org", 443);
    client.set_follow_location(true);
    client.set_connection_timeout(10, 0);
    client.set_read_timeout(30, 0);

    const std::string path = "/cache/epub/" + std::to_string(gutenbergId) + "/pg" + std::to_string(gutenbergId) + ".txt";
    auto response = client.Get(path.c_str());
    if (!response) throw std::runtime_error("Project Gutenberg could not be reached.");
    if (response->status != 200) throw std::runtime_error("Project Gutenberg returned HTTP " + std::to_string(response->status) + ".");
    return cleanGutenbergText(response->body);
}

std::string LibraryService::getBookText(int id) {
    const Book* book = findBook(id);
    if (!book) throw std::runtime_error("Book not found.");

    const std::string path = cachePath(book->getGutenbergId());
    if (fs::exists(path)) {
        std::ifstream in(path, std::ios::binary);
        std::ostringstream buffer;
        buffer << in.rdbuf();
        return buffer.str();
    }

    const std::string text = downloadText(book->getGutenbergId());
    std::ofstream out(path, std::ios::binary);
    out << text;
    return text;
}

std::string LibraryService::escapeJson(const std::string& value) {
    std::string out;
    out.reserve(value.size() + 8);
    for (unsigned char c : value) {
        switch (c) {
            case '\\': out += "\\\\"; break;
            case '"': out += "\\\""; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            default:
                if (c < 0x20) out += ' ';
                else out += static_cast<char>(c);
        }
    }
    return out;
}

std::string LibraryService::booksJson() const {
    std::ostringstream output;
    output << '[';
    for (size_t i = 0; i < books.size(); ++i) {
        const auto& book = books[i];
        if (i) output << ',';
        output << "{\"id\":" << book.getId()
               << ",\"title\":\"" << escapeJson(book.getTitle())
               << "\",\"author\":\"" << escapeJson(book.getAuthor())
               << "\",\"category\":\"" << escapeJson(book.getCategory())
               << "\",\"gutenbergId\":" << book.getGutenbergId()
               << ",\"sourceUrl\":\"https://www.gutenberg.org/ebooks/" << book.getGutenbergId() << "\"}";
    }
    output << ']';
    return output.str();
}

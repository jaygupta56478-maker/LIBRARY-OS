#define CPPHTTPLIB_OPENSSL_SUPPORT
#include <httplib.h>
#include "LibraryService.h"
#include "User.h"

#include <iostream>
#include <memory>
#include <string>
#include <stdexcept>


int main() {
    LibraryService library("data/cache");

    // Polymorphism demonstration: both objects are handled through User.
    std::unique_ptr<User> currentUser = std::make_unique<StudentUser>(1, "Library OS Student", "student@libraryos.local", "");
    std::cout << "Library OS C++ core started for role: " << currentUser->displayRole() << "\n";

    httplib::Server server;
    server.set_mount_point("/", "../frontend/dist");

    server.Get("/api/health", [](const httplib::Request&, httplib::Response& response) {
        response.set_content(R"({"status":"ok","engine":"Library OS C++ OOP Core","language":"C++17"})", "application/json");
    });

    server.Get("/api/books", [&](const httplib::Request&, httplib::Response& response) {
        response.set_content(library.booksJson(), "application/json");
    });

    server.Get(R"(/api/books/(\d+))", [&](const httplib::Request& request, httplib::Response& response) {
        const int id = std::stoi(request.matches[1].str());
        const Book* book = library.findBook(id);
        if (!book) {
            response.status = 404;
            response.set_content(R"({"error":"Book not found"})", "application/json");
            return;
        }
        std::string result = "{\"id\":" + std::to_string(book->getId()) + ",\"title\":\"" + LibraryService::escapeJson(book->getTitle()) + "\",\"author\":\"" + LibraryService::escapeJson(book->getAuthor()) + "\",\"category\":\"" + LibraryService::escapeJson(book->getCategory()) + "\",\"gutenbergId\":" + std::to_string(book->getGutenbergId()) + ",\"sourceUrl\":\"https://www.gutenberg.org/ebooks/" + std::to_string(book->getGutenbergId()) + "\"}";
        response.set_content(result, "application/json");
    });

    server.Get(R"(/api/books/(\d+)/content)", [&](const httplib::Request& request, httplib::Response& response) {
        try {
            const int id = std::stoi(request.matches[1].str());
            const Book* book = library.findBook(id);
            if (!book) throw std::runtime_error("Book not found.");
            const std::string text = library.getBookText(id);
            std::string result = "{\"id\":" + std::to_string(id) + ",\"title\":\"" + LibraryService::escapeJson(book->getTitle()) + "\",\"author\":\"" + LibraryService::escapeJson(book->getAuthor()) + "\",\"text\":\"" + LibraryService::escapeJson(text) + "\"}";
            response.set_content(result, "application/json");
        } catch (const std::exception& error) {
            response.status = 502;
            response.set_content(std::string("{\"error\":\"") + LibraryService::escapeJson(error.what()) + "\"}", "application/json");
        }
    });

    std::cout << "Library OS API: http://localhost:8080\n";
    std::cout << "GET /api/books and GET /api/books/{id}/content\n";
    server.listen("0.0.0.0", 8080);
}

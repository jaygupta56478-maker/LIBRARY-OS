#ifndef USER_H
#define USER_H

#include <string>
#include <utility>

// Abstraction: User defines the common contract for every library user.
class User {
protected:
    int id;
    std::string name;
    std::string email;
    std::string phone;
    std::string role;

public:
    User(int id, std::string name, std::string email, std::string phone, std::string role);
    virtual ~User() = default;

    int getId() const;
    std::string getName() const;
    std::string getEmail() const;
    std::string getPhone() const;
    std::string getRole() const;

    // Polymorphism: every derived user describes its role differently.
    virtual std::string displayRole() const = 0;
};

class StudentUser final : public User {
public:
    StudentUser(int id, std::string name, std::string email, std::string phone)
        : User(id, std::move(name), std::move(email), std::move(phone), "Student") {}
    std::string displayRole() const override { return "Student"; }
};

class LibrarianUser final : public User {
public:
    LibrarianUser(int id, std::string name, std::string email, std::string phone)
        : User(id, std::move(name), std::move(email), std::move(phone), "Librarian") {}
    std::string displayRole() const override { return "Librarian"; }
};

#endif

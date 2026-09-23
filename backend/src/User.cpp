#include "User.h"
#include <utility>

User::User(int id, std::string name, std::string email, std::string phone, std::string role)
    : id(id), name(std::move(name)), email(std::move(email)), phone(std::move(phone)), role(std::move(role)) {}

int User::getId() const { return id; }
std::string User::getName() const { return name; }
std::string User::getEmail() const { return email; }
std::string User::getPhone() const { return phone; }
std::string User::getRole() const { return role; }

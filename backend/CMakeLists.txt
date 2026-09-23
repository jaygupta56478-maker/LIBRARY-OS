cmake_minimum_required(VERSION 3.20)
project(LibraryOS VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

find_package(OpenSSL REQUIRED)

include(FetchContent)
set(HTTPLIB_REQUIRE_OPENSSL ON CACHE BOOL "" FORCE)
set(HTTPLIB_USE_OPENSSL_IF_AVAILABLE ON CACHE BOOL "" FORCE)
set(HTTPLIB_USE_ZLIB_IF_AVAILABLE OFF CACHE BOOL "" FORCE)
set(HTTPLIB_USE_BROTLI_IF_AVAILABLE OFF CACHE BOOL "" FORCE)
set(HTTPLIB_USE_ZSTD_IF_AVAILABLE OFF CACHE BOOL "" FORCE)
FetchContent_Declare(httplib
    URL https://github.com/yhirose/cpp-httplib/archive/refs/tags/v0.18.3.tar.gz
    DOWNLOAD_EXTRACT_TIMESTAMP TRUE
)
FetchContent_MakeAvailable(httplib)

file(GLOB SOURCES CONFIGURE_DEPENDS "src/*.cpp")
add_executable(LibraryOS ${SOURCES})
target_include_directories(LibraryOS PRIVATE include)
target_link_libraries(LibraryOS PRIVATE OpenSSL::SSL OpenSSL::Crypto httplib::httplib)

target_compile_definitions(LibraryOS PRIVATE CPPHTTPLIB_OPENSSL_SUPPORT)
if(MSVC)
    target_compile_options(LibraryOS PRIVATE /W4)
else()
    target_compile_options(LibraryOS PRIVATE -Wall -Wextra -Wpedantic)
endif()

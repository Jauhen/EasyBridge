#ifndef EZ_ENGINE_CARD_ENUMS_H_
#define EZ_ENGINE_CARD_ENUMS_H_

#include <exception>
#include <string>
using namespace std;

namespace easybridge {
namespace engine {

class EngineException : public exception {

public:
  EngineException(string str) : error(str) {}

  virtual char const* what() const override {
    throw logic_error(error);
  }

private:
  string error;
};

// card suits
enum class Suit {
  ANY = -1,
  CLUBS = 0,
  DIAMONDS = 1,
  HEARTS = 2,
  SPADES = 3,
  NOTRUMP = 4
};

// majors vs. minors selection
enum class SuitType {
  SUITS_ANY = 0,
  SUITS_MINORS = 1,
  SUITS_MAJORS = 2
};

// honor card values
enum class CardValue {
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
  NINE = 9,
  TEN = 10,
  JACK = 11,
  QUEEN = 12,
  KING = 13,
  ACE = 14
};

// positions
enum class Position {
  UNKNOWN,
  ANY_POS,
  SOUTH,
  WEST,
  NORTH,
  EAST,
  TABLE
};

const string kSuitNameShort[5] = { "C", "D", "H", "S", "NT" };

const string kFaceCard[5] = { "T", "J", "Q", "K", "A" };

} // namespace engine
} // namespace easybride

#endif // !EZ_ENGINE_CARD_ENUMS_H_

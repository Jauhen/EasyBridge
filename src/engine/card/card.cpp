#include <iostream> 
#include "card.h"

namespace easybridge {
namespace engine {

const char* kCard[] = {
  " ", " ", "2", "3", "4", "5", "6", "7",
  "8", "9", "T", "J", "Q", "K", "A"
};
const char* kSuit[5] = { "C", "D", "H", "S", "N" };
const char* kCardName[15] = { "", "", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Jack", "Queen", "King", "Ace" };
const char* kSuitName[5] = { "Clubs", "Diamonds", "Hearts", "Spades", "No Trump" };
const char* kSuitNameSingular[5] = { "Club", "Diamond", "Heart", "Spade", "No Trump" };

const string kFaceValueName[] = {
  "", "", "two", "three", "four", "five", "six", "seven",
  "eight", "nine", "ten", "Jack", "Queen", "King", "Ace"
};

string GenerateName(const char* templ, const char* suit, const char* value) {
  char buffer[50];
  sprintf_s(buffer, templ, suit, value);
  return std::string(buffer);
}


Card::Card() {
}


Card::~Card() {
}

void Card::Initialize(Suit suit, CardValue value) {
  // check limits
  if ((suit == Suit::ANY) || (suit > Suit::NOTRUMP)) {
    throw new EngineException("Incorrect suit provided: %s");
  }

  //
  this->suit = suit;
  faceValue = value;
  deckValue = static_cast<int>(suit) * 13 + static_cast<int>(value) - 2;

  int suitNumber = static_cast<int>(suit);
  int valueNumber = static_cast<int>(value);
  name = GenerateName("%s%s", kSuit[suitNumber], kCard[valueNumber]);
  fullName = GenerateName("%s of %s", kCardName[valueNumber], kSuitName[suitNumber]);
  faceName = kFaceValueName[valueNumber];
  reverseFullName = GenerateName("%s %s", kSuitNameSingular[suitNumber], kCardName[valueNumber]);
  assigned = false;
}

void Card::Clear() {
  assigned = false;
  faceUp = false;
  owner = -1;
}

//
string Card::GetCardLetter() const {
  return string(kCard[static_cast<int>(faceValue)]);
}

//
string Card::GetSuitLetter() const {
  return string(kSuit[static_cast<int>(suit)]);
}


} // namespace engine
} // namespace easybride

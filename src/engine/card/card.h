#ifndef EZ_ENGINE_CARD_CARD_H_
#define EZ_ENGINE_CARD_CARD_H_

#include <string>
#include "card_enums.h"

namespace easybridge {
namespace engine {

using namespace std;

// TODO(kutsuk): method to extract
//Used in CardList:
//SetOwner
//GetSuit
//GetFaceValue
//GetDeskValue
//GetName
//SetFaceUp

class Card {
public:
  Card();
  ~Card();

  void Card::Initialize(Suit suit, CardValue value);
  void Clear();

  // GetName() -- "D7"
  string GetName() const { return name; }
  // GetFullName() -- "7 of Diamonds"
  string GetFullName()  const { return fullName; }
  // GetReverseFullName() -- "Diamond 7"
  string GetReverseFullName()  const { return reverseFullName; }
  // GetFaceName() -- "seven"
  string GetFaceName()  const { return faceName; }
  // GetCardLetter() -- "7"
  string GetCardLetter() const;
  // GetSuitLetter() -- "D"
  string GetSuitLetter() const;

  Suit GetSuit() const { return suit; }

  bool IsCardAssigned() const { return assigned; }
  void SetAssigned(bool assign = true) { assigned = assign; }
  void ClearAssignment() { assigned = false; }

  int GetOwner() const { return owner; }
  void SetOwner(int player) {
    owner = player;
    if (owner == -1) {
      assigned = false;
    }
  }

  bool IsCardFaceUp() const { return faceUp; }
  void SetFaceUp(bool faceUp = true) { this->faceUp = faceUp; }
  void SetFaceDown() { faceUp = false; }

  // overloaded operators
  bool operator>(Card& compareCard) { return deckValue > compareCard.GetDeckValue(); }
  bool operator<(Card& compareCard) { return deckValue < compareCard.GetDeckValue(); }
  bool operator==(Card& compareCard) { return deckValue == compareCard.GetDeckValue(); }
  bool operator>=(Card& compareCard) { return deckValue >= compareCard.GetDeckValue(); }
  bool operator<=(Card& compareCard) { return deckValue <= compareCard.GetDeckValue(); }
  bool operator>(CardValue value) { return faceValue > value; }
  bool operator<(CardValue value) { return faceValue < value; }
  bool operator==(CardValue value) { return faceValue == value; }
  bool operator>=(CardValue value) { return faceValue >= value; }
  bool operator<=(CardValue value) { return faceValue <= value; }
  friend int operator+(Card& c, CardValue value) { return static_cast<int>(c.faceValue) + static_cast<int>(value); }
  friend int operator-(Card& c, CardValue value) { return static_cast<int>(c.faceValue) - static_cast<int>(value); }
  friend int operator+(Card& c1, Card& c2) { return static_cast<int>(c1.faceValue) + static_cast<int>(c2.faceValue); }
  friend int operator-(Card& c1, Card& c2) { return static_cast<int>(c1.faceValue) - static_cast<int>(c2.faceValue); }

  CardValue GetFaceValue() const { return faceValue; }
  int GetDeckValue() const { return deckValue; }
  int GetSortedDeckIndex() const { return deckValue; }

private:
  std::string	name, faceName, fullName, reverseFullName;
  Suit suit;
  CardValue faceValue;
  int deckValue;

  int owner;
  bool assigned;
  bool faceUp;
};

} // namespace engine
} // namespace easybride


#endif // !EZ_ENGINE_CARD_CARD_H_

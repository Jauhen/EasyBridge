#include "gtest/gtest.h"
#include "engine/card/card.h"

TEST(Cards, GenerateNames) {
  using namespace easybridge::engine;

  Card* c = new Card();
  c->Initialize(Suit::DIAMONDS, CardValue::KING);
  EXPECT_EQ(Suit::DIAMONDS, c->GetSuit());
  EXPECT_STREQ("DK", c->GetName().c_str());
  EXPECT_STREQ("D", c->GetSuitLetter().c_str());
  EXPECT_STREQ("K", c->GetCardLetter().c_str());
  EXPECT_STREQ("King", c->GetFaceName().c_str());
  EXPECT_STREQ("King of Diamonds", c->GetFullName().c_str());
  EXPECT_STREQ("Diamond King", c->GetReverseFullName().c_str());
}

TEST(Cards, OperationsOverload) {
  using namespace easybridge::engine;

  Card* c1 = new Card();
  c1->Initialize(Suit::SPADES, CardValue::QUEEN);
  Card* c2 = new Card();
  c2->Initialize(Suit::HEARTS, CardValue::SIX);

  EXPECT_TRUE(*c1 > *c2);
  EXPECT_TRUE(*c1 > CardValue::SEVEN);
  EXPECT_TRUE(*c2 == CardValue::SIX);
  EXPECT_EQ(18, *c1 + *c2);
}
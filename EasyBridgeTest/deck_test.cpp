#include "stdafx.h"
#include <memory>
#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "mock_app.h"
#include "../src/engine/deck.h"

using namespace ::testing;
using namespace std;

namespace UnitTests {

class DeckTests : public Test {
protected:
  shared_ptr<MockApp> app = make_shared<MockApp>();
  shared_ptr<Settings> settings = make_shared<Settings>();
  CDeck d{app, settings};
};

TEST_F(DeckTests, Init) {
  d.InitializeCards();
}

} // namespace UnitTests

#include "stdafx.h"
#include <memory>
#include <gtest/gtest.h>

#include "../src/model/settings.h"

using namespace ::testing;
using namespace std;

namespace UnitTests {

class SettingsTests : public Test {
protected:
  Settings s;
};

TEST_F(SettingsTests, Init) {
  s.InitializeAll();

  EXPECT_EQ(4.0, s.GetCustomAceValue());
}

} // namespace UnitTests

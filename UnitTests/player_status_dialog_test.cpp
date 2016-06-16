#include "stdafx.h"
#include "CppUnitTest.h"
#include <gmock/gmock.h>
#include "../src/engine/PlayerStatusDialog.h"
#include "mock_app.h"

using namespace Microsoft::VisualStudio::CppUnitTestFramework;

namespace UnitTests {		

TEST_CLASS(PlayerStatusDialogTests) {
public:
  CPlayerStatusDialog* p;
  AppInterface* app = new MockApp;

  TEST_CLASS_INITIALIZE(classSetupOnce) {
    int argc = 0;
    char ** argv = 0;
    ::testing::InitGoogleMock(&argc, argv);
    ::testing::GTEST_FLAG(throw_on_failure) = true;
  }

  TEST_METHOD_INITIALIZE(SetUp) {
    p = new CPlayerStatusDialog(app);
  }

  TEST_METHOD_CLEANUP(TearDown) {
    delete p;
  }
		
	TEST_METHOD(Init) {

    *p << "Hello";

    Assert::AreEqual("123", "123");
	}
};

} // namespace UnitTests

#include "stdafx.h"
#include "CppUnitTest.h"
#include <gmock/gmock.h>
#include "../src/engine/PlayerStatusDialog.h"
#include "mock_app.h"

using namespace Microsoft::VisualStudio::CppUnitTestFramework;
using ::testing::AtLeast;
using ::testing::Return;
using ::testing::_;

namespace UnitTests {		

TEST_CLASS(PlayerStatusDialogTests) {
public:
  CPlayerStatusDialog* p;
  MockApp app;

  TEST_CLASS_INITIALIZE(classSetupOnce) {
    int argc = 0;
    char ** argv = 0;
    ::testing::InitGoogleMock(&argc, argv);
    ::testing::GTEST_FLAG(throw_on_failure) = true;
  }

  TEST_METHOD_INITIALIZE(SetUp) {
    p = new CPlayerStatusDialog((AppInterface*) &app);
  }

  TEST_METHOD_CLEANUP(TearDown) {
    delete p;
  }
		
	TEST_METHOD(Init) {
    EXPECT_CALL(app, IsEnableAnalysisTracing()).WillRepeatedly(Return(true));
    EXPECT_CALL(app, AnalysisTraceLevel()).WillOnce(Return(5));
    EXPECT_CALL(app, SetAnalysisText(_, _)).Times(1);
    EXPECT_CALL(app, SetAutoHintDialogHintText(_)).Times(0);

    *p << "!Hello\nWorld";  
  }
};

} // namespace UnitTests

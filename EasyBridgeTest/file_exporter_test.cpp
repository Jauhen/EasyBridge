#include "stdafx.h"
#include <memory>
#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "../src/model/file_exporter.h"

using namespace ::testing;
using namespace std;

namespace UnitTests {

class FileExporterTest : public Test {
};

TEST_F(FileExporterTest, Init) {
  FileExporter f{};

  f.WriteComment("Some comment");
  f.WriteLine("Some line");
  f.WriteLine(3, "10/02/2015");
  f.WriteLine(5, 5);

  string result =
    string("%% Some comment\n") +
    string("Some line\n") +
    string("[DATE \"10/02/2015\"]\n") +
    string("[BOARD \"5\"]\n");

  EXPECT_EQ(result, f.GetFileContent());
}

} // namespace UnitTests
